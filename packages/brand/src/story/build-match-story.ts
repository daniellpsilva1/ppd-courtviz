import {
  computeBreakPointConversion,
  computeFirstServeInRate,
  computePointsWonRate,
  computeZoneWinRatesByPoint,
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
  momentumPoints: Array<{
    setNumber: number;
    gameNumber: number;
    pointNumber: number;
    pointWinner: string;
    isBreakPoint: boolean;
    isSetPoint: boolean;
    isMatchPoint: boolean;
  }>;
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

const FALLBACK_ZONE = {
  zone: "deuce_court",
  total: 0,
  won: 0,
  errors: 0,
  winRate: 0,
};

function pct(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

function formatSetScore(sets: SetSummary[]): string {
  return sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(" · ");
}

function formatZoneLabel(zone: string): string {
  return zone.replace(/_/g, " ");
}

function pickTopZone(enrichedShots: EnrichedShot[], player: "host" | "guest") {
  const qualifying = computeZoneWinRatesByPoint(enrichedShots, player)
    .filter((z) => z.total >= 8)
    .sort((a, b) => b.winRate - a.winRate);

  if (qualifying.length > 0) {
    return qualifying[0]!;
  }

  const anyZone = computeZoneWinRatesByPoint(enrichedShots, player)
    .filter((z) => z.total > 0)
    .sort((a, b) => b.winRate - a.winRate);

  return anyZone[0] ?? { ...FALLBACK_ZONE };
}

export function computeStoryMetrics(fixtures: MatchStoryFixtures) {
  const { enrichedShots, guestName, hostName, momentumPoints, points, sets } = fixtures;

  const hostWin = computePointsWonRate(momentumPoints, "host");
  const guestWin = computePointsWonRate(momentumPoints, "guest");
  const hostFS = computeFirstServeInRate(enrichedShots, "host");
  const guestFS = computeFirstServeInRate(enrichedShots, "guest");
  const hostBP = computeBreakPointConversion(enrichedShots, "host");
  const guestBP = computeBreakPointConversion(enrichedShots, "guest");
  const hostSetsWon = sets.filter((s) => s.hostScore > s.guestScore).length;
  const guestSetsWon = sets.filter((s) => s.guestScore > s.hostScore).length;
  const totalShotsIn = enrichedShots.filter((s) => s.result === "In").length;
  const totalBreakPoints = points.filter((p) => p.breakPoint).length;

  const hostWonMatch = hostSetsWon >= guestSetsWon;
  const winnerSide: "host" | "guest" = hostWonMatch ? "host" : "guest";
  const winnerName = hostWonMatch ? hostName : guestName;
  const loserName = hostWonMatch ? guestName : hostName;
  const winnerSetsWon = hostWonMatch ? hostSetsWon : guestSetsWon;
  const loserSetsWon = hostWonMatch ? guestSetsWon : hostSetsWon;
  const winnerWin = hostWonMatch ? hostWin : guestWin;
  const loserWin = hostWonMatch ? guestWin : hostWin;
  const winnerFS = hostWonMatch ? hostFS : guestFS;
  const loserFS = hostWonMatch ? guestFS : hostFS;
  const winnerBP = hostWonMatch ? hostBP : guestBP;
  const topWinnerZone = pickTopZone(enrichedShots, winnerSide);
  const winnerTopZoneLabel = formatZoneLabel(topWinnerZone.zone);
  const winnerTopZoneWinPct = Math.round(topWinnerZone.winRate * 1000) / 10;

  return {
    guestBP,
    guestFS,
    guestName,
    guestSetsWon,
    guestWin,
    hostBP,
    hostFS,
    hostName,
    hostSetsWon,
    hostWin,
    loserFS,
    loserName,
    loserSetsWon,
    loserWin,
    setScore: formatSetScore(sets),
    topWinnerZone,
    totalBreakPoints,
    totalShotsIn,
    winnerBP,
    winnerFS,
    winnerName,
    winnerSetsWon,
    winnerSide,
    winnerTopZoneLabel,
    winnerTopZoneWinPct,
    winnerWin,
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
    loserName,
    topWinnerZone,
    totalBreakPoints,
    totalShotsIn,
    winnerName,
    winnerTopZoneLabel,
    winnerTopZoneWinPct,
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
      `Where did ${winnerName} create the clearest territorial and point-winning advantage, and how should a coach interpret it?`,
    title: narrative?.title ?? `${winnerName}'s Court Patterns Defined the Match`,
    standfirst:
      narrative?.standfirst ??
      `${winnerName} won ${m.winnerSetsWon}–${m.loserSetsWon} on ${fixtures.surface} by controlling key court zones that converted into break-point pressure.`,
    headlineMetrics: [
      {
        label: "Points won",
        value: `${pct(m.winnerWin.rate)}%`,
        context: `vs ${pct(m.loserWin.rate)}% for ${loserName}`,
      },
      {
        label: "Best zone win rate",
        value: `${winnerTopZoneWinPct}%`,
        context: `Top zone with ≥8 shots (${winnerTopZoneLabel})`,
      },
      {
        label: "Break-point conversion",
        value: `${pct(m.winnerBP.rate)}%`,
        context: `${totalBreakPoints} break points in the match`,
      },
      {
        label: "First serve in",
        value: `${pct(m.winnerFS.rate)}%`,
        context: `${loserName} ${pct(m.loserFS.rate)}% — serve quality context`,
      },
    ],
    charts: [
      {
        id: "host-hexbin",
        type: "hexbin",
        title: "Shot efficiency by court zone",
        annotation: `${winnerTopZoneWinPct}% win rate in ${winnerTopZoneLabel} — patterns coaches should reinforce under pressure.`,
      },
      {
        id: "momentum",
        type: "momentum",
        title: "Point momentum through the match",
        annotation: `${totalBreakPoints} break points shaped the momentum swings across ${fixtures.sets.length} sets.`,
      },
      {
        id: "zone-comparison",
        type: "zone-bar",
        title: "Territorial win rate by court zone",
        annotation: `${winnerName} best zone (${winnerTopZoneWinPct}% in ${winnerTopZoneLabel}) vs opponent qualifying zones.`,
      },
    ],
    insight:
      narrative?.insight ??
      `${winnerName} created the clearest advantage in ${winnerTopZoneLabel} (${winnerTopZoneWinPct}% win rate on ${topWinnerZone.total} tracked shots), turning territorial control into ${pct(m.winnerBP.rate)}% break-point conversion.`,
    coachInterpretation:
      narrative?.coachInterpretation ??
      `Reinforce ${winnerTopZoneLabel} serve-plus-one patterns in practice. When returning, prioritize denying ${loserName} access to their strongest zones on short balls.`,
    source: narrative?.source ?? "Source: SwingVision match data · Peak Performance Data analysis",
    cta: narrative?.cta ?? "Explore match intelligence in Peak Performance Data",
    socialCaption:
      narrative?.socialCaption ??
      `${winnerName} ${m.winnerSetsWon}–${m.loserSetsWon} · ${winnerTopZoneWinPct}% ${winnerTopZoneLabel} win rate · ${totalShotsIn} tracked shots`,
    accessibleSummary:
      narrative?.accessibleSummary ??
      `${winnerName} defeated ${loserName} ${m.setScore} on ${fixtures.surface}. ${winnerName} won ${pct(m.winnerWin.rate)}% of points.`,
    frozenMetrics: {
      hostPointsWonPct: pct(m.hostWin.rate),
      guestPointsWonPct: pct(m.guestWin.rate),
      hostFirstServeInPct: pct(m.hostFS.rate),
      guestFirstServeInPct: pct(m.guestFS.rate),
      hostBreakConvPct: pct(m.hostBP.rate),
      guestBreakConvPct: pct(m.guestBP.rate),
      totalShotsIn,
      totalBreakPoints,
      hostTopZone: topWinnerZone.zone,
      hostTopZoneWinPct: winnerTopZoneWinPct,
    },
  };

  return BenchmarkStorySchema.parse(story);
}
