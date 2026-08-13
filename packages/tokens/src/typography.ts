export const fontFamilies = {
  body: "Inter",
  bodyFallback: "Helvetica Neue, Arial, sans-serif",
  condensed: "Barlow Condensed",
  condensedFallback: "Arial Narrow, sans-serif",
} as const;

export const fontWeights = {
  bold: 700,
  medium: 500,
  regular: 400,
  semibold: 600,
} as const;

export const fontSizeRamp = {
  body: 12,
  figureSubtitle: 14,
  figureTitle: 34,
  label: 10,
  small: 10,
  source: 9,
  subtitle: 12,
  title: 22,
} as const;

export const fontSizeRampBroadcast = {
  body: 12,
  figureSubtitle: 16,
  figureTitle: 38,
  label: 11,
  small: 10,
  source: 9,
  subtitle: 12,
  title: 24,
} as const;

export const fontSizeRampDeck = {
  body: 16,
  figureSubtitle: 20,
  figureTitle: 48,
  heroScore: 72,
  hookStat: 28,
  label: 13,
  small: 12,
  source: 11,
  subtitle: 18,
  title: 32,
} as const;

export const typography = {
  families: fontFamilies,
  sizes: fontSizeRamp,
  sizesBroadcast: fontSizeRampBroadcast,
  sizesDeck: fontSizeRampDeck,
  weights: fontWeights,
} as const;
