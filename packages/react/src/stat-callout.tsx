/**
 * StatCallout — margin stat highlight for editorial storytelling.
 * Athletic/Opta-style large number + descriptor.
 */

import { memo } from "react";
import { type CourtvizTheme, ppd } from "@courtviz/themes";

export interface StatCalloutProps {
  x: number;
  y: number;
  value: string;
  label: string;
  theme?: CourtvizTheme;
  accentColor?: string;
}

export const StatCallout = memo(function StatCallout({
  accentColor,
  label,
  theme = ppd,
  value,
  x,
  y,
}: StatCalloutProps) {
  const fonts = theme.fonts;
  const accent = accentColor ?? theme.playerHost;

  return (
    <g data-testid="stat-callout" transform={`translate(${x}, ${y})`}>
      <text
        fill={accent}
        fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
        fontSize={28}
        fontWeight={700}
        letterSpacing={0.5}
        textAnchor="start"
        x={0}
        y={0}
      >
        {value}
      </text>
      <text
        fill={theme.inkMuted}
        fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
        fontSize={12}
        fontWeight={500}
        letterSpacing={1}
        textAnchor="start"
        x={0}
        y={20}
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
});
