import { describe, expect, it } from "vitest";
import { BenchmarkStorySchema } from "./schema";

describe("BenchmarkStorySchema", () => {
  it("rejects invalid version", () => {
    expect(() =>
      BenchmarkStorySchema.parse({
        version: "2.0.0",
        storyId: "x",
        matchId: "00000000-0000-4000-8000-000000000001",
        hostName: "A",
        guestName: "B",
        surface: "clay",
        matchDate: "2024-01-01",
        setScore: "2-0",
        hostSetsWon: 2,
        guestSetsWon: 0,
        editorialQuestion: "q",
        title: "t",
        standfirst: "s",
        headlineMetrics: [],
        charts: [],
        insight: "i",
        coachInterpretation: "c",
        source: "src",
        cta: "cta",
        socialCaption: "cap",
        accessibleSummary: "a11y",
        frozenMetrics: {
          hostPointsWonPct: 50,
          guestPointsWonPct: 50,
          hostFirstServeInPct: 60,
          guestFirstServeInPct: 55,
          hostBreakConvPct: 40,
          guestBreakConvPct: 30,
          totalShotsIn: 100,
          totalBreakPoints: 5,
          hostTopZone: "deuce_deep",
          hostTopZoneWinPct: 55,
        },
      }),
    ).toThrow();
  });
});
