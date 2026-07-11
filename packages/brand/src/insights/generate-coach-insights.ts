import {
  computeBreakPointConversion,
  computeFirstServeInRate,
  computeRallyBucketStats,
  computeShotFlows,
  computeZoneWinRatesByPoint,
  type EnrichedShot,
} from "@courtviz/core";
import { computeServeZones } from "@courtviz/core";
import type { Point } from "@courtviz/data";

export interface CoachInsight {
  id: string;
  category: "serve" | "return" | "rally" | "pattern" | "pressure";
  headline: string;
  detail: string;
  action: string;
}

export interface CoachInsightInput {
  enrichedShots: EnrichedShot[];
  points: Point[];
  hostName: string;
  guestName: string;
}

const MIN_ZONE_POINTS = 20;
const MIN_SERVE_IN = 10;
const MIN_RALLY_POINTS = 4;

function pct(rate: number): number {
  return Math.round(rate * 100);
}

function rankScore(winRate: number, sample: number): number {
  return winRate * Math.log(Math.max(sample, 1));
}

function topZoneInsight(shots: EnrichedShot[], player: "host" | "guest", name: string): CoachInsight | null {
  const zones = computeZoneWinRatesByPoint(shots, player)
    .filter((z) => z.total >= MIN_ZONE_POINTS)
    .sort((a, b) => rankScore(b.winRate, b.total) - rankScore(a.winRate, a.total));
  const top = zones[0];
  const weak = [...zones].sort((a, b) => a.winRate - b.winRate)[0];
  if (!top || !weak || top.zone === weak.zone) return null;

  return {
    id: `${player}-zone-edge`,
    category: "pattern",
    headline: `${name} wins ${pct(top.winRate)}% (${top.won}/${top.total} pts) from ${top.zone.replace(/_/g, " ")}`,
    detail: `Only ${pct(weak.winRate)}% (${weak.won}/${weak.total} pts) from ${weak.zone.replace(/_/g, " ")}.`,
    action: `Reinforce ${top.zone.replace(/_/g, " ")} patterns in drills; avoid feeding into ${weak.zone.replace(/_/g, " ")}.`,
  };
}

function serveInsight(shots: EnrichedShot[], player: "host" | "guest", name: string): CoachInsight | null {
  const zones = computeServeZones(shots, player)
    .filter((z) => z.inCount >= MIN_SERVE_IN)
    .sort((a, b) => rankScore(b.winRate, b.inCount) - rankScore(a.winRate, a.inCount));
  const firstServe = computeFirstServeInRate(shots, player);
  const top = zones[0];
  if (!top) return null;

  return {
    id: `${player}-serve-placement`,
    category: "serve",
    headline: `${name}: ${pct(top.winRate)}% (${Math.round(top.winRate * top.inCount)}/${top.inCount} in) serving ${top.side} ${top.zone}`,
    detail: `${pct(firstServe.rate)}% first serves in (${firstServe.won}/${firstServe.total}) · ${top.inCount}/${top.count} attempts in-box.`,
    action:
      top.winRate >= 0.6
        ? `Keep targeting ${top.side} ${top.zone} under pressure.`
        : `Mix serve locations — ${top.side} ${top.zone} is underperforming relative to volume.`,
  };
}

function rallyInsight(shots: EnrichedShot[], player: "host" | "guest", name: string): CoachInsight | null {
  const buckets = computeRallyBucketStats(shots, player);
  const short = buckets.find((b) => b.bucket === "1-3");
  const long = buckets.find((b) => b.bucket === "7+");
  if (!short || !long || short.total < MIN_RALLY_POINTS || long.total < 3) return null;

  const better = short.winRate >= long.winRate ? "short" : "long";
  const betterBucket = better === "short" ? short : long;
  const worseBucket = better === "short" ? long : short;

  return {
    id: `${player}-rally-profile`,
    category: "rally",
    headline: `${name} wins ${pct(betterBucket.winRate)}% (${betterBucket.won}/${betterBucket.total}) of ${betterBucket.bucket}-shot rallies`,
    detail: `${pct(worseBucket.winRate)}% (${worseBucket.won}/${worseBucket.total}) in ${worseBucket.bucket}-shot exchanges.`,
    action:
      better === "short"
        ? "Push for serve-plus-one and first-strike tennis."
        : "Extend rallies — opponent breaks down in longer exchanges.",
  };
}

function patternInsight(shots: EnrichedShot[], player: "host" | "guest", name: string): CoachInsight | null {
  const flows = computeShotFlows(
    shots.filter((s) => s.player === player && s.stroke !== "Serve"),
    { minCount: 5, player },
  ).sort((a, b) => rankScore(b.winRate, b.count) - rankScore(a.winRate, a.count));
  const top = flows[0];
  if (!top) return null;

  return {
    id: `${player}-top-pattern`,
    category: "pattern",
    headline: `Top pattern: ${top.count} shots, ${pct(top.winRate)}% win rate`,
    detail: `${name}'s most repeated hit-to-bounce lane this match.`,
    action:
      top.winRate >= 0.55
        ? "Repeat this pattern on big points — it is producing."
        : "Reduce volume on this lane or change the target earlier in the rally.",
  };
}

function pressureInsight(
  shots: EnrichedShot[],
  points: Point[],
  player: "host" | "guest",
  name: string,
): CoachInsight | null {
  const bp = computeBreakPointConversion(shots, player);
  const breakPoints = points.filter((p) => p.breakPoint).length;
  if (bp.total < 2) return null;

  return {
    id: `${player}-break-points`,
    category: "pressure",
    headline: `${name} converted ${bp.won}/${bp.total} break points on return (${pct(bp.rate)}%)`,
    detail: `${breakPoints} break points played in the match.`,
    action:
      bp.rate >= 0.4
        ? "Return game is a weapon — keep aggressive first returns."
        : "Work conversion patterns on return — too many break chances missed.",
  };
}

export function generateCoachInsights(input: CoachInsightInput, limit = 6): CoachInsight[] {
  const { enrichedShots, guestName, hostName, points } = input;
  const candidates: Array<CoachInsight | null> = [
    topZoneInsight(enrichedShots, "host", hostName),
    topZoneInsight(enrichedShots, "guest", guestName),
    serveInsight(enrichedShots, "host", hostName),
    serveInsight(enrichedShots, "guest", guestName),
    rallyInsight(enrichedShots, "host", hostName),
    rallyInsight(enrichedShots, "guest", guestName),
    patternInsight(enrichedShots, "host", hostName),
    patternInsight(enrichedShots, "guest", guestName),
    pressureInsight(enrichedShots, points, "host", hostName),
    pressureInsight(enrichedShots, points, "guest", guestName),
  ];

  const seen = new Set<string>();
  const insights: CoachInsight[] = [];
  for (const item of candidates) {
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    insights.push(item);
    if (insights.length >= limit) break;
  }
  return insights;
}

export function primaryCoachInsight(input: CoachInsightInput): string {
  const [first] = generateCoachInsights(input, 1);
  return first ? `${first.headline} — ${first.action}` : "Review shot patterns and serve placement in the full match report.";
}
