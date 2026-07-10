/**
 * <FigureFrame> — editorial SVG figure wrapper with multi-format layouts and branding.
 */

import { memo, type ReactNode } from "react";
import { resolveFrameLayout, type FrameLayout } from "@courtviz/core";
import { type SocialFormat } from "@ppd/tokens";
import { type CourtvizTheme, ppd } from "@courtviz/themes";
import { BrandMark } from "./brand-mark";

export interface FigureBranding {
  logo?: boolean;
  handle?: string;
  source?: string;
}

export interface FigureFrameProps {
  id?: string;
  title?: string;
  subtitle?: string;
  source?: string;
  accessibleSummary?: string;
  theme?: CourtvizTheme;
  width?: number;
  height?: number;
  padding?: number;
  format?: SocialFormat;
  background?: string;
  branding?: FigureBranding;
  children?: ReactNode;
}

function renderBrandingFooter(
  layout: FrameLayout,
  theme: CourtvizTheme,
  branding: FigureBranding,
  source?: string,
) {
  const footer = layout.footer;
  const handle = branding.handle ?? theme.brand?.handle ?? "@peakperformancedata";
  const sourceText = branding.source ?? source ?? theme.brand?.sourceLine;
  const ruleY = footer.y;

  return (
    <g data-testid="figure-branding-footer">
      <line
        stroke={theme.border}
        strokeWidth={1}
        x1={footer.x}
        x2={footer.x + footer.width}
        y1={ruleY}
        y2={ruleY}
      />
      {branding.logo !== false && (
        <g transform={`translate(${footer.x}, ${ruleY + 12})`}>
          <BrandMark height={28} theme={theme} variant="monogram" />
        </g>
      )}
      <text
        fill={theme.inkMuted}
        fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
        fontSize={theme.fontSize.label}
        textAnchor="end"
        x={footer.x + footer.width * 0.72}
        y={ruleY + 30}
      >
        {handle}
      </text>
      {sourceText && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
          fontSize={theme.fontSize.source}
          textAnchor="end"
          x={footer.x + footer.width}
          y={ruleY + 30}
        >
          {sourceText}
        </text>
      )}
    </g>
  );
}

export const FigureFrame = memo(function FigureFrame({
  accessibleSummary,
  background,
  branding,
  children,
  format = "square",
  height,
  id = "figure",
  padding,
  source,
  subtitle,
  theme = ppd,
  title,
  width,
}: FigureFrameProps) {
  const layout = resolveFrameLayout(format, { height, padding, width });
  const bg = background ?? theme.background;
  const fs = theme.fontSize;
  const fonts = theme.fonts;
  const hasBranding = Boolean(branding);
  const isLandscape = format === "landscape";
  const titleRegion = layout.title;
  const contentRegion = layout.content;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const titleX = titleRegion.x;
  const titleY = titleRegion.y + fs.figureTitle;
  const subtitleY = titleY + (title ? fs.figureSubtitle + 8 : 0);
  const contentTransform = isLandscape
    ? `translate(${contentRegion.x} ${contentRegion.y})`
    : `translate(0 ${contentRegion.y})`;

  return (
    <svg
      aria-describedby={accessibleSummary ? descId : undefined}
      aria-labelledby={title ? titleId : undefined}
      height={layout.height}
      role="img"
      style={{ display: "block" }}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
    >
      <title id={titleId}>{title ?? "Data visualization"}</title>
      {accessibleSummary && <desc id={descId}>{accessibleSummary}</desc>}

      <rect fill={bg} height={layout.height} width={layout.width} x={0} y={0} />

      {title && (
        <text
          fill={theme.ink}
          fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
          fontSize={fs.figureTitle}
          fontWeight={700}
          letterSpacing={0.5}
          textAnchor="start"
          x={titleX}
          y={titleY}
        >
          {title}
        </text>
      )}

      {subtitle && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.figureSubtitle}
          textAnchor="start"
          x={titleX}
          y={subtitleY}
        >
          {subtitle}
        </text>
      )}

      <g
        data-content-height={contentRegion.height}
        data-content-width={contentRegion.width}
        transform={contentTransform}
      >
        {children}
      </g>

      {source && !hasBranding && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.source}
          textAnchor="start"
          x={layout.padding}
          y={layout.height - layout.padding * 0.5}
        >
          {source}
        </text>
      )}

      {hasBranding && branding && renderBrandingFooter(layout, theme, branding, source)}
    </svg>
  );
});
