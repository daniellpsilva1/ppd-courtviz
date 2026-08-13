/**
 * Geometry classification for point-ending "Out" bounces (singles play).
 *
 * SwingVision sometimes labels result=Out for bounces that still land inside
 * the singles rectangle. Those should not plot on errors-out maps.
 */

import {
  BASELINE_FAR,
  BASELINE_NEAR,
  DOUBLES_HALF,
  SINGLES_HALF,
} from "./geometry";

/** Float slack only — not a line-call tolerance. On the line is In. */
export const OUT_FLOAT_EPS = 1e-3;

/** Drop tracking junk beyond this distance past doubles / baselines. */
export const OUT_MAX_OUTSIDE_M = 2.0;

export type OutKind = "in_court" | "alley" | "wide" | "long" | "corner" | "far";

export interface ClassifyOutBounceOpts {
  /** Float epsilon for boundary comparisons (default OUT_FLOAT_EPS). */
  eps?: number;
  /** Max distance past doubles/baselines before classifying as far (default 2 m). */
  maxOutside?: number;
}

/**
 * Classify a bounce relative to singles legality (alleys count as outs).
 * Coordinates are full-court meters (SwingVision frame): x lateral, y along length.
 */
export function classifyOutBounce(
  bounceX: number,
  bounceY: number,
  opts: ClassifyOutBounceOpts = {},
): OutKind {
  const eps = opts.eps ?? OUT_FLOAT_EPS;
  const maxOut = opts.maxOutside ?? OUT_MAX_OUTSIDE_M;
  const absX = Math.abs(bounceX);

  const insideSingles =
    absX <= SINGLES_HALF + eps &&
    bounceY >= BASELINE_NEAR - eps &&
    bounceY <= BASELINE_FAR + eps;

  if (insideSingles) return "in_court";

  const beyondClip =
    absX > DOUBLES_HALF + maxOut ||
    bounceY < BASELINE_NEAR - maxOut ||
    bounceY > BASELINE_FAR + maxOut;
  if (beyondClip) return "far";

  const inAlleyX = absX > SINGLES_HALF + eps && absX <= DOUBLES_HALF + eps;
  const inY =
    bounceY >= BASELINE_NEAR - eps && bounceY <= BASELINE_FAR + eps;
  const pastBaseline =
    bounceY < BASELINE_NEAR - eps || bounceY > BASELINE_FAR + eps;
  const pastDoubles = absX > DOUBLES_HALF + eps;

  if (inAlleyX && inY) return "alley";
  if (pastBaseline && pastDoubles) return "corner";
  if (pastBaseline) return "long";
  if (pastDoubles || inAlleyX) return "wide";
  return "wide";
}

/** True outs that should appear on an errors-out court plot. */
export function shouldPlotOutError(
  bounceX: number | null | undefined,
  bounceY: number | null | undefined,
  opts?: ClassifyOutBounceOpts,
): boolean {
  if (bounceX == null || bounceY == null) return false;
  const kind = classifyOutBounce(bounceX, bounceY, opts);
  return kind !== "in_court" && kind !== "far";
}

export function isAlleyOut(
  bounceX: number,
  bounceY: number,
  opts?: ClassifyOutBounceOpts,
): boolean {
  return classifyOutBounce(bounceX, bounceY, opts) === "alley";
}
