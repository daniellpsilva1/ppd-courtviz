/**
 * Courtviz design tokens — derived from @ppd/tokens.
 */

import type { Surface } from "@courtviz/core";
import {
  brandDefaults,
  layout as tokenLayout,
  semanticColors,
  sportColors,
  typography,
} from "@ppd/tokens";

export const BG_COLOR = "#F5F0E8";
export const COURT_CLAY = "#C97B4E";
export const COURT_CLAY_LIGHT = "#E0A87E";
export const COURT_HARD = "#2E5A88";
export const COURT_GRASS = "#6B9E5A";
export const COURT_LINE = "#FFFFFF";
export const COURT_LINE_DARK = "#2B2B2B";
export const INK = "#1A1A1A";
export const ACCENT_ORANGE = "#E8742C";
export const ACCENT_BLUE = "#2B6CB0";
export const SURROUND_CLAY = "#B0663C";
export const SURROUND_HARD = "#244A72";
export const SURROUND_GRASS = "#5A8A4A";
export const HALO_COLOR = "#FAF6EE";
export const DIV_LOW = "#2B4D8C";
export const DIV_LOW_MID = "#6B8FCB";
export const DIV_MID = "#F5F0E8";
export const DIV_MID_LIGHT = "#E8DCC8";
export const DIV_HIGH = "#E8742C";
export const DIV_PEAK = "#8B1A1A";
export const PLAYER_HOST = "#E8742C";
export const PLAYER_GUEST = "#2B6CB0";
export const SPEED_CMAP = "turbo";

export interface TypographyTokens {
  condensedFont: string;
  bodyFont: string;
  condensedFontFallback: string;
  bodyFontFallback: string;
}

export const FONTS: TypographyTokens = {
  condensedFont: typography.families.condensed,
  bodyFont: typography.families.body,
  condensedFontFallback: typography.families.condensedFallback,
  bodyFontFallback: typography.families.bodyFallback,
};

export interface CourtvizTheme {
  name: string;
  background: string;
  ink: string;
  inkMuted: string;
  border: string;
  courtLine: string;
  courtLineDark: string;
  surfaceColors: Record<Surface, string>;
  surfaceColorsLight: Record<Surface, string>;
  surroundColors: Record<Surface, string>;
  haloColor: string;
  playerHost: string;
  playerGuest: string;
  diverging: {
    low: string;
    lowMid: string;
    mid: string;
    midLight: string;
    high: string;
    peak: string;
  };
  fonts: TypographyTokens;
  fontSize: {
    figureTitle: number;
    figureSubtitle: number;
    title: number;
    subtitle: number;
    body: number;
    small: number;
    label: number;
    source: number;
  };
  headerPadding: { x: number; y: number };
  annotation: {
    leaderColor: string;
    leaderWidth: number;
    calloutFill: string;
    calloutTextColor: string;
  };
  brand?: {
    handle: string;
    sourceLine: string;
  };
}

function buildThemeFromTokens(options: {
  name: string;
  semantic: {
    background: string;
    surface: string;
    surfaceRaised: string;
    ink: string;
    inkMuted: string;
    border: string;
    primary: string;
    accent: string;
    positive: string;
    negative: string;
    warning: string;
    courtLine: string;
    courtLineDark: string;
    halo: string;
  };
  surfaces: typeof sportColors.surface | typeof sportColors.surfaceLight;
  diverging: typeof sportColors.diverging | typeof sportColors.divergingLight;
  players: { host: string; guest: string };
  fontSize: typeof typography.sizes | typeof typography.sizesBroadcast;
  annotationFill: string;
  leaderWidth?: number;
  brand?: boolean;
}): CourtvizTheme {
  const s = options.semantic;
  const surf = options.surfaces;
  return {
    name: options.name,
    background: s.background,
    ink: s.ink,
    inkMuted: s.inkMuted,
    border: s.border,
    courtLine: s.courtLine,
    courtLineDark: s.courtLineDark,
    surfaceColors: { clay: surf.clay, grass: surf.grass, hard: surf.hard },
    surfaceColorsLight: { clay: surf.clayLight, grass: surf.grassLight, hard: surf.hardLight },
    surroundColors: { clay: surf.surroundClay, grass: surf.surroundGrass, hard: surf.surroundHard },
    haloColor: s.halo,
    playerHost: options.players.host,
    playerGuest: options.players.guest,
    diverging: {
      high: options.diverging.high,
      low: options.diverging.low,
      lowMid: options.diverging.lowMid,
      mid: options.diverging.mid,
      midLight: options.diverging.midLight,
      peak: options.diverging.peak,
    },
    fonts: FONTS,
    fontSize: { ...options.fontSize },
    headerPadding: tokenLayout.headerPadding,
    annotation: {
      calloutFill: options.annotationFill,
      calloutTextColor: s.ink,
      leaderColor: s.inkMuted,
      leaderWidth: options.leaderWidth ?? tokenLayout.annotation.leaderWidth,
    },
    brand: options.brand
      ? { handle: brandDefaults.handle, sourceLine: brandDefaults.sourceLine }
      : undefined,
  };
}

