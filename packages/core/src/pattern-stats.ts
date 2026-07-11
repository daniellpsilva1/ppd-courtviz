/**
 * Coach-facing shot pattern metrics: serve+1, first-strike, return in-play.
 */

import type { EnrichedShot, RateStat } from "./stats";
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
  winRate: number;
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
      winRate: stats.total > 0 ? stats.won / stats.total : 0,
      won: stats.won,
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeFirstStrikeStats(
  shots: EnrichedShot[],
  player: string,
): RateStat {
  const pointMap = new Map<string, EnrichedShot>();

  for (const shot of shots) {
    if (shot.rallyLength == null || shot.rallyLength > 4) continue;
    const key = pointKeyFromShot(shot);
    if (!pointMap.has(key)) pointMap.set(key, shot);
  }

  let total = 0;
  let won = 0;
  for (const shot of pointMap.values()) {
    total++;
    if (shot.pointWinner === player) won++;
  }

  return {
    rate: total > 0 ? won / total : 0,
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
    rate: total > 0 ? inPlay / total : 0,
    total,
    won: inPlay,
  };
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
