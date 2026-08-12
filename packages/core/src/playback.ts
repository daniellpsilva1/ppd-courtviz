/**
 * Point-by-point playback domain for 2D court replay.
 *
 * Timing is reconstructed from shot geometry + speed when video timestamps
 * are missing (typical for SwingVision fixture exports). Score is derived by
 * replaying point winners — fixtures often lack games rows / score-after-point.
 */

import type { EnrichedShot } from "./stats";
import { pointKeyFromShot } from "./stats";

export type Side = "host" | "guest";
export type PointFigure = 0 | 15 | 30 | 40 | "AD";

export interface ScoreState {
  hostPoints: PointFigure;
  guestPoints: PointFigure;
  hostGames: number;
  guestGames: number;
  hostSets: number;
  guestSets: number;
  setNumber: number;
  gameNumber: number;
  isTiebreak: boolean;
  /** Display string like "40-30" or "AD-40" or TB "3-2" */
  pointLabel: string;
  setScoreLabel: string;
}

export interface TimedShot {
  shot: EnrichedShot;
  /** Seconds from episode start when this shot begins (hit) */
  startSec: number;
  /** Seconds from episode start when ball reaches bounce */
  endSec: number;
  hitX: number;
  hitY: number;
  bounceX: number;
  bounceY: number;
}

export interface PointEpisode {
  key: string;
  setNumber: number;
  gameNumber: number;
  pointNumber: number;
  pointWinner: Side | null;
  endedBy: string | null;
  isBreakPoint: boolean;
  isSetPoint: boolean;
  isMatchPoint: boolean;
  server: Side | null;
  shots: TimedShot[];
  /** Score immediately before this point is played */
  scoreBefore: ScoreState;
  /** Score immediately after this point */
  scoreAfter: ScoreState;
  /** Duration of this episode in seconds (including end dwell) */
  durationSec: number;
}

export interface PlaybackTimingConfig {
  /** Fallback speed (km/h) when shot.speedKmh is null */
  defaultSpeedKmh?: number;
  /** Minimum flight time (seconds) */
  minFlightSec?: number;
  /** Maximum flight time (seconds) */
  maxFlightSec?: number;
  /** Dwell after bounce before next shot */
  bounceDwellSec?: number;
  /** Pause after point ends before next point */
  betweenPointSec?: number;
  /** Extra hold on last shot of a point */
  pointEndDwellSec?: number;
  fps?: number;
}

export interface MatchPlayback {
  episodes: PointEpisode[];
  totalDurationSec: number;
  fps: number;
  totalFrames: number;
}

export interface PlaybackClockState {
  timeSec: number;
  frame: number;
  episodeIndex: number;
  shotIndex: number;
  /** 0–1 progress along current shot flight (hit→bounce) */
  shotProgress: number;
  playing: boolean;
  score: ScoreState;
  episode: PointEpisode | null;
  timedShot: TimedShot | null;
  /** Ball position in court meters, or null between points */
  ball: { x: number; y: number } | null;
}

const DEFAULT_TIMING: Required<PlaybackTimingConfig> = {
  defaultSpeedKmh: 80,
  minFlightSec: 0.35,
  maxFlightSec: 1.4,
  bounceDwellSec: 0.18,
  betweenPointSec: 0.55,
  pointEndDwellSec: 0.45,
  fps: 30,
};

function asSide(value: string | null | undefined): Side | null {
  if (value === "host" || value === "guest") return value;
  return null;
}

function formatPointLabel(
  host: PointFigure,
  guest: PointFigure,
  isTiebreak: boolean,
  hostTb: number,
  guestTb: number,
): string {
  if (isTiebreak) return `${hostTb}-${guestTb}`;
  const h = host === "AD" ? "AD" : String(host);
  const g = guest === "AD" ? "AD" : String(guest);
  return `${h}-${g}`;
}

function nextFigure(p: PointFigure): PointFigure {
  if (p === 0) return 15;
  if (p === 15) return 30;
  if (p === 30) return 40;
  return 40;
}

/**
 * Advance ad scoring for one point. Returns whether the game was won.
 */
