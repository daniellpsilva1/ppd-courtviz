/**
 * Coach-facing shot pattern metrics: serve+1, first-strike, return in-play.
 */

import { MIN_SAMPLE, type EnrichedShot, type RateStat } from "./stats";
import { pointKeyFromShot, shotPlayerWonPoint } from "./stats";

function inferPointServer(shots: EnrichedShot[], key: string): string | null {
  const serve = shots.find(
    (shot) =>
      pointKeyFromShot(shot) === key &&
      shot.stroke === "Serve" &&
      (shot.type === "first_serve" ||
        shot.type === "First Serve" ||
        shot.shotNumber === 1),
  );
  return serve?.player ?? null;
}

export interface ServePlusOneStrokeStat {
  stroke: string;
  total: number;
  won: number;
  winRate: number | null;
}

export interface PatternStats {
  firstStrike: RateStat;
  returnInPlay: RateStat;
  servePlusOne: ServePlusOneStrokeStat[];
}

export function computeServePlusOneStats(
  shots: EnrichedShot[],
  player: string,
): ServePlusOneStrokeStat[] {
  const byStroke = new Map<string, { total: number; won: number }>();

  for (const shot of shots) {
    if (shot.shotNumber !== 3 || shot.stroke === "Serve") continue;
    const server = inferPointServer(shots, pointKeyFromShot(shot));
    if (server !== player) continue;

    const stroke = shot.stroke || "Unknown";
    const entry = byStroke.get(stroke) ?? { total: 0, won: 0 };
    entry.total++;
    if (shotPlayerWonPoint(shot)) entry.won++;
    byStroke.set(stroke, entry);
  }

  return [...byStroke.entries()]
    .map(([stroke, stats]) => ({
      stroke,
      total: stats.total,
      winRate: stats.total >= MIN_SAMPLE ? stats.won / stats.total : null,
      won: stats.won,
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeFirstStrikeStats(
  shots: EnrichedShot[],
  player: string,
): RateStat {
  const pointMap = new Map<string, EnrichedShot[]>();

  for (const shot of shots) {
    if (shot.rallyLength == null || shot.rallyLength > 4) continue;
    const key = pointKeyFromShot(shot);
    const bucket = pointMap.get(key) ?? [];
    bucket.push(shot);
    pointMap.set(key, bucket);
  }

  let total = 0;
  let won = 0;
  for (const [key, pointShots] of pointMap) {
    const server = inferPointServer(shots, key);
    if (server !== player) continue;
    total++;
    const pointWinner = pointShots[0]?.pointWinner;
    if (pointWinner === player) won++;
  }

  return {
    rate: total >= MIN_SAMPLE ? won / total : null,
    total,
    won,
  };
}

export function computeReturnInPlayRate(
  shots: EnrichedShot[],
  player: string,
): RateStat {
  let total = 0;
  let inPlay = 0;

  for (const shot of shots) {
    if (shot.shotNumber !== 2) continue;
    const server = inferPointServer(shots, pointKeyFromShot(shot));
    if (!server) continue;
    const returner = server === "host" ? "guest" : "host";
    if (returner !== player) continue;
    total++;
    if (shot.result === "In") inPlay++;
  }

  return {
    rate: total >= MIN_SAMPLE ? inPlay / total : null,
    total,
    won: inPlay,
  };
}

export interface ServePlusOneChain {
  serveZone: string;
  plusOneStroke: string;
  plusOneZone: string;
  count: number;
  won: number;
  winRate: number | null;
  meanPlusOneX: number;
  meanPlusOneY: number;
}

export function computeServePlusOneChains(
  shots: EnrichedShot[],
  player: string,
): ServePlusOneChain[] {
  const byPoint = new Map<string, EnrichedShot[]>();
  for (const shot of shots) {
    const key = pointKeyFromShot(shot);
    const bucket = byPoint.get(key) ?? [];
    bucket.push(shot);
    byPoint.set(key, bucket);
  }

  const chainMap = new Map<string, { count: number; plusOneStroke: string; plusOneZone: string; serveZone: string; won: number; plusOneXSum: number; plusOneYSum: number }>();

  for (const [key, pointShots] of byPoint) {
    const server = inferPointServer(shots, key);
    if (server !== player) continue;

    const serve = pointShots.find((s) => s.stroke === "Serve" && (s.type === "first_serve" || s.type === "First Serve"));
    if (!serve || serve.result !== "In") continue;

    const plusOne = pointShots.find((s) => s.shotNumber === 3);
    if (!plusOne) continue;

    const serveZone = serve.direction || "Unknown";
    const plusOneStroke = plusOne.stroke || "Unknown";
    const plusOneZone = plusOne.bounceZone || "Unknown";
    const chainKey = `${serveZone}|${plusOneStroke}|${plusOneZone}`;

    const entry = chainMap.get(chainKey) ?? { count: 0, plusOneStroke, plusOneZone, serveZone, won: 0, plusOneXSum: 0, plusOneYSum: 0 };
    entry.count++;
    entry.plusOneXSum += plusOne.bounceX ?? 0;
    entry.plusOneYSum += plusOne.bounceY ?? 0;
    if (plusOne.pointWinner === player) entry.won++;
    chainMap.set(chainKey, entry);
  }

  return [...chainMap.values()]
    .map((e) => ({
      count: e.count,
      meanPlusOneX: e.count > 0 ? e.plusOneXSum / e.count : 0,
      meanPlusOneY: e.count > 0 ? e.plusOneYSum / e.count : 0,
      plusOneStroke: e.plusOneStroke,
      plusOneZone: e.plusOneZone,
      serveZone: e.serveZone,
      winRate: e.count >= MIN_SAMPLE ? e.won / e.count : null,
      won: e.won,
    }))
    .filter((c) => c.count >= 2)
    .sort((a, b) => (b.winRate ?? 0) * Math.log(b.count + 1) - (a.winRate ?? 0) * Math.log(a.count + 1));
}

export function computePatternStats(
  shots: EnrichedShot[],
  player: string,
): PatternStats {
  return {
    firstStrike: computeFirstStrikeStats(shots, player),
    returnInPlay: computeReturnInPlayRate(shots, player),
    servePlusOne: computeServePlusOneStats(shots, player),
  };
}
