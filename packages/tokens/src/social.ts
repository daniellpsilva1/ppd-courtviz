export type SocialFormat = "square" | "portrait" | "story" | "landscape";

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
    safeArea: { top: 48, right: 40, bottom: 96, left: 40 },
  },
  story: {
    name: "story" as const,
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeArea: { top: 72, right: 40, bottom: 96, left: 40 },
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
  sourceLine: "Graphic: Peak Performance Data",
  productName: "Peak Performance Data",
  tagline: "Unified athlete intelligence for tennis academies",
  website: "https://peakperformancedata.app",
} as const;