function advanceAdPoint(
  host: PointFigure,
  guest: PointFigure,
  winner: Side,
): { host: PointFigure; guest: PointFigure; gameWon: boolean } {
  let h = host;
  let g = guest;
  if (winner === "host") {
    if (h === "AD") return { host: 0, guest: 0, gameWon: true };
    if (g === "AD") return { host: 40, guest: 40, gameWon: false };
    if (h === 40 && g === 40) return { host: "AD", guest: 40, gameWon: false };
    if (h === 40) return { host: 0, guest: 0, gameWon: true };
    return { host: nextFigure(h), guest: g, gameWon: false };
  }
  if (g === "AD") return { host: 0, guest: 0, gameWon: true };
  if (h === "AD") return { host: 40, guest: 40, gameWon: false };
  if (h === 40 && g === 40) return { host: 40, guest: "AD", gameWon: false };
  if (g === 40) return { host: 0, guest: 0, gameWon: true };
  return { host: h, guest: nextFigure(g), gameWon: false };
}

function flightDurationSec(
  hitX: number,
  hitY: number,
  bounceX: number,
  bounceY: number,
  speedKmh: number | null,
  cfg: Required<PlaybackTimingConfig>,
): number {
  const dx = bounceX - hitX;
  const dy = bounceY - hitY;
  const distM = Math.hypot(dx, dy);
  const speed = speedKmh && speedKmh > 5 ? speedKmh : cfg.defaultSpeedKmh;
  // km/h → m/s
  const speedMs = (speed * 1000) / 3600;
  const raw = distM / Math.max(speedMs, 1);
  return Math.min(cfg.maxFlightSec, Math.max(cfg.minFlightSec, raw));
}

function inferServer(shots: EnrichedShot[]): Side | null {
  const serve = shots.find(
    (s) =>
      s.stroke.toLowerCase() === "serve" ||
      (s.type?.toLowerCase().includes("serve") ?? false),
  );
  return asSide(serve?.player ?? null);
}

function emptyScore(setNumber = 1, gameNumber = 1): ScoreState {
  return {
    hostPoints: 0,
    guestPoints: 0,
    hostGames: 0,
    guestGames: 0,
    hostSets: 0,
    guestSets: 0,
    setNumber,
    gameNumber,
    isTiebreak: false,
    pointLabel: "0-0",
    setScoreLabel: "0-0",
  };
}

function snapshotScore(
  base: Omit<ScoreState, "pointLabel" | "setScoreLabel"> & {
    tbHost?: number;
    tbGuest?: number;
  },
): ScoreState {
  const tbHost = base.tbHost ?? 0;
  const tbGuest = base.tbGuest ?? 0;
  return {
    hostPoints: base.hostPoints,
    guestPoints: base.guestPoints,
    hostGames: base.hostGames,
    guestGames: base.guestGames,
    hostSets: base.hostSets,
    guestSets: base.guestSets,
    setNumber: base.setNumber,
    gameNumber: base.gameNumber,
    isTiebreak: base.isTiebreak,
    pointLabel: formatPointLabel(
      base.hostPoints,
      base.guestPoints,
      base.isTiebreak,
      tbHost,
      tbGuest,
    ),
    setScoreLabel: `${base.hostSets}-${base.guestSets}`,
  };
}

/**
 * Build ordered point episodes with reconstructed timing and derived score.
 */
