/**
 * Canonical PPD brand tokens — framework-neutral source of truth.
 *
 * Editorial (warm paper) and product (dark) modes share semantic data colors.
 */

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
    positive: "#2F855A",
    negative: "#C53030",
    neutral: "#718096",
    confidence: "#2B6CB0",
    missing: "#A0AEC0",
    playerHost: "#E8742C",
    playerGuest: "#2B6CB0",
    courtClay: "#C97B4E",
    courtHard: "#2E5A88",
    courtGrass: "#6B9E5A",
  },
  typography: {
    displayFamily: "Oswald",
    bodyFamily: "Inter",
    displayFallback: "Arial Narrow, sans-serif",
    bodyFallback: "Helvetica Neue, Arial, sans-serif",
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
