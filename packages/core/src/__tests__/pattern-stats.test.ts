import { describe, expect, it } from "vitest";
import type { EnrichedShot } from "../stats";
import {
  computeFirstStrikeStats,
  computeReturnInPlayRate,
  computeServePlusOneStats,
} from "../pattern-stats";

function shot(partial: Partial<EnrichedShot> & Pick<EnrichedShot, "player" | "setNumber" | "gameNumber" | "pointNumber">): EnrichedShot {
  return {
    bounceX: 0,
    bounceY: 5,
    bounceZone: null,
    direction: null,
    endedBy: null,
    hitX: 0,
    hitY: 0,
    hitZ: null,
    isBreakPoint: false,
    isMatchPoint: false,
    isSetPoint: false,
    isTerminal: false,
    pointWinner: "host",
    rallyLength: 3,
    result: "In",
    speedKmh: null,
    spin: null,
    stroke: "Forehand",
    type: null,
    ...partial,
  };
}

describe("pattern-stats", () => {
  it("computes serve+1 stroke usage for the server third shot", () => {
    const shots = [
      shot({ gameNumber: 1, player: "host", pointNumber: 1, pointWinner: "host", setNumber: 1, shotNumber: 1, stroke: "Serve", type: "first_serve" }),
      shot({ gameNumber: 1, player: "guest", pointNumber: 1, pointWinner: "host", setNumber: 1, shotNumber: 2, stroke: "Backhand" }),
      shot({ gameNumber: 1, player: "host", pointNumber: 1, pointWinner: "host", setNumber: 1, shotNumber: 3, stroke: "Forehand" }),
    ];

    const stats = computeServePlusOneStats(shots, "host");
    expect(stats).toHaveLength(1);
    expect(stats[0]?.stroke).toBe("Forehand");
    expect(stats[0]?.total).toBe(1);
    expect(stats[0]?.won).toBe(1);
  });

  it("computes first-strike points won in rallies of four shots or fewer", () => {
    const shots = [
      shot({ gameNumber: 1, player: "host", pointNumber: 1, pointWinner: "host", rallyLength: 3, setNumber: 1, shotNumber: 1, stroke: "Serve", type: "first_serve" }),
      shot({ gameNumber: 1, player: "guest", pointNumber: 1, pointWinner: "host", rallyLength: 3, setNumber: 1, shotNumber: 2, stroke: "Backhand" }),
      shot({ gameNumber: 1, player: "host", pointNumber: 1, pointWinner: "host", rallyLength: 3, setNumber: 1, shotNumber: 3, stroke: "Forehand" }),
      shot({ gameNumber: 1, player: "guest", pointNumber: 2, pointWinner: "guest", rallyLength: 8, setNumber: 1, shotNumber: 8 }),
    ];

    const host = computeFirstStrikeStats(shots, "host");
    expect(host.total).toBe(1);
    expect(host.won).toBe(1);
  });

  it("computes return in-play rate from second shot results", () => {
    const shots = [
      shot({ gameNumber: 1, player: "host", pointNumber: 1, setNumber: 1, shotNumber: 1, stroke: "Serve", type: "first_serve" }),
      shot({ gameNumber: 1, player: "guest", pointNumber: 1, result: "In", setNumber: 1, shotNumber: 2, stroke: "Backhand" }),
      shot({ gameNumber: 1, player: "host", pointNumber: 2, setNumber: 1, shotNumber: 1, stroke: "Serve", type: "first_serve" }),
      shot({ gameNumber: 1, player: "guest", pointNumber: 2, result: "Out", setNumber: 1, shotNumber: 2, stroke: "Forehand" }),
    ];

    const guest = computeReturnInPlayRate(shots, "guest");
    expect(guest.total).toBe(2);
    expect(guest.won).toBe(1);
    expect(guest.rate).toBe(0.5);
  });
});