export function buildPointEpisodes(
  shots: EnrichedShot[],
  timing: PlaybackTimingConfig = {},
): PointEpisode[] {
  const cfg = { ...DEFAULT_TIMING, ...timing };
  const byPoint = new Map<string, EnrichedShot[]>();

  for (const shot of shots) {
    const key = pointKeyFromShot(shot);
    const list = byPoint.get(key);
    if (list) list.push(shot);
    else byPoint.set(key, [shot]);
  }

  // Stable chronological order by set/game/point
  const keys = [...byPoint.keys()].sort((a, b) => {
    const pa = a.split("-").map(Number);
    const pb = b.split("-").map(Number);
    return (pa[0] ?? 0) - (pb[0] ?? 0)
      || (pa[1] ?? 0) - (pb[1] ?? 0)
      || (pa[2] ?? 0) - (pb[2] ?? 0);
  });

  let hostPoints: PointFigure = 0;
  let guestPoints: PointFigure = 0;
  let hostGames = 0;
  let guestGames = 0;
  let hostSets = 0;
  let guestSets = 0;
  let tbHost = 0;
  let tbGuest = 0;
  let prevSet = keys.length ? Number(keys[0]!.split("-")[0]) : 1;

  const episodes: PointEpisode[] = [];

  for (const key of keys) {
    const pointShots = (byPoint.get(key) ?? []).slice().sort(
      (a, b) => (a.shotNumber ?? 0) - (b.shotNumber ?? 0),
    );
    const first = pointShots[0];
    if (!first) continue;

    const setNumber = first.setNumber;
    const gameNumber = first.gameNumber;
    const pointNumber = first.pointNumber;

    // New set → reset games / points
    if (setNumber !== prevSet) {
      hostGames = 0;
      guestGames = 0;
      hostPoints = 0;
      guestPoints = 0;
      tbHost = 0;
      tbGuest = 0;
      prevSet = setNumber;
    }

    // Standard set: once both sides reach 6 games, remaining points are a tiebreak.
    const inTb = hostGames === 6 && guestGames === 6;

    const scoreBefore = snapshotScore({
      hostPoints: inTb ? 0 : hostPoints,
      guestPoints: inTb ? 0 : guestPoints,
      hostGames,
      guestGames,
      hostSets,
      guestSets,
      setNumber,
      gameNumber,
      isTiebreak: inTb,
      tbHost,
      tbGuest,
    });
    if (inTb) {
      scoreBefore.pointLabel = `${tbHost}-${tbGuest}`;
    }

    const timed: TimedShot[] = [];
    let cursor = 0;
    for (const shot of pointShots) {
      const hitX = shot.hitX ?? shot.bounceX ?? 0;
      const hitY = shot.hitY ?? shot.bounceY ?? 0;
      const bounceX = shot.bounceX ?? hitX;
      const bounceY = shot.bounceY ?? hitY;
      const flight = flightDurationSec(
        hitX,
        hitY,
        bounceX,
        bounceY,
        shot.speedKmh,
        cfg,
      );
      timed.push({
        shot,
        startSec: cursor,
        endSec: cursor + flight,
        hitX,
        hitY,
        bounceX,
        bounceY,
      });
      cursor += flight + cfg.bounceDwellSec;
    }
    if (timed.length > 0) {
      cursor += cfg.pointEndDwellSec - cfg.bounceDwellSec;
    } else {
      cursor = cfg.pointEndDwellSec;
    }
    cursor += cfg.betweenPointSec;

    const winner = asSide(first.pointWinner);
    if (inTb && winner) {
      if (winner === "host") tbHost += 1;
      else tbGuest += 1;
      // Set won at 7 with margin 2 (standard TB)
      if (
        (tbHost >= 7 || tbGuest >= 7) &&
        Math.abs(tbHost - tbGuest) >= 2
      ) {
        if (tbHost > tbGuest) hostSets += 1;
        else guestSets += 1;
        hostGames = 0;
        guestGames = 0;
        tbHost = 0;
        tbGuest = 0;
        hostPoints = 0;
        guestPoints = 0;
      }
    } else if (winner) {
      const advanced = advanceAdPoint(hostPoints, guestPoints, winner);
      hostPoints = advanced.host;
      guestPoints = advanced.guest;
      if (advanced.gameWon) {
        if (winner === "host") hostGames += 1;
        else guestGames += 1;
        hostPoints = 0;
        guestPoints = 0;
        // Set won at 6 with margin 2, or 7 after TB path handled above
        if (
          (hostGames >= 6 || guestGames >= 6) &&
          Math.abs(hostGames - guestGames) >= 2
        ) {
          if (hostGames > guestGames) hostSets += 1;
          else guestSets += 1;
          hostGames = 0;
          guestGames = 0;
        }
      }
    }

    const scoreAfter = snapshotScore({
      hostPoints: inTb ? 0 : hostPoints,
      guestPoints: inTb ? 0 : guestPoints,
      hostGames,
      guestGames,
      hostSets,
      guestSets,
      setNumber,
      gameNumber,
      isTiebreak: inTb && !(tbHost === 0 && tbGuest === 0 && hostSets !== scoreBefore.hostSets),
      tbHost,
      tbGuest,
    });
    if (inTb) {
      scoreAfter.pointLabel = `${tbHost}-${tbGuest}`;
      scoreAfter.isTiebreak = true;
    }

    episodes.push({
      key,
      setNumber,
      gameNumber,
      pointNumber,
      pointWinner: winner,
      endedBy: first.endedBy,
      isBreakPoint: first.isBreakPoint,
      isSetPoint: first.isSetPoint,
      isMatchPoint: first.isMatchPoint,
      server: inferServer(pointShots),
      shots: timed,
      scoreBefore,
      scoreAfter,
      durationSec: cursor,
    });
  }

  return episodes;
}

