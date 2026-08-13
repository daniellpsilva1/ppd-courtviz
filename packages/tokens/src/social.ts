export type SocialFormat = "square" | "portrait" | "story" | "landscape";

/**
 * Single reconciled bottom safe inset for 1080x1920 story canvases.
 * Shared by the story poster safe area and video chrome (previously 96 vs 140).
 */
export const STORY_BOTTOM_SAFE_INSET = 140;

/**
 * Bottom safe inset for 1080x1350 (4:5) feed posts.
 * Clears Instagram feed action-bar / caption chrome; keep FigureFrame chrome
 * (slide index, source) inside this band — not in the dead zone below it.
 */
export const PORTRAIT_BOTTOM_SAFE_INSET = 120;

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SocialCanvasPreset {
  name: SocialFormat;
  width: number;
  height: number;
  aspectRatio: string;
  safeArea: SafeAreaInsets;
}

export const socialFormats = {
  square: {
    name: "square" as const,
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    safeArea: { top: 40, right: 40, bottom: 80, left: 40 },
  },
  portrait: {
    name: "portrait" as const,
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    safeArea: { top: 48, right: 40, bottom: PORTRAIT_BOTTOM_SAFE_INSET, left: 40 },
  },
  story: {
    name: "story" as const,
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeArea: { top: 72, right: 40, bottom: STORY_BOTTOM_SAFE_INSET, left: 40 },
  },
  landscape: {
    name: "landscape" as const,
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    safeArea: { top: 40, right: 48, bottom: 72, left: 48 },
  },
} as const satisfies Record<SocialFormat, SocialCanvasPreset>;

export const brandHandle = "@peakperformancedata";

export const brandDefaults = {
  handle: brandHandle,
  productName: "Peak Performance Data",
  sourceLine: "Graphic: Peak Performance Data",
  tagline: "Unified athlete intelligence for tennis academies",
  website: "https://peakperformancedata.app",
} as const;

export const deckCopy = {
  intro: {
    hookStatLabel: "Tracked shots",
    subtitle: "Match analysis",
  },
  cta: {
    headline: "Follow @peakperformancedata",
    subline: "See more match breakdowns",
    primary: "Follow",
  },
} as const;
