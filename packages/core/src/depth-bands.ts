/**
 * Canonical depth bands from the net (meters) — single source for analytics + viz.
 * Aligns service-line geometry with product shot-depth classifiers.
 */

import { NET_Y, SERVICE_LINE_NEAR } from "./geometry";

/** Distance from net to service line (ITF). */
export const SERVICE_BOX_DEPTH_M = NET_Y - SERVICE_LINE_NEAR; // 5.485

/** Product analytics: short / mid / deep relative to net along the court. */
export const DEPTH_SHORT_MAX_M = SERVICE_BOX_DEPTH_M; // ≤ service line
export const DEPTH_DEEP_MIN_M = 8.5; // beyond mid court toward baseline

export type DepthBand = "short" | "mid" | "deep" | "out";

/**
 * Classify bounce depth from distance-to-net in meters (absolute).
 */
export function classifyDepthFromNet(distanceFromNetM: number | null | undefined): DepthBand | null {
  if (distanceFromNetM == null || Number.isNaN(distanceFromNetM)) return null;
  const d = Math.abs(distanceFromNetM);
  if (d > 12.5) return "out"; // past baseline + margin
  if (d <= DEPTH_SHORT_MAX_M) return "short";
  if (d >= DEPTH_DEEP_MIN_M) return "deep";
  return "mid";
}

/**
 * Bounce Y → distance from net (court meters, origin at near baseline).
 */
export function distanceFromNetY(bounceY: number): number {
  return Math.abs(bounceY - NET_Y);
}
