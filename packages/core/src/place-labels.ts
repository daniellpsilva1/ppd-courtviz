/**
 * Label placement with collision resolution.
 *
 * Given a set of anchor points, `placeLabels` finds a non-overlapping slot
 * for each label by trying candidate positions at increasing radii.
 * Rejects on AABB overlap with already-placed labels or bounds violation.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelAnchor {
  /** Anchor point in canvas/SVG coordinates. */
  x: number;
  y: number;
  /** Measured or estimated label bounding box. */
  width: number;
  height: number;
  /** Optional preferred offset direction (default: tries all candidates). */
  preferred?: "NE" | "NW" | "SE" | "SW";
}

export interface PlaceLabelsOptions {
  bounds: Rect;
  /** Already-occupied rectangles (obstacles) that labels must avoid. */
  obstacles?: Rect[];
  /** Gap between labels and obstacles in px (default: 4). */
  gap?: number;
  /** Step size for candidate radius expansion (default: 12). */
  radiusStep?: number;
  /** Maximum radius to search (default: 80). */
  maxRadius?: number;
}

export interface PlacedLabel extends Rect {
  anchorX: number;
  anchorY: number;
  /** The candidate slot that was accepted. */
  slot: "NE" | "NW" | "SE" | "SW";
}

const SLOTS = ["NE", "NW", "SE", "SW"] as const;

function slotOffset(
  slot: "NE" | "NW" | "SE" | "SW",
  radius: number,
  width: number,
  height: number,
): { dx: number; dy: number } {
  switch (slot) {
    case "NE":
      return { dx: radius, dy: -radius - height };
    case "NW":
      return { dx: -radius - width, dy: -radius - height };
    case "SE":
      return { dx: radius, dy: radius };
    case "SW":
      return { dx: -radius - width, dy: radius };
  }
}

function aabbOverlap(a: Rect, b: Rect, gap: number): boolean {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

function inBounds(r: Rect, bounds: Rect): boolean {
  return (
    r.x >= bounds.x &&
    r.y >= bounds.y &&
    r.x + r.width <= bounds.x + bounds.width &&
    r.y + r.height <= bounds.y + bounds.height
  );
}

export function placeLabels(
  anchors: LabelAnchor[],
  opts: PlaceLabelsOptions,
): PlacedLabel[] {
  const gap = opts.gap ?? 4;
  const radiusStep = opts.radiusStep ?? 12;
  const maxRadius = opts.maxRadius ?? 80;
  const placed: PlacedLabel[] = [];
  const obstacles = opts.obstacles ?? [];

  for (const anchor of anchors) {
    const slotOrder = anchor.preferred
      ? [anchor.preferred, ...SLOTS.filter((s) => s !== anchor.preferred)]
      : [...SLOTS];

    let best: PlacedLabel | null = null;

    for (let radius = 0; radius <= maxRadius; radius += radiusStep) {
      for (const slot of slotOrder) {
        const { dx, dy } = slotOffset(slot, radius, anchor.width, anchor.height);
        const rect: Rect = {
          height: anchor.height,
          width: anchor.width,
          x: anchor.x + dx,
          y: anchor.y + dy,
        };

        if (!inBounds(rect, opts.bounds)) continue;

        const conflicts = [...placed, ...obstacles].some((o) =>
          aabbOverlap(rect, o, gap),
        );
        if (!conflicts) {
          best = {
            ...rect,
            anchorX: anchor.x,
            anchorY: anchor.y,
            slot,
          };
          break;
        }
      }
      if (best) break;
    }

    if (best) {
      placed.push(best);
    } else {
      // Fallback: place at anchor with small NE offset even if it overlaps.
      placed.push({
        anchorX: anchor.x,
        anchorY: anchor.y,
        height: anchor.height,
        slot: "NE",
        width: anchor.width,
        x: anchor.x + 4,
        y: anchor.y - anchor.height - 4,
      });
    }
  }

  return placed;
}
