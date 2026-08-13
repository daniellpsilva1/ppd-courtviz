/**
 * Frame layout resolver for multi-format social posters.
 */

import { getSocialPreset, type SocialFormat } from "@ppd/tokens";

export interface FrameRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameLayout {
  format: SocialFormat;
  width: number;
  height: number;
  padding: number;
  title: FrameRegion;
  content: FrameRegion;
  footer: FrameRegion;
  safeArea: FrameRegion;
}

export interface PosterBandHeights {
  analyticsBand: number;
  legendBand: number;
  insightBand: number;
}

export interface PosterContentSpec {
  courtAspect?: number;
  analyticsBand?: number;
  legendBand?: number;
  insightBand?: number;
  gap?: number;
  /** Distribute leftover vertical space: "grow-court" enlarges the court, "center" centers the whole block. */
  distribute?: "grow-court" | "center";
}

export interface PosterContentLayout {
  courtX: number;
  courtY: number;
  courtWidth: number;
  courtHeight: number;
  analyticsY: number;
  legendY: number;
  insightY: number;
  bands: PosterBandHeights;
}

const DEFAULT_BANDS: Record<SocialFormat, PosterBandHeights> = {
  square: { analyticsBand: 160, legendBand: 120, insightBand: 80 },
  portrait: { analyticsBand: 180, legendBand: 150, insightBand: 80 },
  story: { analyticsBand: 200, legendBand: 160, insightBand: 80 },
  landscape: { analyticsBand: 0, legendBand: 0, insightBand: 80 },
};

export function resolvePosterBands(
  format: SocialFormat,
  overrides?: Partial<PosterBandHeights>,
): PosterBandHeights {
  const base = DEFAULT_BANDS[format];
  return {
    analyticsBand: overrides?.analyticsBand ?? base.analyticsBand,
    legendBand: overrides?.legendBand ?? base.legendBand,
    insightBand: overrides?.insightBand ?? base.insightBand,
  };
}

/**
 * Measure content blocks and distribute vertical space evenly — no magic offsets.
 */
export function resolvePosterContentLayout(
  layout: FrameLayout,
  spec: PosterContentSpec = {},
): PosterContentLayout {
  const region = layout.content;
  const bands = resolvePosterBands(layout.format, {
    analyticsBand: spec.analyticsBand,
    legendBand: spec.legendBand,
    insightBand: spec.insightBand,
  });
  const gap = spec.gap ?? 12;
  const courtAspect = spec.courtAspect ?? 1;
  const distribute = spec.distribute ?? "grow-court";
  const activeBands = [bands.analyticsBand, bands.legendBand, bands.insightBand].filter((h) => h > 0).length;
  const gapTotal = activeBands > 0 ? gap * (activeBands + 1) : 0; // gaps between court→band→band→band (no trailing)
  const reservedHeight =
    bands.analyticsBand +
    bands.legendBand +
    bands.insightBand +
    gapTotal;

  const maxCourtHeight = Math.max(120, region.height - reservedHeight - gap);
  const maxCourtWidth = region.width - 8;
  let courtHeight = maxCourtHeight;
  let courtWidth = courtHeight * courtAspect;
  if (courtWidth > maxCourtWidth) {
    courtWidth = maxCourtWidth;
    courtHeight = courtWidth / courtAspect;
  }

  let blockHeight = courtHeight + reservedHeight;
  const maxBlockHeight = Math.max(120, region.height - gap);
  if (blockHeight > maxBlockHeight) {
    courtHeight = Math.max(80, maxBlockHeight - reservedHeight);
    courtWidth = courtHeight * courtAspect;
    if (courtWidth > maxCourtWidth) {
      courtWidth = maxCourtWidth;
      courtHeight = courtWidth / courtAspect;
    }
    blockHeight = courtHeight + reservedHeight;
  }

  const leftover = region.height - blockHeight;
  const courtY = layout.format === "landscape" || distribute === "center"
    ? Math.max(0, Math.round(leftover / 2))
    : 0;
  const courtX = Math.round((region.width - courtWidth) / 2);
  let cursor = courtY + courtHeight + gap;

  const analyticsY = bands.analyticsBand > 0 ? cursor : 0;
  if (bands.analyticsBand > 0) cursor += bands.analyticsBand + gap;

  const legendY = bands.legendBand > 0 ? cursor : 0;
  if (bands.legendBand > 0) cursor += bands.legendBand + gap;

  const insightY = bands.insightBand > 0 ? cursor : 0;

  return {
    analyticsY,
    bands,
    courtHeight: Math.round(courtHeight),
    courtWidth: Math.round(courtWidth),
    courtX,
    courtY,
    insightY,
    legendY,
  };
}

