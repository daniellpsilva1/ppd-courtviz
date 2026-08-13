import { socialFormats, STORY_BOTTOM_SAFE_INSET } from "./social";

export const spacing = {
  figurePadding: 40,
  lg: 24,
  md: 16,
  sm: 8,
  xl: 32,
  xs: 4,
  xxl: 40,
} as const;

export const radii = {
  brandMark: 6,
  lg: 12,
  md: 8,
  sm: 4,
} as const;

export const strokes = {
  broadcast: 2,
  default: 1.5,
  hairline: 1,
} as const;

export const signatureDevices = {
  baselineRule: {
    accentWidth: 0.12,
    height: 4,
    inset: 0,
  },
  cornerNotch: {
    inset: 8,
    size: 16,
    strokeWidth: 2,
  },
} as const;

/**
 * Video/story chrome bands — the single source of truth (absorbs the old
 * VIDEO_CHROME in @courtviz/core and the orphaned chromeTokens).
 * Vertical header is 172 (previously 168 in one file, 172 in another).
 */
export const chrome = {
  landscape: {
    bottomPad: 28,
    callout: 72,
    footer: 212,
    gap: 20,
    header: 146,
    scoreBar: 58,
  },
  vertical: {
    bottomPad: 24,
    callout: 72,
    gap: 20,
    header: 172,
    safeInset: STORY_BOTTOM_SAFE_INSET,
    scoreBar: 66,
  },
} as const;

export const safeArea = {
  portrait: socialFormats.portrait.safeArea,
  story: socialFormats.story.safeArea,
} as const;

export const layout = {
  annotation: {
    leaderWidth: 1,
    leaderWidthBroadcast: 1.5,
  },
  chrome,
  headerPadding: { x: 0.06, y: 0.96 },
  radii,
  safeArea,
  signatureDevices,
  spacing,
  strokes,
} as const;
