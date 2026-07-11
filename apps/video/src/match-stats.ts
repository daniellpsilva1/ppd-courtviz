import type { EnrichedShot } from "@courtviz/core";
import {
  computeBreakPointConversion,
  computeFirstServeInRate,
  computePointsWonRate,
  computeRallyBucketStats,
  computeZoneWinRatesByPoint,
  pointKeyFromShot,
} from "@courtviz/core";
import type { Point, PlayerStat, SetSummary } from "@courtviz/data";
import {
  computeBreakPointConversionFromOfficial,
  computeFirstServeInFromOfficial,
  computePointsWonFromOfficial,
} from "@courtviz/data";
import {
  enrichedShots,
  guestName,
  hostName,
  momentumPoints,
  points,
  sets,
  stats,
} from "@courtviz/data/fixtures";
import type { VideoMatchContext } from "./match-data";
import { getVideoMatchContext } from "./match-data";

export function formatSetScoreFromSets(matchSets: SetSummary[]): string {
  return matchSets.map((set) => `${set.hostScore}-${set.guestScore}`).join(" · ");
}

export function formatSetScoreDetailedFromSets(matchSets: SetSummary[]): string {
  return matchSets
    .map((set) => {
      const hostTb = set.hostTiebreakScore;
      const guestTb = set.guestTiebreakScore;
      if (hostTb != null && guestTb != null) {
        return `${set.hostScore}-${set.guestScore} (${hostTb}-${guestTb})`;
      }
      return `${set.hostScore}-${set.guestScore}`;
    })
    .join(", ");
}

export function formatMatchResultFromContext(ctx: Pick<VideoMatchContext, "hostName" | "guestName" | "sets">): string {
  const hostSets = ctx.sets.filter((s) => s.hostScore > s.guestScore).length;
  const guestSets = ctx.sets.length - hostSets;
  const winner = hostSets >= guestSets ? ctx.hostName : ctx.guestName;
  return `${winner} wins ${Math.max(hostSets, guestSets)}–${Math.min(hostSets, guestSets)}`;
}

export interface ServiceStats {
  servicePoints: number;
  serviceWon: number;
  serviceWinRate: number;
  servePlusOne: number;
  servePlusOneWon: number;
  servePlusOneRate: number;
}

export interface LongRallyStats {
  hostWon: number;
  guestWon: number;
}

export interface ServeDirectionStats {
  downTheT: number;
  outWide: number;
  avgSpeedKmh: number;
}

export interface MatchStats {
  closingLine: string;
  guestBreakConv: ReturnType<typeof computeBreakPointConversion>;
  guestFirstServe: ReturnType<typeof computeFirstServeInRate>;
  guestName: string;
  guestServeDirections: ServeDirectionStats;
  guestServiceStats: ServiceStats;
  guestWinRate: ReturnType<typeof computePointsWonRate>;
  guestZones: ReturnType<typeof computeZoneWinRatesByPoint>;
  hostBreakConv: ReturnType<typeof computeBreakPointConversion>;
  hostFirstServe: ReturnType<typeof computeFirstServeInRate>;
  hostName: string;
  hostServeDirections: ServeDirectionStats;
  hostServiceStats: ServiceStats;
  hostWinRate: ReturnType<typeof computePointsWonRate>;
  hostZones: ReturnType<typeof computeZoneWinRatesByPoint>;
  longRallyBattle: LongRallyStats;
  totalBreakPoints: number;
  totalSetPoints: number;
  totalShots: number;
}

function deriveRallyLength(shots: EnrichedShot[], pointKey: string): number {
  const pointShots = shots.filter((s) => pointKeyFromShot(s) === pointKey);
  return Math.max(...pointShots.map((s) => s.shotNumber ?? 0), 0);
}

function inferPointServer(shots: EnrichedShot[], pointKey: string): string | null {
  const serve = shots.find(
    (s) =>
      pointKeyFromShot(s) === pointKey &&
      s.stroke === "Serve" &&
      (s.type === "first_serve" || s.type === "First Serve" || s.shotNumber === 1),
  );
  return serve?.player ?? null;
}

