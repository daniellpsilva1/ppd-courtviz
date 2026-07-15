import {
  chartPalette,
  chartPaletteLight,
  colorPrimitives,
  semanticColors,
  sportColors,
  type Surface,
} from "./colors";
import { layout } from "./layout";
import { brandDefaults, socialFormats, type SocialFormat } from "./social";
import { typography } from "./typography";

export * from "./colors";
export * from "./typography";
export * from "./layout";
export * from "./social";
export * from "./logo";
export * from "./motion";

export interface PpdTokens {
  primitives: typeof colorPrimitives;
  semantic: typeof semanticColors;
  sport: typeof sportColors;
  chart: {
    dark: typeof chartPalette;
    light: typeof chartPaletteLight;
  };
  typography: typeof typography;
  layout: typeof layout;
  social: typeof socialFormats;
  brand: typeof brandDefaults;
}

export const tokens: PpdTokens = {
  primitives: colorPrimitives,
  semantic: semanticColors,
  sport: sportColors,
  chart: {
    dark: chartPalette,
    light: chartPaletteLight,
  },
  typography,
  layout,
  social: socialFormats,
  brand: brandDefaults,
};

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized;
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r!, g!, b!);
  const min = Math.min(r!, g!, b!);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g! - b!) / d + (g! < b! ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b! - r!) / d + 2) / 6;
        break;
      default:
        h = ((r! - g!) / d + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function getSocialPreset(format: SocialFormat) {
  return socialFormats[format];
}

export const surfaces: Surface[] = ["clay", "hard", "grass"];
