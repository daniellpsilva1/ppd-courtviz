/**
 * FigureDocument — editorial single-root SVG wrapper.
 * Prefer FigureFrame for multi-format branded exports; use FigureDocument for
 * fixed-size editorial cards with warm-paper styling.
 */

import { toCourtvizTheme } from "@ppd/brand";
import { memo, type ReactNode } from "react";
import { type CourtvizTheme } from "@courtviz/themes";

export interface FigureDocumentProps {
  id?: string;
  title?: string;
  subtitle?: string;
  source?: string;
  accessibleSummary?: string;
  theme?: CourtvizTheme;
  width?: number;
  height?: number;
  padding?: number;
  background?: string;
  children?: ReactNode;
}

export const FigureDocument = memo(function FigureDocument({
  accessibleSummary,
  background,
  children,
  height = 1080,
  id = "figure",
  padding = 40,
  source,
  subtitle,
  theme = toCourtvizTheme("editorial"),
  title,
  width = 1080,
}: FigureDocumentProps) {
  const bg = background ?? theme.background;
  const fs = theme.fontSize;
  const fonts = theme.fonts;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const titleH = title ? fs.figureTitle * 1.2 : 0;
  const subtitleH = subtitle ? fs.figureSubtitle * 1.5 : 0;
  const headerH = titleH + subtitleH + (title || subtitle ? padding * 0.5 : 0);
  const contentY = padding + headerH;

  return (
    <svg
      aria-describedby={accessibleSummary ? descId : undefined}
      aria-labelledby={title ? titleId : undefined}
      height={height}
      role="img"
      style={{ display: "block" }}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <title id={titleId}>{title ?? "Data visualization"}</title>
      {accessibleSummary && <desc id={descId}>{accessibleSummary}</desc>}

      <rect fill={bg} height={height} width={width} x={0} y={0} />

      {title && (
        <text
          fill={theme.ink}
          fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
          fontSize={fs.figureTitle}
          fontWeight={700}
          letterSpacing={0.5}
          x={padding}
          y={padding + fs.figureTitle}
        >
          {title}
        </text>
      )}

      {subtitle && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.figureSubtitle}
          x={padding}
          y={padding + titleH + fs.figureSubtitle + 4}
        >
          {subtitle}
        </text>
      )}

      <g transform={`translate(0 ${contentY})`}>{children}</g>

      {source && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.source}
          x={padding}
          y={height - padding * 0.5}
        >
          {source}
        </text>
      )}
    </svg>
  );
});