/**
 * Build a full match playback timeline from enriched shots.
 */
export function buildMatchPlayback(
  shots: EnrichedShot[],
  timing: PlaybackTimingConfig = {},
): MatchPlayback {
  const cfg = { ...DEFAULT_TIMING, ...timing };
  const episodes = buildPointEpisodes(shots, cfg);
  const totalDurationSec = episodes.reduce((sum, e) => sum + e.durationSec, 0);
  const fps = cfg.fps;
  return {
    episodes,
    totalDurationSec,
    fps,
    totalFrames: Math.max(1, Math.ceil(totalDurationSec * fps)),
  };
}

/** Quadratic Bézier point for hit→bounce path. */
export function ballPositionAt(
  shot: TimedShot,
  progress: number,
  curvature = 0.12,
): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, progress));
  const x1 = shot.hitX;
  const y1 = shot.hitY;
  const x2 = shot.bounceX;
  const y2 = shot.bounceY;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const offset = curvature * len;
  const cx = mx - (dy / len) * offset;
  const cy = my + (dx / len) * offset;
  const omt = 1 - t;
  return {
    x: omt * omt * x1 + 2 * omt * t * cx + t * t * x2,
    y: omt * omt * y1 + 2 * omt * t * cy + t * t * y2,
  };
}

export interface ResolvePlaybackOptions {
  /** Absolute match time in seconds */
  timeSec: number;
  playback: MatchPlayback;
  playing?: boolean;
}

/**
 * Resolve clock state at an absolute match time.
 */
