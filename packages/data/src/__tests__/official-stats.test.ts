import { describe, expect, it } from "vitest";
import {
  computeBreakPointConversionFromOfficial,
  computeFirstServeInFromOfficial,
  computePointsWonFromOfficial,
} from "../official-stats";
import type { PlayerStat } from "../schema";

const stats: PlayerStat[] = [
  {
    matchId: "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a",
    player: "host",
    setNumber: 0,
    statName: "Total Points",
    statValue: 136,
  },
  {
    matchId: "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a",
    player: "host",
    setNumber: 0,
    statName: "Total Points Won",
    statValue: 77,
  },
  {
    matchId: "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a",
    player: "host",
    setNumber: 0,
    statName: "1st Serves",
    statValue: 65,
  },
  {
    matchId: "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a",
    player: "host",
    setNumber: 0,
    statName: "1st Serves In",
    statValue: 47,
  },
  {
    matchId: "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a",
    player: "host",
    setNumber: 0,
    statName: "Break Point Opportunities",
    statValue: 13,
  },
  {
    matchId: "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a",
    player: "host",
    setNumber: 0,
    statName: "Break Points Won",
    statValue: 6,
  },
];

describe("official stats helpers", () => {
  it("computes first serve in from official stats", () => {
    const result = computeFirstServeInFromOfficial(stats, "host");
    expect(result?.total).toBe(65);
    expect(result?.won).toBe(47);
    expect(result?.rate).toBeCloseTo(47 / 65, 5);
  });

  it("computes break point conversion from official stats", () => {
    const result = computeBreakPointConversionFromOfficial(stats, "host");
    expect(result?.total).toBe(13);
    expect(result?.won).toBe(6);
    expect(result?.rate).toBeCloseTo(6 / 13, 5);
  });

  it("computes points won from official stats", () => {
    const result = computePointsWonFromOfficial(stats, "host");
    expect(result?.total).toBe(136);
    expect(result?.won).toBe(77);
    expect(result?.rate).toBeCloseTo(77 / 136, 5);
  });
});
