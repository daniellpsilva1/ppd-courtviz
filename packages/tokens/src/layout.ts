export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  figurePadding: 40,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  brandMark: 6,
} as const;

export const strokes = {
  hairline: 1,
  default: 1.5,
  broadcast: 2,
} as const;

export const signatureDevices = {
  baselineRule: {
    height: 4,
    inset: 0,
    accentWidth: 0.12,
  },
  cornerNotch: {
    size: 16,
    strokeWidth: 2,
    inset: 8,
  },
} as const;

/** Video/story chrome bands — kept in sync with marketing courtviz. */
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
    safeInset: 140,
    scoreBar: 66,
  },
} as const;

export const layout = {
  spacing,
  radii,
  strokes,
  chrome,
  headerPadding: { x: 0.06, y: 0.96 },
  annotation: {
    leaderWidth: 1,
    leaderWidthBroadcast: 1.5,
  },
  signatureDevices,
} as const;
