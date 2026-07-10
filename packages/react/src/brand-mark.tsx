/**
 * BrandMark — pure SVG typographic lockup for PPD brand identity.
 */

import { memo } from "react";
import { type CourtvizTheme, ppd } from "@courtviz/themes";

export interface BrandMarkProps {
  variant?: "monogram" | "lockup";
  height?: number;
  color?: string;
  accentColor?: string;
  theme?: CourtvizTheme;
}

export const BrandMark = memo(function BrandMark({
  accentColor,
  color,
  height = 28,
  theme = ppd,
  variant = "monogram",
}: BrandMarkProps) {
  const ink = color ?? theme.ink;
  const accent = accentColor ?? theme.playerHost;
  const monoSize = height;

  if (variant === "monogram") {
    const r = monoSize * 0.18;
    return (
      <g data-testid="brand-mark-monogram">
        <rect fill={accent} height={monoSize} rx={r} width={monoSize} x={0} y={0} />
        <text
          dominantBaseline="central"
          fill={theme.background}
          fontFamily={`${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`}
          fontSize={monoSize * 0.42}
          fontWeight={700}
          textAnchor="middle"
          x={monoSize / 2}
          y={monoSize / 2 + 1}
        >
          PPD
        </text>
      </g>
    );
  }

  return (
    <g data-testid="brand-mark-lockup" transform={`scale(${height / 28})`}>
      <rect fill={accent} height={28} rx={5} width={28} x={0} y={0} />
      <text
        dominantBaseline="central"
        fill={theme.background}
        fontFamily={`${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`}
        fontSize={12}
        fontWeight={700}
        textAnchor="middle"
        x={14}
        y={15}
      >
        PPD
      </text>
      <text
        fill={ink}
        fontFamily={`${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`}
        fontSize={11}
        fontWeight={600}
        letterSpacing={1.2}
        x={36}
        y={12}
      >
        PEAK PERFORMANCE
      </text>
      <text
        fill={theme.inkMuted}
        fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
        fontSize={8}
        letterSpacing={2}
        x={36}
        y={22}
      >
        DATA
      </text>
    </g>
  );
});

export function brandMarkWidth(variant: "monogram" | "lockup", height: number): number {
  return variant === "lockup" ? height * 5.2 : height;
}
