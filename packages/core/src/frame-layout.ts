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
