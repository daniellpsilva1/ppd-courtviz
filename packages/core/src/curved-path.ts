export interface CurvedPathBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Quadratic Bézier path from (x1,y1) to (x2,y2) with optional court-bound clamping.
 * Control and end coordinates are separated so fractional pixel values cannot merge
 * into invalid SVG path tokens (e.g. `512.7180.2`).
 */
export function curvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.04,
  courtBounds?: CurvedPathBounds,
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M${x1},${y1}L${x2},${y2}`;

  const offset = curvature * len;
  let cx = mx - (dy / len) * offset;
  let cy = my + (dx / len) * offset;

  if (courtBounds) {
    cx = clamp(cx, courtBounds.xMin, courtBounds.xMax);
    cy = clamp(cy, courtBounds.yMin, courtBounds.yMax);
  }

  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/** Parse a quadratic path produced by {@link curvedPath} for regression tests. */
export function parseQuadraticPath(d: string): {
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
} {
  const match = d.match(
    /^M([-\d.]+),([-\d.]+) Q([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+)$/,
  );
  if (!match) throw new Error(`Invalid quadratic path: ${d}`);
  return {
    x1: Number(match[1]),
    y1: Number(match[2]),
    cx: Number(match[3]),
    cy: Number(match[4]),
    x2: Number(match[5]),
    y2: Number(match[6]),
  };
}
