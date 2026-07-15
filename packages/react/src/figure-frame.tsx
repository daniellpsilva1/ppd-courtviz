/**
 * <FigureFrame> — editorial SVG figure wrapper with multi-format layouts and branding.
 */

import { memo, type ReactNode } from "react";
import { resolveFrameLayout, type FrameLayout } from "@courtviz/core";
import { type SocialFormat, signatureDevices } from "@ppd/tokens";
import { type CourtvizTheme, ppd } from "@courtviz/themes";
import { BrandMark } from "./brand-mark";

export interface FigureBranding {
  logo?: boolean;
  /** PNG/SVG data URI or URL for the real brand logo */
  logoHref?: string;
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
  /** Show baseline rule motif under the title */
  showBaselineRule?: boolean;
  /** Show corner-notch frame device */
  showCornerNotch?: boolean;
  children?: ReactNode;
}

function renderBrandingFooter(
  layout: FrameLayout,
  theme: CourtvizTheme,
  branding: FigureBranding,
  source?: string,
) {
  const footer = layout.footer;
  const handle = branding.handle ?? theme.brand?.handle ?? "@yourhandle";
  const sourceText = branding.source ?? source ?? theme.brand?.sourceLine;
  const ruleY = footer.y;

  const handleX = footer.x + footer.width;
  const sourceX = footer.x + footer.width;

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
        branding.logoHref ? (
          <image
            height={32}
            href={branding.logoHref}
            preserveAspectRatio="xMidYMid meet"
            width={32}
            x={footer.x}
            y={ruleY + 8}
          />
        ) : (
          <g transform={`translate(${footer.x}, ${ruleY + 10})`}>
            <BrandMark height={28} theme={theme} variant="monogram" />
          </g>
        )
      )}
      <text
        fill={theme.inkMuted}
        fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
        fontSize={theme.fontSize.label}
        textAnchor="end"
        x={handleX}
        y={ruleY + 24}
      >
        {handle}
      </text>
      {sourceText && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
          fontSize={theme.fontSize.source}
          textAnchor="end"
          x={sourceX}
          y={ruleY + 42}
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
  showBaselineRule = true,
  showCornerNotch = false,
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
  const titleRegion = layout.title;
  const contentRegion = layout.content;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const titleX = titleRegion.x;
  const titleY = titleRegion.y + fs.figureTitle;
  const subtitleY = titleY + (title ? fs.figureSubtitle + 8 : 0);
  const contentTransform = `translate(${contentRegion.x} ${contentRegion.y})`;

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

      {/* Baseline rule motif — thick court-line-inspired underline */}
      {showBaselineRule && title && (
        <BaselineRule
          accentColor={theme.playerHost ?? theme.ink}
          theme={theme}
          width={layout.width}
          x={titleX}
          y={subtitleY + 8}
        />
      )}

      {/* Corner-notch frame device */}
      {showCornerNotch && (
        <CornerNotch
          color={theme.border}
          height={layout.height}
          width={layout.width}
        />
      )}

      <defs>
        <clipPath id={`${id}-content-clip`}>
          <rect height={contentRegion.height} width={contentRegion.width} x={0} y={0} />
        </clipPath>
      </defs>

      <g
        clipPath={`url(#${id}-content-clip)`}
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

// ---------------------------------------------------------------------------
// Signature graphic devices
// ---------------------------------------------------------------------------

function BaselineRule({
  accentColor,
  theme,
  width: frameWidth,
  x,
  y,
}: {
  accentColor: string;
  theme: CourtvizTheme;
  width: number;
  x: number;
  y: number;
}) {
  const { height, accentWidth } = signatureDevices.baselineRule;
  const accentW = frameWidth * accentWidth;

  return (
    <g>
      <rect fill={theme.border} height={height} width={frameWidth - x} x={x} y={y} />
      <rect fill={accentColor} height={height} width={accentW} x={x} y={y} />
    </g>
  );
}

function CornerNotch({
  color,
  height: frameHeight,
  width: frameWidth,
}: {
  color: string;
  height: number;
  width: number;
}) {
  const { inset, size, strokeWidth } = signatureDevices.cornerNotch;

  const corners = [
    [inset, inset, 1, 1],
    [frameWidth - inset, inset, -1, 1],
    [inset, frameHeight - inset, 1, -1],
    [frameWidth - inset, frameHeight - inset, -1, -1],
  ] as const;

  return (
    <g fill="none" stroke={color} strokeWidth={strokeWidth}>
      {corners.map(([cx, cy, dx, dy], i) => (
        <path
          d={`M ${cx + dx * size} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * size}`}
          key={`notch-${i}`}
        />
      ))}
    </g>
  );
}
