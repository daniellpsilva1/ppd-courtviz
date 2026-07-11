import { DOUBLES_HALF, NET_Y, SINGLES_HALF } from "./geometry";

export interface ZoneRect {
  id: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export const BOUNCE_ZONE_ORDER = [
  "ad_alley",
  "ad",
  "center_line",
  "deuce",
  "deuce_alley",
] as const;

export const BOUNCE_ZONE_RECTS_NEAR: ZoneRect[] = [
  { id: "ad_alley", xMin: -DOUBLES_HALF, xMax: -SINGLES_HALF, yMin: 0, yMax: NET_Y },
  { id: "ad", xMin: -SINGLES_HALF, xMax: 0, yMin: 0, yMax: NET_Y },
  { id: "center_line", xMin: -0.3, xMax: 0.3, yMin: 0, yMax: NET_Y },
  { id: "deuce", xMin: 0, xMax: SINGLES_HALF, yMin: 0, yMax: NET_Y },
  { id: "deuce_alley", xMin: SINGLES_HALF, xMax: DOUBLES_HALF, yMin: 0, yMax: NET_Y },
];

export function normalizeBounceZoneId(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

export function bounceZoneRect(zoneId: string): ZoneRect | undefined {
  const normalized = normalizeBounceZoneId(zoneId);
  return BOUNCE_ZONE_RECTS_NEAR.find((rect) => rect.id === normalized);
}

export function bounceZoneCentroid(zoneId: string): { cx: number; cy: number } | null {
  const rect = bounceZoneRect(zoneId);
  if (!rect) return null;
  return {
    cx: (rect.xMin + rect.xMax) / 2,
    cy: (rect.yMin + rect.yMax) / 2,
  };
}

export function zoneRectToSvg(
  scales: { x: (v: number) => number; y: (v: number) => number },
  rect: ZoneRect,
) {
  const x = scales.x(rect.xMin);
  const y = scales.y(rect.yMax);
  const w = scales.x(rect.xMax) - scales.x(rect.xMin);
  const h = scales.y(rect.yMin) - scales.y(rect.yMax);
  return { h, w, x, y };
}
