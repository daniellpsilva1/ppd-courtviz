/**
 * Social / broadcast encode presets for offline PNG→MP4 export.
 */

export interface VideoExportPreset {
  id: string;
  width: number;
  height: number;
  fps: number;
  crf: number;
  /** Bottom safe inset in px for story UI chrome (IG/TikTok) */
  bottomSafeInset: number;
  label: string;
}

export const STORY_9x16: VideoExportPreset = {
  id: "story-9x16",
  width: 1080,
  height: 1920,
  fps: 30,
  crf: 16,
  bottomSafeInset: 140,
  label: "Instagram / TikTok Story 9:16",
};

export const LANDSCAPE_16x9: VideoExportPreset = {
  id: "landscape-16x9",
  width: 1920,
  height: 1080,
  fps: 30,
  crf: 16,
  bottomSafeInset: 48,
  label: "Landscape 16:9",
};

export const VIDEO_PRESETS = {
  story: STORY_9x16,
  landscape: LANDSCAPE_16x9,
} as const;

export function resolvePreset(
  id: keyof typeof VIDEO_PRESETS | string = "story",
): VideoExportPreset {
  if (id in VIDEO_PRESETS) {
    return VIDEO_PRESETS[id as keyof typeof VIDEO_PRESETS];
  }
  return STORY_9x16;
}
