import {
  computeBreakPointConversion,
  computeFirstServeInRate,
  computePointsWonRate,
  computeZoneWinRates,
} from "@courtviz/core";
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
import { type BenchmarkStory, BenchmarkStorySchema } from "./schema";

function pct(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

function formatSetScore(): string {
  return sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(" · ");
}

/** Build the frozen Boluda benchmark story from fixture data */
export function buildBoludaStory(): BenchmarkStory {
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

  const story: BenchmarkStory = {
    version: "1.0.0",
    storyId: "boluda-territorial-advantage",
    matchId: match.id,
    hostName,
    guestName,
    surface,
    matchDate,
    setScore: formatSetScore(),
    hostSetsWon,
    guestSetsWon,
    editorialQuestion:
      "Where did the host player create the clearest territorial and point-winning advantage, and how should a coach interpret it?",
    title: "Quevedo’s Deuce-Court Pressure Defined the Match",
    standfirst: `${hostName} won ${hostSetsWon}–${guestSetsWon} on clay by controlling the deuce-side patterns that converted into break-point pressure — not by dominating first-serve percentage alone.`,
    headlineMetrics: [
      {
        label: "Points won",
        value: `${pct(hostWin.rate)}%`,
        context: `vs ${pct(guestWin.rate)}% for ${guestName}`,
      },
      {
        label: "Deuce-side win rate",
        value: `${hostTopZoneWinPct}%`,
        context: `Best zone with ≥8 shots (${hostTopZoneLabel})`,
      },
      {
        label: "Break-point conversion",
        value: `${pct(hostBP.rate)}%`,
        context: `${totalBreakPoints} break points in the match`,
      },
      {
        label: "First serve in",
        value: `${pct(hostFS.rate)}%`,
        context: `Guest ${pct(guestFS.rate)}% — serve quality was not the separator`,
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
    insight: `${hostName} created the clearest advantage on the deuce side (${hostTopZoneWinPct}% win rate on ${topHostZone.total} tracked shots), turning territorial control into ${pct(hostBP.rate)}% break-point conversion.`,
    coachInterpretation:
      "Reinforce deuce-side serve-plus-one patterns in practice. When returning, prioritize denying guest access to the ad alley on short balls — the host’s edge came from pattern repetition, not raw speed.",
    source: "Source: SwingVision match data · Peak Performance Data analysis",
    cta: "Explore match intelligence in Peak Performance Data",
    socialCaption: `${hostName} ${hostSetsWon}–${guestSetsWon} · ${hostTopZoneWinPct}% deuce-side win rate · ${totalShotsIn} tracked shots`,
    accessibleSummary: `${hostName} defeated ${guestName} ${formatSetScore()} on clay. ${hostName} won ${pct(hostWin.rate)}% of points and ${hostTopZoneWinPct}% of deuce-side rallies with sufficient sample size. ${totalBreakPoints} break points occurred in the match.`,
    frozenMetrics: {
      hostPointsWonPct: pct(hostWin.rate),
      guestPointsWonPct: pct(guestWin.rate),
      hostFirstServeInPct: pct(hostFS.rate),
      guestFirstServeInPct: pct(guestFS.rate),
      hostBreakConvPct: pct(hostBP.rate),
      guestBreakConvPct: pct(guestBP.rate),
      totalShotsIn,
      totalBreakPoints,
      hostTopZone: topHostZone.zone,
      hostTopZoneWinPct,
    },
  };

  return BenchmarkStorySchema.parse(story);
}