export interface FrameLayoutOverrides {
  width?: number;
  height?: number;
  padding?: number;
  titleHeight?: number;
  footerHeight?: number;
}

// ---------------------------------------------------------------------------
// layoutBands — vertical stack allocator for deck slides
// ---------------------------------------------------------------------------

export interface BandSpec {
  id: string;
  /** Fixed height in px. Mutually exclusive with `grow`. */
  height?: number;
  /** If true, this band absorbs leftover vertical space. Only one band should have grow=true. */
  grow?: boolean;
  /** Minimum height when grow=true. Defaults to 0. */
  minHeight?: number;
}

export interface BandLayout {
  id: string;
  y: number;
  height: number;
}

/**
 * Allocate vertical bands within a content region.
 *
 * Each band is either a fixed height or `grow` (absorbs leftover space).
 * The cursor advances top-to-bottom with `gap` between bands.
 * Asserts the cursor never exceeds `contentHeight`.
 */
export function layoutBands(
  contentHeight: number,
  bands: BandSpec[],
  gap = 12,
): BandLayout[] {
  const fixedHeight = bands.reduce(
    (sum, b) => sum + (b.grow ? 0 : (b.height ?? 0)),
    0,
  );
  const gapTotal = bands.length > 1 ? gap * (bands.length - 1) : 0;
  const growBand = bands.find((b) => b.grow);
  const growMin = growBand?.minHeight ?? 0;
  const available = contentHeight - fixedHeight - gapTotal;
  const growHeight = Math.max(growMin, available);

  let cursor = 0;
  const result: BandLayout[] = [];

  for (const band of bands) {
    const h = band.grow ? growHeight : (band.height ?? 0);
    result.push({ height: Math.round(h), id: band.id, y: Math.round(cursor) });
    cursor += h + gap;
  }

  const overflow = cursor - gap - contentHeight;
  if (overflow > 1) {
    const msg = `[layoutBands] Bands overflow content height: ${cursor - gap} > ${contentHeight} (bands: ${bands.map((b) => b.id).join(", ")})`;
    if (typeof process !== "undefined" && process.env?.COURTVIZ_LAYOUT_STRICT === "1") {
      throw new Error(msg);
    }
    console.warn(msg);
  }

  return result;
}

const DEFAULT_TITLE_HEIGHT: Record<SocialFormat, number> = {
  square: 80,
  portrait: 100,
  story: 120,
  landscape: 0,
};

const DEFAULT_FOOTER_HEIGHT: Record<SocialFormat, number> = {
  square: 56,
  portrait: 56,
  story: 64,
  landscape: 56,
};

export function resolveFrameLayout(
  format: SocialFormat = "square",
  overrides?: FrameLayoutOverrides,
): FrameLayout {
  const preset = getSocialPreset(format);
  const width = overrides?.width ?? preset.width;
  const height = overrides?.height ?? preset.height;
  const padding = overrides?.padding ?? 40;
  const safe = preset.safeArea;

  const safeArea: FrameRegion = {
    x: safe.left,
    y: safe.top,
    width: width - safe.left - safe.right,
    height: height - safe.top - safe.bottom,
  };

  if (format === "landscape") {
    const titleWidth = Math.round(width * 0.38);
    const contentX = titleWidth + padding;
    const footerH = overrides?.footerHeight ?? DEFAULT_FOOTER_HEIGHT.landscape;
    return {
      format,
      width,
      height,
      padding,
      title: {
        x: padding,
        y: padding,
        width: titleWidth - padding * 2,
        height: height - padding * 2 - footerH,
      },
      content: {
        x: contentX,
        y: padding,
        width: width - contentX - padding,
        height: height - padding * 2 - footerH,
      },
      footer: {
        x: padding,
        y: height - footerH - padding * 0.25,
        width: width - padding * 2,
        height: footerH,
      },
      safeArea,
    };
  }

  const footerH = overrides?.footerHeight ?? DEFAULT_FOOTER_HEIGHT[format];
  const titleH = overrides?.titleHeight ?? DEFAULT_TITLE_HEIGHT[format];
  const contentY = safe.top + titleH;
  const footerY = height - safe.bottom - footerH;

  return {
    format,
    width,
    height,
    padding,
    title: {
      x: safe.left,
      y: safe.top,
      width: safeArea.width,
      height: titleH,
    },
    content: {
      x: safe.left,
      y: contentY,
      width: safeArea.width,
      height: footerY - contentY - padding * 0.25,
    },
    footer: {
      x: safe.left,
      y: footerY,
      width: safeArea.width,
      height: footerH,
    },
    safeArea,
  };
}
