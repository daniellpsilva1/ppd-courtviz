import {
  computeBreakPointConversion,
  computeFirstServeInRate,
  computePointsWonRate,
  computeZoneWinRatesByPoint,
} from "@courtviz/core";
import {
  enrichedShots,
  momentumPoints,
  points,
} from "@courtviz/data/fixtures";
import { describe, expect, it } from "vitest";
import { buildBoludaStory } from "./build-boluda-story";

describe("buildBoludaStory frozen metrics", () => {
  it("matches benchmark frozen payload values", () => {
    const story = buildBoludaStory();
    const hostWin = computePointsWonRate(momentumPoints, "host");
    const guestWin = computePointsWonRate(momentumPoints, "guest");
    const hostFS = computeFirstServeInRate(enrichedShots, "host");
    const guestFS = computeFirstServeInRate(enrichedShots, "guest");
    const hostBP = computeBreakPointConversion(enrichedShots, "host");
    const guestBP = computeBreakPointConversion(enrichedShots, "guest");
    const hostZones = computeZoneWinRatesByPoint(enrichedShots, "host")
      .filter((z) => z.total >= 8)
      .sort((a, b) => b.winRate - a.winRate);

    expect(story.frozenMetrics.hostPointsWonPct).toBe(Math.round(hostWin.rate * 1000) / 10);
    expect(story.frozenMetrics.guestPointsWonPct).toBe(Math.round(guestWin.rate * 1000) / 10);
    expect(story.frozenMetrics.hostFirstServeInPct).toBe(Math.round(hostFS.rate * 1000) / 10);
    expect(story.frozenMetrics.guestFirstServeInPct).toBe(Math.round(guestFS.rate * 1000) / 10);
    expect(story.frozenMetrics.hostBreakConvPct).toBe(Math.round(hostBP.rate * 1000) / 10);
    expect(story.frozenMetrics.guestBreakConvPct).toBe(Math.round(guestBP.rate * 1000) / 10);
    expect(story.frozenMetrics.totalShotsIn).toBe(
      enrichedShots.filter((s) => s.result === "In").length,
    );
    expect(story.frozenMetrics.totalBreakPoints).toBe(
      points.filter((p) => p.breakPoint).length,
    );
    expect(story.frozenMetrics.hostTopZone).toBe(hostZones[0]!.zone);
    expect(story.frozenMetrics.hostTopZoneWinPct).toBe(
      Math.round(hostZones[0]!.winRate * 1000) / 10,
    );
  });
});