export function resolvePlaybackAt(options: ResolvePlaybackOptions): PlaybackClockState {
  const { playback, playing = false } = options;
  const timeSec = Math.min(
    Math.max(0, options.timeSec),
    playback.totalDurationSec,
  );
  const frame = Math.floor(timeSec * playback.fps);

  if (playback.episodes.length === 0) {
    return {
      timeSec,
      frame,
      episodeIndex: 0,
      shotIndex: 0,
      shotProgress: 0,
      playing,
      score: emptyScore(),
      episode: null,
      timedShot: null,
      ball: null,
    };
  }

  let cursor = 0;
  for (let i = 0; i < playback.episodes.length; i++) {
    const episode = playback.episodes[i]!;
    const end = cursor + episode.durationSec;
    // Use strict < so episode boundaries belong to the next episode.
    if (timeSec < end || i === playback.episodes.length - 1) {
      const local = Math.max(0, timeSec - cursor);
      let shotIndex = 0;
      let shotProgress = 0;
      let timedShot: TimedShot | null = null;
      let ball: { x: number; y: number } | null = null;

      for (let s = 0; s < episode.shots.length; s++) {
        const shot = episode.shots[s]!;
        if (local < shot.endSec) {
          shotIndex = s;
          timedShot = shot;
          const span = Math.max(1e-6, shot.endSec - shot.startSec);
          shotProgress = Math.min(1, Math.max(0, (local - shot.startSec) / span));
          if (local >= shot.startSec) {
            ball = ballPositionAt(shot, shotProgress);
          } else if (s > 0) {
            // dwell after previous bounce
            const prev = episode.shots[s - 1]!;
            ball = { x: prev.bounceX, y: prev.bounceY };
            shotIndex = s - 1;
            timedShot = prev;
            shotProgress = 1;
          }
          break;
        }
        if (s === episode.shots.length - 1) {
          shotIndex = s;
          timedShot = shot;
          shotProgress = 1;
          ball = { x: shot.bounceX, y: shot.bounceY };
        }
      }

      // After last shot dwell / between-point: show final bounce, score after
      const lastShotEnd =
        episode.shots.length > 0
          ? episode.shots[episode.shots.length - 1]!.endSec
          : 0;
      const score =
        local > lastShotEnd + 0.2 ? episode.scoreAfter : episode.scoreBefore;

      return {
        timeSec,
        frame,
        episodeIndex: i,
        shotIndex,
        shotProgress,
        playing,
        score,
        episode,
        timedShot,
        ball,
      };
    }
    cursor = end;
  }

  const last = playback.episodes[playback.episodes.length - 1]!;
  const lastShot = last.shots[last.shots.length - 1] ?? null;
  return {
    timeSec: playback.totalDurationSec,
    frame: playback.totalFrames - 1,
    episodeIndex: playback.episodes.length - 1,
    shotIndex: Math.max(0, last.shots.length - 1),
    shotProgress: 1,
    playing,
    score: last.scoreAfter,
    episode: last,
    timedShot: lastShot,
    ball: lastShot
      ? { x: lastShot.bounceX, y: lastShot.bounceY }
      : null,
  };
}

/**
 * Absolute start time (seconds) of an episode within the match playback.
 */
export function episodeStartSec(
  playback: MatchPlayback,
  episodeIndex: number,
): number {
  let t = 0;
  for (let i = 0; i < episodeIndex && i < playback.episodes.length; i++) {
    t += playback.episodes[i]!.durationSec;
  }
  return t;
}

export function createPlaybackClock(playback: MatchPlayback) {
  let timeSec = 0;
  let playing = false;

  return {
    getPlayback: () => playback,
    getState: () =>
      resolvePlaybackAt({ playback, timeSec, playing }),
    play: () => {
      playing = true;
    },
    pause: () => {
      playing = false;
    },
    toggle: () => {
      playing = !playing;
    },
    seek: (sec: number) => {
      timeSec = Math.min(Math.max(0, sec), playback.totalDurationSec);
    },
    seekFrame: (frame: number) => {
      timeSec = Math.min(
        Math.max(0, frame / playback.fps),
        playback.totalDurationSec,
      );
    },
    stepShot: (delta: 1 | -1) => {
      const state = resolvePlaybackAt({ playback, timeSec, playing });
      const ep = state.episode;
      if (!ep) return;
      const nextShot = state.shotIndex + delta;
      if (nextShot >= 0 && nextShot < ep.shots.length) {
        const start = episodeStartSec(playback, state.episodeIndex);
        timeSec = start + ep.shots[nextShot]!.startSec;
        return;
      }
      const nextEp = state.episodeIndex + delta;
      if (nextEp >= 0 && nextEp < playback.episodes.length) {
        timeSec = episodeStartSec(playback, nextEp);
      }
    },
    stepPoint: (delta: 1 | -1) => {
      const state = resolvePlaybackAt({ playback, timeSec, playing });
      const nextEp = state.episodeIndex + delta;
      if (nextEp >= 0 && nextEp < playback.episodes.length) {
        timeSec = episodeStartSec(playback, nextEp);
      }
    },
    /** Advance by dt seconds while playing; no-op when paused. */
    tick: (dtSec: number) => {
      if (!playing) return resolvePlaybackAt({ playback, timeSec, playing });
      timeSec = Math.min(timeSec + dtSec, playback.totalDurationSec);
      if (timeSec >= playback.totalDurationSec) playing = false;
      return resolvePlaybackAt({ playback, timeSec, playing });
    },
    isPlaying: () => playing,
  };
}

export type PlaybackClock = ReturnType<typeof createPlaybackClock>;
