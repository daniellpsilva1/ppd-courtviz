import { describe, expect, it } from "vitest";
import type { EnrichedShot } from "../stats";
import {
  ballPositionAt,
  buildMatchPlayback,
  buildPointEpisodes,
  createPlaybackClock,
  episodeStartSec,
  resolvePlaybackAt,
} from "../playback";

function shot(
  partial: Partial<EnrichedShot> &
    Pick<EnrichedShot, "player" | "setNumber" | "gameNumber" | "pointNumber">,
): EnrichedShot {
  return {
    stroke: "FH",
    type: "in_play",
    result: "In",
    spin: null,
    speedKmh: 90,
    bounceX: 1,
    bounceY: 6,
    hitX: 0,
    hitY: 20,
    hitZ: 1,
    bounceZone: "deuce",
    bounceSide: "near",
    bounceDepth: "short",
    hitZone: "ad",
    hitSide: "far",
    hitDepth: "deep",
    direction: null,
    isTerminal: false,
    shotNumber: 1,
    pointWinner: "host",
    rallyLength: 1,
    endedBy: null,
    isBreakPoint: false,
    isSetPoint: false,
    isMatchPoint: false,
    ...partial,
  };
}

describe("buildPointEpisodes", () => {
  it("groups shots into ordered episodes with derived score ladder", () => {
    const shots: EnrichedShot[] = [
      shot({
        player: "host",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 1,
        stroke: "Serve",
        type: "first_serve",
        pointWinner: "host",
        hitX: 0,
        hitY: 23,
        bounceX: -1,
        bounceY: 6,
      }),
      shot({
        player: "guest",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 2,
        pointWinner: "host",
        hitX: -1,
        hitY: 5,
        bounceX: 1,
        bounceY: 18,
      }),
      shot({
        player: "host",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 2,
        shotNumber: 1,
        stroke: "Serve",
        pointWinner: "guest",
        hitX: 0,
        hitY: 23,
        bounceX: 1,
        bounceY: 7,
      }),
    ];

    const episodes = buildPointEpisodes(shots);
    expect(episodes).toHaveLength(2);
    expect(episodes[0]!.shots).toHaveLength(2);
    expect(episodes[0]!.server).toBe("host");
    expect(episodes[0]!.scoreBefore.pointLabel).toBe("0-0");
    expect(episodes[0]!.scoreAfter.pointLabel).toBe("15-0");
    expect(episodes[1]!.scoreBefore.pointLabel).toBe("15-0");
    expect(episodes[1]!.scoreAfter.pointLabel).toBe("15-15");
  });

  it("awards a game at game point and resets the point clock", () => {
    const shots: EnrichedShot[] = [];
    // host wins four straight points
    for (let p = 1; p <= 4; p++) {
      shots.push(
        shot({
          player: "host",
          setNumber: 1,
          gameNumber: 1,
          pointNumber: p,
          shotNumber: 1,
          stroke: "Serve",
          pointWinner: "host",
        }),
      );
    }
    const episodes = buildPointEpisodes(shots);
    expect(episodes[3]!.scoreAfter.hostGames).toBe(1);
    expect(episodes[3]!.scoreAfter.pointLabel).toBe("0-0");
  });
});

describe("buildMatchPlayback + clock", () => {
  it("resolves ball along a shot and steps points deterministically", () => {
    const shots: EnrichedShot[] = [
      shot({
        player: "host",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 1,
        stroke: "Serve",
        speedKmh: 120,
        hitX: 0,
        hitY: 22,
        bounceX: 0,
        bounceY: 6,
        pointWinner: "host",
      }),
      shot({
        player: "host",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 2,
        shotNumber: 1,
        stroke: "Serve",
        pointWinner: "guest",
      }),
    ];
    const playback = buildMatchPlayback(shots, { fps: 30 });
    expect(playback.totalFrames).toBeGreaterThan(10);
    expect(playback.episodes).toHaveLength(2);

    const midFirst = episodeStartSec(playback, 0) + playback.episodes[0]!.shots[0]!.startSec + 0.1;
    const state = resolvePlaybackAt({ playback, timeSec: midFirst });
    expect(state.episodeIndex).toBe(0);
    expect(state.ball).not.toBeNull();

    const clock = createPlaybackClock(playback);
    clock.stepPoint(1);
    expect(clock.getState().episodeIndex).toBe(1);
    clock.stepPoint(-1);
    expect(clock.getState().episodeIndex).toBe(0);
  });

  it("ballPositionAt starts at hit and ends at bounce", () => {
    const timed = buildPointEpisodes([
      shot({
        player: "host",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 1,
        hitX: 2,
        hitY: 20,
        bounceX: -2,
        bounceY: 4,
        pointWinner: "host",
      }),
    ])[0]!.shots[0]!;
    const start = ballPositionAt(timed, 0);
    const end = ballPositionAt(timed, 1);
    expect(start.x).toBeCloseTo(2, 5);
    expect(start.y).toBeCloseTo(20, 5);
    expect(end.x).toBeCloseTo(-2, 5);
    expect(end.y).toBeCloseTo(4, 5);
  });
});