function computeServiceStats(
  shots: EnrichedShot[],
  matchPoints: Point[],
  player: "host" | "guest",
): ServiceStats {
  let servicePoints = 0;
  let serviceWon = 0;
  let servePlusOne = 0;
  let servePlusOneWon = 0;

  for (const point of matchPoints) {
    if (!point.pointWinner) continue;
    const key = `${point.setNumber}-${point.gameNumber}-${point.pointNumber}`;
    const server = inferPointServer(shots, key);
    if (server !== player) continue;

    servicePoints++;
    if (point.pointWinner === player) serviceWon++;

    const rallyLen = deriveRallyLength(shots, key);
    if (rallyLen <= 3) {
      servePlusOne++;
      if (point.pointWinner === player) servePlusOneWon++;
    }
  }

  return {
    servicePoints,
    serviceWon,
    serviceWinRate: servicePoints > 0 ? serviceWon / servicePoints : 0,
    servePlusOne,
    servePlusOneWon,
    servePlusOneRate: servePlusOne > 0 ? servePlusOneWon / servePlusOne : 0,
  };
}

function computeLongRallyBattle(shots: EnrichedShot[], matchPoints: Point[]): LongRallyStats {
  let hostWon = 0;
  let guestWon = 0;

  for (const point of matchPoints) {
    if (!point.pointWinner) continue;
    const key = `${point.setNumber}-${point.gameNumber}-${point.pointNumber}`;
    const rallyLen = deriveRallyLength(shots, key);
    if (rallyLen < 7) continue;
    if (point.pointWinner === "host") hostWon++;
    else guestWon++;
  }

  return { hostWon, guestWon };
}

function computeServeDirections(shots: EnrichedShot[], player: "host" | "guest"): ServeDirectionStats {
  const serves = shots.filter(
    (s) =>
      s.player === player &&
      s.stroke === "Serve" &&
      (s.type === "first_serve" || s.type === "First Serve"),
  );
  const downTheT = serves.filter((s) => s.direction?.toLowerCase().includes("t")).length;
  const outWide = serves.filter((s) => s.direction?.toLowerCase().includes("wide")).length;
  const speeds = serves.filter((s) => s.speedKmh != null).map((s) => s.speedKmh!);
  const avgSpeedKmh =
    speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;

  return { downTheT, outWide, avgSpeedKmh };
}

export function topZoneInsight(
  zones: ReturnType<typeof computeZoneWinRatesByPoint>,
): string {
  const top = zones
    .filter((z) => z.total >= 8)
    .sort((a, b) => b.winRate - a.winRate)[0];
  if (!top) return "";
  const label = top.zone.replace(/_/g, " ");
  return `${Math.round(top.winRate * 100)}% (${top.won}/${top.total} pts) from ${label}`;
}

export function buildMatchStats(ctx: VideoMatchContext & { stats?: PlayerStat[] }): MatchStats {
  const hostServiceStats = computeServiceStats(ctx.enrichedShots, ctx.points, "host");
  const guestServiceStats = computeServiceStats(ctx.enrichedShots, ctx.points, "guest");
  const longRallyBattle = computeLongRallyBattle(ctx.enrichedShots, ctx.points);
  const hostZones = computeZoneWinRatesByPoint(ctx.enrichedShots, "host");
  const guestZones = computeZoneWinRatesByPoint(ctx.enrichedShots, "guest");
  const hostWinRate =
    computePointsWonFromOfficial(ctx.stats, "host") ??
    computePointsWonRate(ctx.momentumPoints, "host");
  const guestWinRate =
    computePointsWonFromOfficial(ctx.stats, "guest") ??
    computePointsWonRate(ctx.momentumPoints, "guest");
  const hostFirstServe =
    computeFirstServeInFromOfficial(ctx.stats, "host") ??
    computeFirstServeInRate(ctx.enrichedShots, "host");
  const guestFirstServe =
    computeFirstServeInFromOfficial(ctx.stats, "guest") ??
    computeFirstServeInRate(ctx.enrichedShots, "guest");
  const hostBreakConv =
    computeBreakPointConversionFromOfficial(ctx.stats, "host") ??
    computeBreakPointConversion(ctx.enrichedShots, "host");
  const guestBreakConv =
    computeBreakPointConversionFromOfficial(ctx.stats, "guest") ??
    computeBreakPointConversion(ctx.enrichedShots, "guest");

  return {
    closingLine: `${ctx.hostName} dominated on return — ${Math.round(hostServiceStats.serviceWinRate * 100)}% service points won, ${longRallyBattle.hostWon}–${longRallyBattle.guestWon} in long rallies`,
    guestBreakConv,
    guestFirstServe,
    guestName: ctx.guestName,
    guestServeDirections: computeServeDirections(ctx.enrichedShots, "guest"),
    guestServiceStats,
    guestWinRate,
    guestZones,
    hostBreakConv,
    hostFirstServe,
    hostName: ctx.hostName,
    hostServeDirections: computeServeDirections(ctx.enrichedShots, "host"),
    hostServiceStats,
    hostWinRate,
    hostZones,
    longRallyBattle,
    totalBreakPoints: ctx.points.filter((p) => p.breakPoint).length,
    totalSetPoints: ctx.points.filter((p) => p.setPoint).length,
    totalShots: ctx.enrichedShots.filter((s) => s.result === "In").length,
  };
}

