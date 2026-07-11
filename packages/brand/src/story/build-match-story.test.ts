import { describe, expect, it } from "vitest";
import {
  enrichedShots,
  guestName,
  hostName,
  match,
  matchDate,
  momentumPoints,
  points,
  sets,
  surface,
} from "@courtviz/data/fixtures";
import { buildMatchStory, computeStoryMetrics } from "./build-match-story";

const fixtures = {
  enrichedShots,
  guestName,
  hostName,
  matchDate,
  matchId: match.id,
  momentumPoints,
  points,
  sets,
  surface: surface as "clay" | "hard" | "grass",
};

describe("buildMatchStory", () => {
  it("computes metrics from fixtures", () => {
    const metrics = computeStoryMetrics(fixtures);
    expect(metrics.hostWin.rate).toBeGreaterThan(0);
    expect(metrics.winnerTopZoneWinPct).toBeGreaterThan(0);
  });

  it("builds a valid story with defaults", () => {
    const story = buildMatchStory(fixtures);
    expect(story.matchId).toBe(match.id);
    expect(story.headlineMetrics.length).toBeGreaterThan(0);
    expect(story.frozenMetrics.hostTopZoneWinPct).toBeGreaterThan(0);
  });

  it("allows narrative overrides", () => {
    const story = buildMatchStory(fixtures, { title: "Custom title" });
    expect(story.title).toBe("Custom title");
  });
});
