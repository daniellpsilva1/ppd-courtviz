import {
  COURT_LENGTH,
  SINGLES_HALF,
  computeHexbins,
  computeShotFlows,
  createCourtScales,
  curvedPath,
  normalizeShot,
  shotPlayerWonPoint,
  type EnrichedShot,
  type HexbinResult,
  type ShotFlow,
} from "@courtviz/core";
import { ppdDark, efficiencyColorStops, type CourtvizTheme } from "@courtviz/themes";
import { interpolateRgb } from "d3-interpolate";

const theme = ppdDark;
const stops = efficiencyColorStops(theme);

/** Court theme for data scenes — matches PPD / courtviz demo */
export const darkCourt: CourtvizTheme = ppdDark;

const darkStops = efficiencyColorStops(darkCourt);

export function getEfficiencyColor(value: number, useDark = false): string {
  const colorStops = useDark ? darkStops : stops;
  const t = Math.max(0, Math.min(1, value));
  for (let i = 0; i < colorStops.length - 1; i++) {
    const [offset1, color1] = colorStops[i]!;
    const [offset2, color2] = colorStops[i + 1]!;
    if (t >= offset1 && t <= offset2) {
      const localT = (t - offset1) / (offset2 - offset1);
      return interpolateRgb(color1, color2)(localT);
    }
  }
  return colorStops[colorStops.length - 1]![1];
}

export type HexbinBuildOptions = {
  gridsize?: number;
  minCount?: number;
  sizeRange?: [number, number];
};

export const SOCIAL_HEX_OPTS: HexbinBuildOptions = {
  gridsize: 8,
  minCount: 1,
  sizeRange: [0.35, 0.75],
};

export function buildPlayerHexbins(
  shots: EnrichedShot[],
  player: string,
  half: "near" | "full" = "near",
  options: HexbinBuildOptions = {},
) {
  const playerShots = shots.filter(
    (s) =>
      s.player === player &&
      s.stroke !== "Serve" &&
      s.bounceX != null &&
      s.bounceY != null &&
      s.result === "In",
  );

  const {
    gridsize = SOCIAL_HEX_OPTS.gridsize ?? 8,
    minCount = SOCIAL_HEX_OPTS.minCount ?? 1,
    sizeRange = SOCIAL_HEX_OPTS.sizeRange ?? [0.35, 0.75],
  } = options;

  const xs = playerShots.map((s) =>
    half === "near" ? normalizeShot(s.bounceX!, s.bounceY!, s.hitY!)[0] : s.bounceX!,
  );
  const ys = playerShots.map((s) =>
    half === "near" ? normalizeShot(s.bounceX!, s.bounceY!, s.hitY!)[1] : s.bounceY!,
  );

  return computeHexbins(
    {
      x: xs,
      y: ys,
      values: playerShots.map((s) => (shotPlayerWonPoint(s) ? 1 : 0)),
    },
    { gridsize, half, minCount, sizeRange },
  ).sort((a, b) => a.count - b.count);
}

export function sharedEfficiencyDomain(hexbinsList: HexbinResult[][]) {
  const values = hexbinsList.flat().map((h) => h.value);
  if (values.length === 0) return { vmin: 0, vmax: 1 };
  return { vmin: Math.min(...values), vmax: Math.max(...values) };
}

export function buildPlayerFlows(shots: EnrichedShot[], player: string): ShotFlow[] {
  const inShots = shots.filter(
    (s) =>
      s.player === player &&
      s.stroke !== "Serve" &&
      s.result === "In" &&
      s.bounceX != null &&
      s.bounceY != null &&
      s.hitX != null &&
      s.hitY != null,
  );

  return computeShotFlows(inShots, { minCount: 3, player })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((flow) => ({
      ...flow,
      fromX: clamp(flow.fromX, -SINGLES_HALF, SINGLES_HALF),
      fromY: clamp(flow.fromY, 0, COURT_LENGTH),
      toX: clamp(flow.toX, -SINGLES_HALF, SINGLES_HALF),
      toY: clamp(flow.toY, 0, COURT_LENGTH),
    }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export { curvedPath };

export function defaultCourtScales(
  width: number,
  height: number,
  half: "near" | "full" = "near",
) {
  return createCourtScales({ half, height, margin: 1.5, width });
}

export function courtPixelBounds(
  scales: ReturnType<typeof createCourtScales>,
  half: "near" | "full" = "near",
) {
  const xMin = scales.x(-SINGLES_HALF);
  const xMax = scales.x(SINGLES_HALF);
  const yMin = half === "full" ? scales.y(COURT_LENGTH) : scales.y(COURT_LENGTH / 2);
  const yMax = scales.y(0);
  return { xMin, xMax, yMin, yMax };
}

export { darkStops, stops, theme };
