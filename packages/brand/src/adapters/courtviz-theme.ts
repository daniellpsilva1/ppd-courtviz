import type { CourtvizTheme } from "@courtviz/themes";
import {
  brandDefaults,
  layout as tokenLayout,
  semanticColors,
  sportColors,
  typography,
} from "@ppd/tokens";
import { type PpdBrandModeName, ppdBrand } from "../tokens";

/**
 * Map PPD brand modes to CourtvizTheme, using @ppd/tokens for shared semantics.
 */
export function toCourtvizTheme(mode: PpdBrandModeName = "editorial"): CourtvizTheme {
  const m = ppdBrand.modes[mode];
  const s = ppdBrand.semantics;
  const t = ppdBrand.typography;
  const f = ppdBrand.figure;

  if (mode === "editorial") {
    const light = semanticColors.light;
    const surf = sportColors.surfaceLight;
    return {
      name: "ppd-editorial",
      background: m.background,
      ink: m.ink,
      inkMuted: m.inkMuted,
      border: m.border,
      courtLine: light.courtLine,
      courtLineDark: light.courtLineDark,
      surfaceColors: { clay: s.courtClay, grass: s.courtGrass, hard: s.courtHard },
      surfaceColorsLight: {
        clay: surf.clayLight,
        grass: surf.grassLight,
        hard: surf.hardLight,
      },
      surroundColors: {
        clay: surf.surroundClay,
        grass: surf.surroundGrass,
        hard: surf.surroundHard,
      },
      haloColor: "#FAF6EE",
      playerHost: s.playerHost,
      playerGuest: s.playerGuest,
      diverging: { ...sportColors.divergingLight },
      fonts: {
        condensedFont: t.displayFamily,
        bodyFont: t.bodyFamily,
        condensedFontFallback: t.displayFallback,
        bodyFontFallback: t.bodyFallback,
      },
      fontSize: {
        body: typography.sizes.body,
        figureSubtitle: f.subtitleSize,
        figureTitle: f.titleSize,
        label: typography.sizes.label,
        small: typography.sizes.small,
        source: f.sourceSize,
        subtitle: typography.sizes.subtitle,
        title: typography.sizes.title,
      },
      headerPadding: tokenLayout.headerPadding,
      annotation: {
        calloutFill: m.surfaceRaised,
        calloutTextColor: m.ink,
        leaderColor: m.inkMuted,
        leaderWidth: tokenLayout.annotation.leaderWidth,
      },
    };
  }

  if (mode === "product") {
    const dark = semanticColors.dark;
    const surf = sportColors.surface;
    return {
      name: "ppd-product",
      background: m.background,
      ink: m.ink,
      inkMuted: m.inkMuted,
      border: dark.border,
      courtLine: dark.courtLine,
      courtLineDark: dark.courtLineDark,
      surfaceColors: { clay: surf.clay, grass: surf.grass, hard: surf.hard },
      surfaceColorsLight: {
        clay: surf.clayLight,
        grass: surf.grassLight,
        hard: surf.hardLight,
      },
      surroundColors: {
        clay: surf.surroundClay,
        grass: surf.surroundGrass,
        hard: surf.surroundHard,
      },
      haloColor: dark.halo,
      playerHost: s.playerHost,
      playerGuest: s.playerGuest,
      diverging: { ...sportColors.diverging },
      fonts: {
        condensedFont: t.displayFamily,
        bodyFont: t.bodyFamily,
        condensedFontFallback: t.displayFallback,
        bodyFontFallback: t.bodyFallback,
      },
      fontSize: {
        body: typography.sizes.body,
        figureSubtitle: f.subtitleSize,
        figureTitle: f.titleSize,
        label: typography.sizes.label,
        small: typography.sizes.small,
        source: f.sourceSize,
        subtitle: typography.sizes.subtitle,
        title: typography.sizes.title,
      },
      headerPadding: tokenLayout.headerPadding,
      annotation: {
        calloutFill: m.surfaceRaised,
        calloutTextColor: m.ink,
        leaderColor: m.inkMuted,
        leaderWidth: tokenLayout.annotation.leaderWidth,
      },
    };
  }

  const dark = semanticColors.dark;
  const surf = sportColors.surface;
  return {
    name: "ppd-broadcast",
    background: m.background,
    ink: m.ink,
    inkMuted: m.inkMuted,
    border: "#333333",
    courtLine: dark.courtLine,
    courtLineDark: dark.courtLineDark,
    surfaceColors: { clay: surf.clay, grass: surf.grass, hard: surf.hard },
    surfaceColorsLight: {
      clay: surf.clayLight,
      grass: surf.grassLight,
      hard: surf.hardLight,
    },
    surroundColors: {
      clay: surf.surroundClay,
      grass: surf.surroundGrass,
      hard: surf.surroundHard,
    },
    haloColor: m.background,
    playerHost: s.playerHost,
    playerGuest: s.playerGuest,
    diverging: { ...sportColors.diverging },
    fonts: {
      condensedFont: t.displayFamily,
      bodyFont: t.bodyFamily,
      condensedFontFallback: t.displayFallback,
      bodyFontFallback: t.bodyFallback,
    },
    fontSize: {
      body: typography.sizesBroadcast.body,
      figureSubtitle: typography.sizesBroadcast.figureSubtitle,
      figureTitle: typography.sizesBroadcast.figureTitle,
      label: typography.sizesBroadcast.label,
      small: typography.sizesBroadcast.small,
      source: typography.sizesBroadcast.source,
      subtitle: typography.sizesBroadcast.subtitle,
      title: typography.sizesBroadcast.title,
    },
    headerPadding: tokenLayout.headerPadding,
    annotation: {
      calloutFill: m.surfaceRaised,
      calloutTextColor: m.ink,
      leaderColor: m.inkMuted,
      leaderWidth: tokenLayout.annotation.leaderWidthBroadcast,
    },
    brand: {
      handle: brandDefaults.handle,
      sourceLine: brandDefaults.sourceLine,
    },
  };
}
