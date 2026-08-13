import {
  NET_Y,
  SINGLES_HALF,
  type CourtHalf,
  type EnrichedShot,
  computeHexbins,
  normalizeShot,
  shotPlayerWonPoint,
} from "@courtviz/core";

const HEX_MIN_COUNT = 2;

export function singlesExtent(half: CourtHalf = "near"): [number, number, number, number] {
  const yMax = half === "near" ? NET_Y : half === "far" ? NET_Y * 2 : NET_Y * 2;
  const yMin = half === "far" ? NET_Y : 0;
  return [-SINGLES_HALF, SINGLES_HALF, yMin, yMax];
}

export function sharedEfficiencyDomain(
  shots: EnrichedShot[],
  player: string,
  half: CourtHalf = "near",
  gridsize = 9,
): { vmin: number; vmax: number } {
  const filtered = shots.filter(
    (s) => s.player === player && s.stroke !== "Serve" && s.bounceX != null && s.bounceY != null,
  );
  const xs = filtered.map((s) => normalizeShot(s.bounceX!, s.bounceY!, s.hitY ?? 0)[0]);
  const ys = filtered.map((s) => normalizeShot(s.bounceX!, s.bounceY!, s.hitY ?? 0)[1]);
  const values = filtered.map((s) => (shotPlayerWonPoint(s) ? 1 : 0));
  const hexes = computeHexbins(
    { x: xs, y: ys, values },
    { gridsize, half, minCount: HEX_MIN_COUNT, extent: singlesExtent(half) },
  );
  const vals = hexes.map((h) => h.value);
  if (vals.length === 0) return { vmin: 0, vmax: 1 };
  return { vmin: Math.min(...vals), vmax: Math.max(...vals) };
}

export function combinedEfficiencyDomain(
  shots: EnrichedShot[],
  players: string[],
  half: CourtHalf = "near",
  gridsize = 9,
): { vmin: number; vmax: number } {
  const domains = players.map((p) => sharedEfficiencyDomain(shots, p, half, gridsize));
  return {
    vmin: Math.min(...domains.map((d) => d.vmin)),
    vmax: Math.max(...domains.map((d) => d.vmax)),
  };
}

export const DOMINANCE_GRIDSIZE = 9;
export const DOMINANCE_HALF: CourtHalf = "near";
export const DOMINANCE_SIZE_RANGE: [number, number] = [0.25, 0.65];
export const DOMINANCE_HEX_MIN = HEX_MIN_COUNT;
