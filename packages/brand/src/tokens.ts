import { colorPrimitives, semanticColors, sportColors, typography as tokenTypography } from "@ppd/tokens";

export interface PpdColorSemantics {
  positive: string;
  negative: string;
  neutral: string;
  confidence: string;
  missing: string;
  playerHost: string;
  playerGuest: string;
  courtClay: string;
  courtHard: string;
  courtGrass: string;
}

export interface PpdTypography {
  displayFamily: string;
  bodyFamily: string;
  displayFallback: string;
  bodyFallback: string;
}

export interface PpdBrandMode {
  name: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentMuted: string;
}

export interface PpdBrandTokens {
  name: string;
  modes: {
    editorial: PpdBrandMode;
    product: PpdBrandMode;
    broadcast: PpdBrandMode;
  };
  semantics: PpdColorSemantics;
  typography: PpdTypography;
  motion: {
    fastMs: number;
    normalMs: number;
    slowMs: number;
  };
  figure: {
    padding: number;
    sourceSize: number;
    titleSize: number;
    subtitleSize: number;
  };
}

const light = semanticColors.light;
const dark = semanticColors.dark;

export const ppdBrand: PpdBrandTokens = {
  name: "Peak Performance Data",
  modes: {
    editorial: {
      name: "editorial",
      background: light.surface,
      surface: light.background,
      surfaceRaised: light.surfaceRaised,
      border: light.border,
      ink: colorPrimitives.navy900,
      inkMuted: colorPrimitives.inkSubtle,
      accent: colorPrimitives.primary,
      accentMuted: colorPrimitives.primaryBright,
    },
    product: {
      name: "product",
      background: dark.background,
      surface: dark.surface,
      surfaceRaised: dark.surfaceRaised,
      border: dark.border,
      ink: dark.ink,
      inkMuted: dark.inkMuted,
      accent: dark.primary,
      accentMuted: colorPrimitives.accent,
    },
    broadcast: {
      name: "broadcast",
      background: colorPrimitives.black,
      surface: "#111111",
      surfaceRaised: "#1A1A1A",
      border: "#333333",
      ink: colorPrimitives.white,
      inkMuted: "#CCCCCC",
      accent: colorPrimitives.amber,
      accentMuted: "#FFB380",
    },
  },
  semantics: {
    positive: colorPrimitives.positive,
    negative: colorPrimitives.negative,
    neutral: colorPrimitives.inkSubtle,
    confidence: colorPrimitives.primary,
    missing: colorPrimitives.inkMuted,
    playerHost: sportColors.playerHost,
    playerGuest: sportColors.playerGuest,
    courtClay: sportColors.surfaceLight.clay,
    courtHard: sportColors.surfaceLight.hard,
    courtGrass: sportColors.surfaceLight.grass,
  },
  typography: {
    displayFamily: tokenTypography.families.condensed,
    bodyFamily: tokenTypography.families.body,
    displayFallback: tokenTypography.families.condensedFallback,
    bodyFallback: tokenTypography.families.bodyFallback,
  },
  motion: {
    fastMs: 150,
    normalMs: 220,
    slowMs: 360,
  },
  figure: {
    padding: 40,
    sourceSize: 8,
    titleSize: 34,
    subtitleSize: 14,
  },
};

export type PpdBrandModeName = keyof PpdBrandTokens["modes"];
