/**
 * BrandMark — PPD logo icon and wordmark lockup for export branding.
 */

import { memo } from "react";
import { logoColors, logoIconPaths, logoLockup } from "@ppd/tokens";
import { type CourtvizTheme, ppd } from "@courtviz/themes";

export interface BrandMarkProps {
  variant?: "monogram" | "lockup";
  height?: number;
  color?: string;
  accentColor?: string;
  theme?: CourtvizTheme;
}

function LogoIcon({
  accentColor,
  height,
}: {
  accentColor?: string;
  height: number;
}) {
  const mountain = accentColor ?? logoColors.mountain;
  const scale = height / 48;

  return (
    <g data-testid="brand-mark-icon" transform={`scale(${scale})`}>
      <circle
        cx={logoIconPaths.circle.cx}
        cy={logoIconPaths.circle.cy}
        fill={logoColors.circleFill}
        r={logoIconPaths.circle.r}
        stroke={logoColors.circleStroke}
        strokeWidth={0.75}
      />
      <path d={logoIconPaths.mountainShadow} fill={logoColors.mountainShadow} opacity={0.35} />
      <path d={logoIconPaths.mountain} fill={mountain} />
      <path d={logoIconPaths.mountainCap} fill={logoColors.mountainLight} />
      <polyline
        fill="none"
        points={logoIconPaths.waveformPoints}
        stroke={logoColors.waveform}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </g>
  );
}

export const BrandMark = memo(function BrandMark({
  accentColor,
  color,
  height = 28,
  theme = ppd,
  variant = "monogram",
}: BrandMarkProps) {
  const ink = color ?? theme.ink;

  if (variant === "monogram") {
    return (
      <g data-testid="brand-mark-monogram">
        <LogoIcon accentColor={accentColor} height={height} />
      </g>
    );
  }

  const iconSize = height;
  const scale = height / 28;

  return (
    <g data-testid="brand-mark-lockup" transform={`scale(${scale})`}>
      <LogoIcon accentColor={accentColor} height={iconSize} />
      <text
        fill={ink}
        fontFamily={`${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`}
        fontSize={11}
        fontWeight={700}
        letterSpacing={1.2}
        x={iconSize + 8}
        y={12}
      >
        {logoLockup.primary}
      </text>
      <text
        fill={theme.inkMuted}
        fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
        fontSize={8}
        letterSpacing={2}
        x={iconSize + 8}
        y={22}
      >
        {logoLockup.secondary}
      </text>
    </g>
  );
});

export function brandMarkWidth(variant: "monogram" | "lockup", height: number): number {
  return variant === "lockup" ? height * 5.2 : height;
}