export function getMatchStats(): MatchStats {
  return buildMatchStats(getVideoMatchContext());
}

export function sceneInsightForStats(stats: MatchStats, scene: string): string {
  switch (scene) {
    case "shotRain":
      return `${stats.totalShots.toLocaleString()} tracked shots — every bounce tells the story`;
    case "hexbin":
      return `${stats.hostName} owned the deuce side — ${topZoneInsight(stats.hostZones)}`;
    case "trajectories":
      return `${stats.hostName}: ${topZoneInsight(stats.hostZones)}`;
    case "serve":
      return `${stats.hostName} ${Math.round(stats.hostFirstServe.rate * 100)}% first serve in · avg ${stats.hostServeDirections.avgSpeedKmh} km/h`;
    case "momentum":
      return `${stats.totalBreakPoints} break points — the return game decided this match`;
    case "stats":
      return `${stats.hostName} won ${Math.round(stats.hostServiceStats.serviceWinRate * 100)}% of service points vs ${Math.round(stats.guestServiceStats.serviceWinRate * 100)}% for ${stats.guestName}`;
    default:
      return "";
  }
}

// Fixture-backed exports for landscape video scenes
export function formatSetScore(): string {
  return formatSetScoreFromSets(sets);
}

export function formatSetScoreDetailed(): string {
  return formatSetScoreDetailedFromSets(sets);
}

export function formatMatchResult(): string {
  return formatMatchResultFromContext({ guestName, hostName, sets });
}

const fixtureStats = buildMatchStats({
  enrichedShots,
  guestName,
  hostName,
  matchDate: "",
  momentumPoints,
  points,
  sets,
  stats,
  surface: "hard",
});

export const hostWinRate = fixtureStats.hostWinRate;
export const guestWinRate = fixtureStats.guestWinRate;
export const hostFirstServe = fixtureStats.hostFirstServe;
export const guestFirstServe = fixtureStats.guestFirstServe;
export const hostBreakConv = fixtureStats.hostBreakConv;
export const guestBreakConv = fixtureStats.guestBreakConv;
export const hostRally7 = computeRallyBucketStats(enrichedShots, "host").find((b) => b.bucket === "7+");
export const guestRally7 = computeRallyBucketStats(enrichedShots, "guest").find((b) => b.bucket === "7+");
export const hostZones = fixtureStats.hostZones;
export const guestZones = fixtureStats.guestZones;
export const totalShots = fixtureStats.totalShots;
export const hostServiceStats = fixtureStats.hostServiceStats;
export const guestServiceStats = fixtureStats.guestServiceStats;
export const longRallyBattle = fixtureStats.longRallyBattle;
export const totalBreakPoints = fixtureStats.totalBreakPoints;
export const totalSetPoints = fixtureStats.totalSetPoints;
export const hostServeDirections = fixtureStats.hostServeDirections;
export const guestServeDirections = fixtureStats.guestServeDirections;

export function sceneInsight(scene: string): string {
  return sceneInsightForStats(fixtureStats, scene);
}

export function closingLine(): string {
  return fixtureStats.closingLine;
}
