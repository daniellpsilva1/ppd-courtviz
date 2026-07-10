import { colorPrimitives, semanticColors } from "@ppd/tokens";
import { ppdDark } from "@courtviz/themes";

/** Design tokens from @ppd/tokens — single source of truth */
export const PPD = {
  bg: semanticColors.dark.background,
  surface: semanticColors.dark.surface,
  border: semanticColors.dark.border,
  text: semanticColors.dark.ink,
  textMuted: semanticColors.dark.inkMuted,
  accent: colorPrimitives.accent,
  primary: colorPrimitives.primaryBright,
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
} as const;

export const theme = ppdDark;
