import { colorPrimitives, layout, semanticColors } from "@ppd/tokens";
import { ppdDark } from "@courtviz/themes";

/** Design tokens from @ppd/tokens — single source of truth */
export const PPD = {
  accent: colorPrimitives.accent,
  bg: semanticColors.dark.background,
  border: semanticColors.dark.border,
  primary: colorPrimitives.primaryBright,
  radius: layout.radii,
  surface: semanticColors.dark.surface,
  text: semanticColors.dark.ink,
  textMuted: semanticColors.dark.inkMuted,
} as const;

export const theme = ppdDark;
