/**
 * Color primitives and semantic roles for the PPD unified dark brand.
 */

export const colorPrimitives = {
  navy950: "#0A0E1A",
  navy900: "#0F172A",
  navy800: "#141D33",
  navy700: "#1C2842",
  navy600: "#243352",
  ink: "#F2F5FA",
  inkMuted: "#9AA7BD",
  inkSubtle: "#64748B",
  primary: "#2563EB",
  primaryBright: "#3B82F6",
  primaryDark: "#1D4ED8",
  /** Marketing / landing page accent blue */
  marketing: "#0047FF",
  accent: "#10B981",
  accentDark: "#059669",
  violet: "#A855F7",
  amber: "#F59E0B",
  cyan: "#06B6D4",
  pink: "#EC4899",
  positive: "#10B981",
  negative: "#EF4444",
  warning: "#F59E0B",
  border: "#2A3550",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const chartPalette = [
  colorPrimitives.primaryBright,
  colorPrimitives.accent,
  colorPrimitives.violet,
  colorPrimitives.amber,
  colorPrimitives.cyan,
  colorPrimitives.pink,
] as const;

export const chartPaletteLight = [
  colorPrimitives.primary,
  colorPrimitives.accentDark,
  "#7C3AED",
  "#D97706",
  "#0891B2",
  "#DB2777",
] as const;

export type Surface = "clay" | "hard" | "grass";

export const sportColors = {
  playerHost: "#3B82F6",
  playerGuest: "#F97316",
  surface: {
    clay: "#A65D35",
    clayLight: "#C4784A",
    surroundClay: "#7A4528",
    hard: "#1A4570",
    hardLight: "#2A5F94",
    surroundHard: "#123050",
    grass: "#3D7A34",
    grassLight: "#5A9A4E",
    surroundGrass: "#2D5A26",
  },
  surfaceLight: {
    clay: "#C97B4E",
    clayLight: "#E0A87E",
    surroundClay: "#B0663C",
    hard: "#2E5A88",
    hardLight: "#4A7AB8",
    surroundHard: "#244A72",
    grass: "#6B9E5A",
    grassLight: "#8BB87A",
    surroundGrass: "#5A8A4A",
  },
  diverging: {
    low: "#1E4A8C",
    lowMid: "#3A6AAA",
    mid: "#2A3550",
    midLight: "#3D4A66",
    high: "#F97316",
    peak: "#FF4444",
  },
  divergingLight: {
    low: "#2B4D8C",
    lowMid: "#6B8FCB",
    mid: "#E2E8F0",
    midLight: "#CBD5E1",
    high: "#E8742C",
    peak: "#8B1A1A",
  },
  stroke: {
    forehand: "#3B82F6",
    backhand: "#2563EB",
    volley: "#10B981",
    serve: "#A855F7",
    overhead: "#EC4899",
    feed: "#64748B",
  },
  outcome: {
    in: "#10B981",
    out: "#EF4444",
    net: "#F59E0B",
  },
} as const;

export const semanticColors = {
  dark: {
    background: colorPrimitives.navy900,
    surface: colorPrimitives.navy800,
    surfaceRaised: colorPrimitives.navy700,
    ink: colorPrimitives.ink,
    inkMuted: colorPrimitives.inkMuted,
    border: colorPrimitives.border,
    primary: colorPrimitives.primaryBright,
    accent: colorPrimitives.accent,
    positive: colorPrimitives.positive,
    negative: colorPrimitives.negative,
    warning: colorPrimitives.warning,
    courtLine: colorPrimitives.white,
    courtLineDark: "#6B7280",
    halo: colorPrimitives.navy900,
  },
  light: {
    background: colorPrimitives.white,
    surface: "#F8FAFC",
    surfaceRaised: "#F1F5F9",
    ink: colorPrimitives.navy900,
    inkMuted: colorPrimitives.inkSubtle,
    border: "#E2E8F0",
    primary: colorPrimitives.primary,
    accent: colorPrimitives.accentDark,
    positive: colorPrimitives.accentDark,
    negative: colorPrimitives.negative,
    warning: colorPrimitives.amber,
    courtLine: colorPrimitives.white,
    courtLineDark: "#2B2B2B",
    halo: "#FAF6EE",
  },
} as const;
