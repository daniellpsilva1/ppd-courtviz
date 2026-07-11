import type { PlayerStat } from "./schema";
import type { RateStat } from "@courtviz/core";

export function getOfficialStatValue(
  stats: PlayerStat[] | undefined,
  player: string,
  statName: string,
  setNumber = 0,
): number | null {
  if (!stats?.length) return null;
  const row = stats.find(
    (stat) =>
      stat.player === player &&
      stat.setNumber === setNumber &&
      stat.statName === statName,
  );
  return row?.statValue ?? null;
}

export function computeFirstServeInFromOfficial(
  stats: PlayerStat[] | undefined,
  player: string,
  setNumber = 0,
): RateStat | null {
  const total = getOfficialStatValue(stats, player, "1st Serves", setNumber);
  const won = getOfficialStatValue(stats, player, "1st Serves In", setNumber);
  if (total == null || won == null || total <= 0) return null;
  return {
    rate: won / total,
    total,
    won,
  };
}

export function computeBreakPointConversionFromOfficial(
  stats: PlayerStat[] | undefined,
  player: string,
  setNumber = 0,
): RateStat | null {
  const total = getOfficialStatValue(stats, player, "Break Point Opportunities", setNumber);
  const won = getOfficialStatValue(stats, player, "Break Points Won", setNumber);
  if (total == null || won == null || total <= 0) return null;
  return {
    rate: won / total,
    total,
    won,
  };
}

export function computePointsWonFromOfficial(
  stats: PlayerStat[] | undefined,
  player: string,
  setNumber = 0,
): RateStat | null {
  const total = getOfficialStatValue(stats, player, "Total Points", setNumber);
  const won = getOfficialStatValue(stats, player, "Total Points Won", setNumber);
  if (total == null || won == null || total <= 0) return null;
  return {
    rate: won / total,
    total,
    won,
  };
}

export function getOfficialStatPair(
  stats: PlayerStat[] | undefined,
  player: string,
  statName: string,
  setNumber = 0,
): { value: number; label: string } | null {
  const value = getOfficialStatValue(stats, player, statName, setNumber);
  if (value == null) return null;
  return { label: statName, value };
}
