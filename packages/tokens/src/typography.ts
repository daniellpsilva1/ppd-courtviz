export const fontFamilies = {
  condensed: "Oswald",
  body: "Inter",
  condensedFallback: "Arial Narrow, sans-serif",
  bodyFallback: "Helvetica Neue, Arial, sans-serif",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSizeRamp = {
  figureTitle: 34,
  figureSubtitle: 14,
  title: 22,
  subtitle: 11,
  body: 11,
  small: 9,
  label: 10,
  source: 8,
} as const;

export const fontSizeRampBroadcast = {
  figureTitle: 38,
  figureSubtitle: 16,
  title: 24,
  subtitle: 12,
  body: 12,
  small: 10,
  label: 11,
  source: 9,
} as const;

export const typography = {
  families: fontFamilies,
  weights: fontWeights,
  sizes: fontSizeRamp,
  sizesBroadcast: fontSizeRampBroadcast,
} as const;
