import {
  computeBreakPointConversion,
  computeFirstServeInRate,
  computePointsWonRate,
  computeZoneWinRates,
} from "@courtviz/core";
import type { EnrichedShot } from "@courtviz/core";
import type { Point, SetSummary } from "@courtviz/data";
import { type BenchmarkStory, BenchmarkStorySchema } from "./schema";

export interface MatchStoryFixtures {
  matchId: string;
  hostName: string;
  guestName: string;
  surface: "clay" | "hard" | "grass";
  matchDate: string;
  sets: SetSummary[];
  points: Point[];
  enrichedShots: EnrichedShot[];
  momentumPoints: Array<{ pointWinner: string | null }>;
}

export interface StoryNarrativeOverrides {
  storyId?: string;
  editorialQuestion?: string;
  title?: string;
  standfirst?: string;
  insight?: string;
  coachInterpretation?: string;
  source?: string;
  cta?: string;
  socialCaption?: string;
  accessibleSummary?: string;
}

function pct(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

function formatSetScore(sets: SetSummary[]): string {
  return sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(" · ");
}

export function computeStoryMetrics(fixtures: MatchStoryFixtures) {
  const { enrichedShots, guestName, hostName, momentumPoints, points, sets } = fixtures;

  const hostWin = computePointsWonRate(momentumPoints, "host");
  const guestWin = computePointsWonRate(momentumPoints, "guest");
  const hostFS = computeFirstServeInRate(enrichedShots, "host");
  const guestFS = computeFirstServeInRate(enrichedShots, "guest");
  const hostBP = computeBreakPointConversion(enrichedShots, "host");
  const guestBP = computeBreakPointConversion(enrichedShots, "guest");
  const hostZones = computeZoneWinRates(enrichedShots, "host")
    .filter((z) => z.total >= 8)
    .sort((a, b) => b.winRate - a.winRate);
  const topHostZone = hostZones[0]!;
  const hostSetsWon = sets.filter((s) => s.hostScore > s.guestScore).length;
  const guestSetsWon = sets.filter((s) => s.guestScore > s.hostScore).length;
  const totalShotsIn = enrichedShots.filter((s) => s.result === "In").length;
  const totalBreakPoints = points.filter((p) => p.breakPoint).length;
  const hostTopZoneLabel = topHostZone.zone.replace(/_/g, " ");
  const hostTopZoneWinPct = Math.round(topHostZone.winRate * 1000) / 10;

  return {
    guestSetsWon,
    guestWin,
    hostBP,
    hostFS,
    hostSetsWon,
    hostTopZoneLabel,
    hostTopZoneWinPct,
    hostWin,
    hostZones,
    guestBP,
    guestFS,
    guestName,
    hostName,
    setScore: formatSetScore(sets),
    topHostZone,
    totalBreakPoints,
    totalShotsIn,
  };
}

export function buildMatchStory(
  fixtures: MatchStoryFixtures,
  narrative?: StoryNarrativeOverrides,
): BenchmarkStory {
  const m = computeStoryMetrics(fixtures);
  const {
    guestName,
    hostName,
    hostTopZoneLabel,
    hostTopZoneWinPct,
    topHostZone,
    totalBreakPoints,
    totalShotsIn,
  } = m;

  const story: BenchmarkStory = {
    version: "1.0.0",
    storyId: narrative?.storyId ?? `${fixtures.matchId}-match-story`,
    matchId: fixtures.matchId,
    hostName,
    guestName,
    surface: fixtures.surface,
    matchDate: fixtures.matchDate,
    setScore: m.setScore,
    hostSetsWon: m.hostSetsWon,
    guestSetsWon: m.guestSetsWon,
    editorialQuestion:
      narrative?.editorialQuestion ??
      "Where did the host player create the clearest territorial and point-winning advantage, and how should a coach interpret it?",
    title: narrative?.title ?? `${hostName}'s Court Patterns Defined the Match`,
    standfirst:
      narrative?.standfirst ??
      `${hostName} won ${m.hostSetsWon}–${m.guestSetsWon} on ${fixtures.surface} by controlling key court zones that converted into break-point pressure.`,
    headlineMetrics: [
      {
        label: "Points won",
        value: `${pct(m.hostWin.rate)}%`,
        context: `vs ${pct(m.guestWin.rate)}% for ${guestName}`,
      },
      {
        label: "Deuce-side win rate",
        value: `${hostTopZoneWinPct}%`,
        context: `Best zone with ≥8 shots (${hostTopZoneLabel})`,
      },
      {
        label: "Break-point conversion",
        value: `${pct(m.hostBP.rate)}%`,
        context: `${totalBreakPoints} break points in the match`,
      },
      {
        label: "First serve in",
        value: `${pct(m.hostFS.rate)}%`,
        context: `Guest ${pct(m.guestFS.rate)}% — serve quality was not the separator`,
      },
    ],
    charts: [
      {
        id: "host-hexbin",
        type: "hexbin",
        title: "Host shot efficiency by court zone",
        annotation: `${hostTopZoneWinPct}% win rate concentrated on the deuce side — patterns coaches should reinforce under pressure.`,
      },
      {
        id: "momentum",
        type: "momentum",
        title: "Point momentum through the match",
        annotation: `${totalBreakPoints} break points; return-side swings decided the second set.`,
      },
      {
        id: "zone-comparison",
        type: "zone-bar",
        title: "Territorial win rate by court zone",
        annotation: `Host deuce court (${hostTopZoneWinPct}%) vs guest best qualifying zone.`,
      },
    ],
    insight:
      narrative?.insight ??
      `${hostName} created the clearest advantage on the deuce side (${hostTopZoneWinPct}% win rate on ${topHostZone.total} tracked shots), turning territorial control into ${pct(m.hostBP.rate)}% break-point conversion.`,
    coachInterpretation:
      narrative?.coachInterpretation ??
      "Reinforce deuce-side serve-plus-one patterns in practice. When returning, prioritize denying guest access to the ad alley on short balls.",
    source: narrative?.source ?? "Source: SwingVision match data · Peak Performance Data analysis",
    cta: narrative?.cta ?? "Explore match intelligence in Peak Performance Data",
    socialCaption:
      narrative?.socialCaption ??
      `${hostName} ${m.hostSetsWon}–${m.guestSetsWon} · ${hostTopZoneWinPct}% deuce-side win rate · ${totalShotsIn} tracked shots`,
    accessibleSummary:
      narrative?.accessibleSummary ??
      `${hostName} defeated ${guestName} ${m.setScore} on ${fixtures.surface}. ${hostName} won ${pct(m.hostWin.rate)}% of points.`,
    frozenMetrics: {
      hostPointsWonPct: pct(m.hostWin.rate),
      guestPointsWonPct: pct(m.guestWin.rate),
      hostFirstServeInPct: pct(m.hostFS.rate),
      guestFirstServeInPct: pct(m.guestFS.rate),
      hostBreakConvPct: pct(m.hostBP.rate),
      guestBreakConvPct: pct(m.guestBP.rate),
      totalShotsIn,
      totalBreakPoints,
      hostTopZone: topHostZone.zone,
      hostTopZoneWinPct,
    },
  };

  return BenchmarkStorySchema.parse(story);
}
