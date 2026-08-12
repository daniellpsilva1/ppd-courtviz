/**
 * Scorekeeper 3×3 placement zones → court meter centroids.
 *
 * Zones are numbered like a phone pad from the server's perspective looking
 * toward the opponent's service boxes / baseline:
 *
 *   1 2 3   (wide ad / T / wide deuce — deep)
 *   4 5 6   (body / center / body — mid)
 *   7 8 9   (short)
 *
 * Plus miss codes used in TerminalShot types.
 */

import { COURT_LENGTH, NET_Y, SINGLES_HALF } from "./geometry";

export type PlacementZoneId =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "net"
  | "wide"
  | "long";

export interface PlacementCentroid {
  x: number;
  y: number;
  zone: PlacementZoneId;
}

/** Far (receiver) half centroids — typical terminal bounce side for winners. */
const FAR_Y_DEEP = NET_Y + (COURT_LENGTH - NET_Y) * 0.72;
const FAR_Y_MID = NET_Y + (COURT_LENGTH - NET_Y) * 0.45;
const FAR_Y_SHORT = NET_Y + (COURT_LENGTH - NET_Y) * 0.2;
const X_WIDE_AD = -SINGLES_HALF * 0.75;
const X_T = 0;
const X_WIDE_DEUCE = SINGLES_HALF * 0.75;

const ZONE_CENTROIDS: Record<PlacementZoneId, { x: number; y: number }> = {
  "1": { x: X_WIDE_AD, y: FAR_Y_DEEP },
  "2": { x: X_T, y: FAR_Y_DEEP },
  "3": { x: X_WIDE_DEUCE, y: FAR_Y_DEEP },
  "4": { x: X_WIDE_AD, y: FAR_Y_MID },
  "5": { x: X_T, y: FAR_Y_MID },
  "6": { x: X_WIDE_DEUCE, y: FAR_Y_MID },
  "7": { x: X_WIDE_AD, y: FAR_Y_SHORT },
  "8": { x: X_T, y: FAR_Y_SHORT },
  "9": { x: X_WIDE_DEUCE, y: FAR_Y_SHORT },
  net: { x: 0, y: NET_Y },
  wide: { x: -SINGLES_HALF - 0.8, y: FAR_Y_MID },
  long: { x: 0, y: COURT_LENGTH + 0.8 },
};

export function normalizePlacementZone(
  raw: string | null | undefined,
): PlacementZoneId | null {
  if (raw == null) return null;
  const z = raw.trim().toLowerCase();
  if (z in ZONE_CENTROIDS) return z as PlacementZoneId;
  return null;
}

/**
 * Map a scorekeeper placement zone to approximate bounce meters.
 * Returns null for unknown zones — not a substitute for SwingVision tracking.
 */
export function placementZoneCentroid(
  zone: string | null | undefined,
): PlacementCentroid | null {
  const id = normalizePlacementZone(zone);
  if (!id) return null;
  const { x, y } = ZONE_CENTROIDS[id];
  return { x, y, zone: id };
}
