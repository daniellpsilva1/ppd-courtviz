import { describe, expect, it } from "vitest";
import {
  aggregateSideWinRatesByPoint,
  computeBreakPointConversion,
  computeFirstServeInRate,
  computeMomentum,
  computePointsWonRate,
  computeZoneWinRates,
  computeZoneWinRatesByPoint,
  type EnrichedShot,
} from "../stats";

function makeShot(overrides: Partial<EnrichedShot> = {}): EnrichedShot {
  return {
    player: "host",
    stroke: "Forehand",
    type: null,
    result: "In",
    spin: null,
    speedKmh: null,
    bounceX: 1.0,
    bounceY: 20.0,
    hitX: 0.5,
    hitY: 22.0,
    hitZ: null,
    bounceZone: "deuce",
    direction: null,
    isTerminal: false,
    setNumber: 1,
    gameNumber: 1,
    pointNumber: 1,
    pointWinner: "host",
    rallyLength: 4,
    endedBy: null,
    isBreakPoint: false,
    isSetPoint: false,
    isMatchPoint: false,
    ...overrides,
  };
}

describe("computeZoneWinRatesByPoint", () => {
  it("counts one vote per point using the last in shot", () => {
    const shots: EnrichedShot[] = [
      makeShot({
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 1,
        bounceX: 3.5,
        bounceY: 18,
        hitY: 22,
        bounceZone: "deuce",
        pointWinner: "host",
      }),
      makeShot({
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 2,
        bounceX: 3.5,
        bounceY: 18,
        hitY: 22,
        bounceZone: "deuce",
        pointWinner: "host",
      }),
      makeShot({
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 2,
        shotNumber: 1,
        bounceX: -2,
        bounceY: 18,
        hitY: 22,
        bounceZone: "ad",
        pointWinner: "guest",
      }),
    ];

    const result = computeZoneWinRatesByPoint(shots, "host");
    const deuce = result.find((entry) => entry.zone.startsWith("deuce_"));
    expect(deuce?.total).toBe(1);
    expect(deuce?.won).toBe(1);
  });

  it("aggregates deuce and ad sides at point level", () => {
    const shots: EnrichedShot[] = [
      makeShot({ setNumber: 1, gameNumber: 1, pointNumber: 1, shotNumber: 1, bounceX: 3.5, bounceY: 18, hitY: 22, pointWinner: "host" }),
      makeShot({ setNumber: 1, gameNumber: 1, pointNumber: 2, shotNumber: 1, bounceX: -3.5, bounceY: 18, hitY: 22, pointWinner: "guest" }),
    ];
    const sides = aggregateSideWinRatesByPoint(shots, "host");
    const deuce = sides.find((side) => side.side === "deuce");
    expect(deuce?.total).toBe(1);
    expect(deuce?.won).toBe(1);
  });
});

describe("computeZoneWinRates", () => {
  it("computes win rates per zone using true pointWinner", () => {
    const shots: EnrichedShot[] = [
      makeShot({ bounceZone: "deuce", pointWinner: "host" }),
      makeShot({ bounceZone: "deuce", pointWinner: "host" }),
      makeShot({ bounceZone: "deuce", pointWinner: "guest" }),
      makeShot({ bounceZone: "ad", pointWinner: "guest" }),
      makeShot({ bounceZone: "ad", pointWinner: "guest", result: "Out" }),
    ];

    const result = computeZoneWinRates(shots, "host");
    expect(result).toHaveLength(2);

    const deuce = result.find((r) => r.zone === "deuce")!;
    expect(deuce.total).toBe(3);
    expect(deuce.won).toBe(2);
    expect(deuce.winRate).toBeCloseTo(2 / 3, 5);

    const ad = result.find((r) => r.zone === "ad")!;
    expect(ad.total).toBe(2);
    expect(ad.won).toBe(0);
    expect(ad.errors).toBe(1);
    expect(ad.winRate).toBe(0);
  });

  it("filters to specified player only", () => {
    const shots: EnrichedShot[] = [
      makeShot({ player: "host", bounceZone: "deuce", pointWinner: "host" }),
      makeShot({ player: "guest", bounceZone: "deuce", pointWinner: "guest" }),
    ];

    const result = computeZoneWinRates(shots, "host");
    expect(result).toHaveLength(1);
    expect(result[0]!.total).toBe(1);
  });
});

describe("computeMomentum", () => {
  it("computes cumulative point differential", () => {
    const points = [
      { setNumber: 1, gameNumber: 1, pointWinner: "host", isBreakPoint: false, isSetPoint: false, isMatchPoint: false },
      { setNumber: 1, gameNumber: 1, pointWinner: "host", isBreakPoint: false, isSetPoint: false, isMatchPoint: false },
      { setNumber: 1, gameNumber: 1, pointWinner: "guest", isBreakPoint: false, isSetPoint: false, isMatchPoint: false },
      { setNumber: 1, gameNumber: 2, pointWinner: "host", isBreakPoint: true, isSetPoint: false, isMatchPoint: false },
    ];

    const result = computeMomentum(points, "host");
    expect(result).toHaveLength(4);
    expect(result[0]!.cumulativeDiff).toBe(1);
    expect(result[1]!.cumulativeDiff).toBe(2);
    expect(result[2]!.cumulativeDiff).toBe(1);
    expect(result[3]!.cumulativeDiff).toBe(2);
    expect(result[3]!.isBreakPoint).toBe(true);
  });
});

describe("computePointsWonRate", () => {
  it("counts one vote per point", () => {
    const result = computePointsWonRate(
      [
        { pointWinner: "host" },
        { pointWinner: "host" },
        { pointWinner: "guest" },
        { pointWinner: null },
      ],
      "host",
    );
    expect(result.total).toBe(3);
    expect(result.won).toBe(2);
    expect(result.rate).toBeCloseTo(2 / 3, 5);
  });
});

describe("computeFirstServeInRate", () => {
  it("computes first serve in percentage", () => {
    const shots: EnrichedShot[] = [
      makeShot({ stroke: "Serve", type: "first_serve", result: "In" }),
      makeShot({ stroke: "Serve", type: "first_serve", result: "Out" }),
      makeShot({ stroke: "Serve", type: "second_serve", result: "In" }),
    ];
    const result = computeFirstServeInRate(shots, "host");
    expect(result.total).toBe(2);
    expect(result.won).toBe(1);
    expect(result.rate).toBe(0.5);
  });
});

describe("computeBreakPointConversion", () => {
  it("counts break points where player was returner", () => {
    const shots: EnrichedShot[] = [
      makeShot({
        stroke: "Serve",
        type: "first_serve",
        player: "host",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 1,
        isBreakPoint: true,
        pointWinner: "guest",
      }),
      makeShot({
        stroke: "Forehand",
        player: "guest",
        setNumber: 1,
        gameNumber: 1,
        pointNumber: 1,
        shotNumber: 2,
        isBreakPoint: true,
        pointWinner: "guest",
      }),
    ];
    const result = computeBreakPointConversion(shots, "guest");
    expect(result.total).toBe(1);
    expect(result.won).toBe(1);
    expect(result.rate).toBe(1);
  });
});
