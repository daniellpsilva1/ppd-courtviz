import { colorPrimitives, sportColors, typography as tokenTypography } from "@ppd/tokens";

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

export const ppdBrand: PpdBrandTokens = {
  name: "Peak Performance Data",
  modes: {
    editorial: {
      name: "editorial",
      background: "#F7F3EB",
      surface: "#FFFDF8",
      surfaceRaised: "#FFFFFF",
      border: "#D8D0C4",
      ink: "#12141A",
      inkMuted: "#5C5F6A",
      accent: "#C4522D",
      accentMuted: "#E8A88A",
    },
    product: {
      name: "product",
      background: "#0E1117",
      surface: "#161A22",
      surfaceRaised: "#1E232D",
      border: "#2A3140",
      ink: "#F2F3F5",
      inkMuted: "#9CA3AF",
      accent: "#E8742C",
      accentMuted: "#FF9F5A",
    },
    broadcast: {
      name: "broadcast",
      background: "#000000",
      surface: "#111111",
      surfaceRaised: "#1A1A1A",
      border: "#333333",
      ink: "#FFFFFF",
      inkMuted: "#CCCCCC",
      accent: "#FF7A1A",
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
