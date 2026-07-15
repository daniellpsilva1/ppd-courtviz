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

export const layout = {
  spacing,
  radii,
  strokes,
  headerPadding: { x: 0.06, y: 0.96 },
  annotation: {
    leaderWidth: 1,
    leaderWidthBroadcast: 1.5,
  },
  signatureDevices,
} as const;
