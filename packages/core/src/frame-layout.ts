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
  const reservedHeight =
    bands.analyticsBand +
    bands.legendBand +
    bands.insightBand +
    (bands.analyticsBand > 0 ? gap : 0) +
    (bands.legendBand > 0 ? gap : 0) +
    (bands.insightBand > 0 ? gap : 0);

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

  const courtY = layout.format === "landscape"
    ? Math.max(0, Math.round((region.height - blockHeight) / 2))
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

export function resolveFrameLayout(
  format: SocialFormat = "square",
  overrides?: { width?: number; height?: number; padding?: number },
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
    const footerH = 56;
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

  const footerH = format === "story" ? 64 : 56;
  const titleH = format === "story" ? 120 : format === "portrait" ? 100 : 80;
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