export const ppd: CourtvizTheme = buildThemeFromTokens({
  name: "ppd",
  semantic: semanticColors.dark,
  surfaces: sportColors.surface,
  diverging: sportColors.diverging,
  players: { host: sportColors.playerHost, guest: sportColors.playerGuest },
  fontSize: typography.sizes,
  annotationFill: semanticColors.dark.surface,
  brand: true,
});

/** @deprecated Use `ppd` instead */
export const ppdDark: CourtvizTheme = { ...ppd, name: "ppd-dark" };

export const ppdLight: CourtvizTheme = buildThemeFromTokens({
  name: "ppd-light",
  semantic: semanticColors.light,
  surfaces: sportColors.surfaceLight,
  diverging: sportColors.divergingLight,
  players: { host: "#2563EB", guest: "#2B6CB0" },
  fontSize: typography.sizes,
  annotationFill: semanticColors.light.surfaceRaised,
});

/** Light editorial theme for article-style graphics and social cards */
export const ppdEditorial: CourtvizTheme = buildThemeFromTokens({
  name: "ppd-editorial",
  semantic: {
    ...semanticColors.light,
    background: semanticColors.light.surface,
    halo: semanticColors.light.halo,
  },
  surfaces: sportColors.surfaceLight,
  diverging: sportColors.divergingLight,
  players: { host: sportColors.playerHost, guest: "#2563EB" },
  fontSize: typography.sizes,
  annotationFill: semanticColors.light.surfaceRaised,
  brand: true,
});

export const broadcast: CourtvizTheme = buildThemeFromTokens({
  name: "broadcast",
  semantic: {
    background: "#000000",
    surface: "#111111",
    surfaceRaised: "#1A1A1A",
    ink: semanticColors.dark.ink,
    inkMuted: semanticColors.dark.inkMuted,
    border: semanticColors.dark.border,
    primary: semanticColors.dark.primary,
    accent: semanticColors.dark.accent,
    positive: semanticColors.dark.positive,
    negative: semanticColors.dark.negative,
    warning: semanticColors.dark.warning,
    courtLine: semanticColors.dark.courtLine,
    courtLineDark: semanticColors.dark.courtLineDark,
    halo: "#000000",
  },
  surfaces: sportColors.surface,
  diverging: sportColors.diverging,
  players: { host: "#FF7A1A", guest: "#3A9EFF" },
  fontSize: typography.sizesBroadcast,
  annotationFill: "#222222",
  leaderWidth: tokenLayout.annotation.leaderWidthBroadcast,
  brand: true,
});

/** @deprecated Legacy warm-paper theme */
export const sprawlball: CourtvizTheme = {
  name: "sprawlball",
  background: BG_COLOR,
  ink: INK,
  inkMuted: "#555555",
  border: "#D4CFC4",
  courtLine: COURT_LINE,
  courtLineDark: COURT_LINE_DARK,
  surfaceColors: { clay: COURT_CLAY, grass: COURT_GRASS, hard: COURT_HARD },
  surfaceColorsLight: { clay: COURT_CLAY_LIGHT, grass: "#8BB87A", hard: "#4A7AB8" },
  surroundColors: { clay: SURROUND_CLAY, grass: SURROUND_GRASS, hard: SURROUND_HARD },
  haloColor: HALO_COLOR,
  playerHost: PLAYER_HOST,
  playerGuest: PLAYER_GUEST,
  diverging: {
    high: DIV_HIGH, low: DIV_LOW, lowMid: DIV_LOW_MID,
    mid: DIV_MID, midLight: DIV_MID_LIGHT, peak: DIV_PEAK,
  },
  fonts: FONTS,
  fontSize: { ...typography.sizes },
  headerPadding: tokenLayout.headerPadding,
  annotation: {
    calloutFill: BG_COLOR, calloutTextColor: INK, leaderColor: INK, leaderWidth: 1,
  },
};

export const themes: Record<string, CourtvizTheme> = {
  broadcast, ppd, ppdDark, ppdEditorial, ppdLight, sprawlball,
};

export function getTheme(name: string = "ppd"): CourtvizTheme {
  return themes[name] ?? ppd;
}

export function getSurfaceColor(surface: Surface, theme: CourtvizTheme = ppd): string {
  return theme.surfaceColors[surface] ?? theme.surfaceColors.hard!;
}

export function getSurfaceColorLight(surface: Surface, theme: CourtvizTheme = ppd): string {
  return theme.surfaceColorsLight[surface] ?? theme.surfaceColorsLight.hard!;
}

export function getSurroundColor(surface: Surface, theme: CourtvizTheme = ppd): string {
  return theme.surroundColors[surface] ?? theme.surroundColors.hard!;
}

export function getPlayerColor(player: string, theme: CourtvizTheme = ppd): string {
  return player === "host" ? theme.playerHost : theme.playerGuest;
}

export function efficiencyColorStops(theme: CourtvizTheme = ppd): Array<[number, string]> {
  const d = theme.diverging;
  return [
    [0.0, d.low], [0.2, d.low], [0.35, d.lowMid], [0.5, d.midLight],
    [0.65, d.high], [0.85, d.high], [1.0, d.peak],
  ];
}
