import { describe, expect, it } from "vitest";
import { enrichedShots, guestName, hostName, points } from "@courtviz/data/fixtures";
import { generateCoachInsights, primaryCoachInsight } from "./generate-coach-insights";

describe("generateCoachInsights", () => {
  it("returns actionable coach takeaways", () => {
    const insights = generateCoachInsights({
      enrichedShots,
      guestName,
      hostName,
      points,
    });

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]?.headline.length).toBeGreaterThan(10);
    expect(insights[0]?.action.length).toBeGreaterThan(10);
  });

  it("returns a primary insight string", () => {
    const text = primaryCoachInsight({
      enrichedShots,
      guestName,
      hostName,
      points,
    });
    expect(text).toContain("—");
  });
});
