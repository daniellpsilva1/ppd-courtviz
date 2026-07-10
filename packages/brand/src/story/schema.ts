import { z } from "zod";

export const StoryMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  context: z.string().optional(),
});

export const StoryChartSchema = z.object({
  id: z.string(),
  type: z.enum(["hexbin", "momentum", "zone-bar", "serve"]),
  title: z.string(),
  annotation: z.string(),
});

export const BenchmarkStorySchema = z.object({
  version: z.literal("1.0.0"),
  storyId: z.string(),
  matchId: z.string(),
  hostName: z.string(),
  guestName: z.string(),
  surface: z.enum(["clay", "hard", "grass"]),
  matchDate: z.string(),
  setScore: z.string(),
  hostSetsWon: z.number(),
  guestSetsWon: z.number(),
  editorialQuestion: z.string(),
  title: z.string(),
  standfirst: z.string(),
  headlineMetrics: z.array(StoryMetricSchema).min(3),
  charts: z.array(StoryChartSchema).min(2),
  insight: z.string(),
  coachInterpretation: z.string(),
  source: z.string(),
  cta: z.string(),
  socialCaption: z.string(),
  accessibleSummary: z.string(),
  frozenMetrics: z.object({
    hostPointsWonPct: z.number(),
    guestPointsWonPct: z.number(),
    hostFirstServeInPct: z.number(),
    guestFirstServeInPct: z.number(),
    hostBreakConvPct: z.number(),
    guestBreakConvPct: z.number(),
    totalShotsIn: z.number(),
    totalBreakPoints: z.number(),
    hostTopZone: z.string(),
    hostTopZoneWinPct: z.number(),
  }),
});

export type BenchmarkStory = z.infer<typeof BenchmarkStorySchema>;
