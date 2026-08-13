/**
 * Map ITF court meters to Three.js world space.
 * Court x → world x, court y (length) → world z, optional hit height → world y.
 */
export function courtToThree(
  x: number,
  y: number,
  hitZ = 0.03,
): [number, number, number] {
  return [x, hitZ, y];
}

export function courtCenterY(half: "full" | "near" | "far" = "full"): number {
  switch (half) {
    case "near":
      return 11.885 / 2;
    case "far":
      return 11.885 + 11.885 / 2;
    default:
      return 11.885;
  }
}
