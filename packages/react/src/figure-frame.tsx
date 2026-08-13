/**
 * <FigureFrame> — editorial SVG figure wrapper with multi-format layouts and branding.
 */

import { memo, useMemo, type ReactNode } from "react";
import { measureSvgText, resolveFrameLayout, type FrameLayout } from "@courtviz/core";
import { type SocialFormat, signatureDevices } from "@ppd/tokens";
import { type CourtvizTheme, ppd } from "@courtviz/themes";
import { BrandMark, brandMarkWidth } from "./brand-mark";

const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

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
  /** Show full branding footer (logo + handle + source). Default: true when branding is provided */
  showBrandingFooter?: boolean;
  /** Show slide index pagination indicator (default: true when slideIndex + slideCount are provided) */
  showSlideIndex?: boolean;
  /** Slide index for pagination indicator (0-based) */
  slideIndex?: number;
  /** Total slide count for pagination indicator */
  slideCount?: number;
  /**
   * Override measured title band height for layout (keeps helpers + frame in sync).
   * Pass 0 for untitled slides. When omitted, height is measured from title/subtitle.
   */
  layoutTitleHeight?: number;
  /** Override measured footer band height for layout. */
  layoutFooterHeight?: number;
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
            height={44}
            href={branding.logoHref}
            preserveAspectRatio="xMidYMid meet"
            width={44}
            x={footer.x}
            y={ruleY + 6}
          />
        ) : (
          <g transform={`translate(${footer.x}, ${ruleY + 6})`}>
            <BrandMark height={44} theme={theme} variant="monogram" />
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
  layoutFooterHeight,
  layoutTitleHeight,
  padding,
  showBaselineRule = true,
  showBrandingFooter = true,
  showCornerNotch = false,
  showSlideIndex = true,
  slideCount,
  slideIndex,
  source,
  subtitle,
  theme = ppd,
  title,
  width,
}: FigureFrameProps) {
  const fs = theme.fontSize;
  const fonts = theme.fonts;
  const hasBranding = Boolean(branding);

  const safeAreaWidth = useMemo(() => {
    const preset = resolveFrameLayout(format, { height, padding, width });
    return preset.safeArea.width;
  }, [format, height, padding, width]);

  const measured = useMemo(() => {
    const titleBlockH = title
      ? Math.ceil(measureSvgText(title, {
          fontFamily: fonts.condensedFont,
          fontSize: fs.figureTitle,
          fontWeight: 700,
        }) / safeAreaWidth) * (fs.figureTitle * 1.25)
      : 0;
    const subtitleBlockH = subtitle
      ? Math.ceil(measureSvgText(subtitle, {
          fontFamily: fonts.bodyFont,
          fontSize: fs.figureSubtitle,
        }) / safeAreaWidth) * (fs.figureSubtitle * 1.3)
      : 0;
    // BaselineRule paints ~14px stroke + accent offset; reserve 22 so the
    // rule stays inside the title band and does not collide with content.
    const baselineH = title && showBaselineRule ? 22 : 0;
    const footerH = hasBranding && showBrandingFooter ? 64 : 0;
    return { baselineH, footerH, subtitleBlockH, titleBlockH };
  }, [title, subtitle, fonts, fs, showBaselineRule, hasBranding, showBrandingFooter, safeAreaWidth]);

  const measuredHeights = {
    footerH: measured.footerH,
    titleH: measured.titleBlockH + measured.subtitleBlockH + measured.baselineH,
  };

  const layout = resolveFrameLayout(format, {
    height,
    padding,
    width,
    // Pass 0 explicitly when untitled — `0 || undefined` previously fell back to
    // DEFAULT_TITLE_HEIGHT (100) and left a phantom empty band on cover/CTA.
    // Callers may override via layoutTitleHeight/layoutFooterHeight to keep
    // helpers and frame on the same content box.
    titleHeight: layoutTitleHeight ?? measuredHeights.titleH,
    footerHeight: layoutFooterHeight ?? measuredHeights.footerH,
  });
  const bg = background ?? theme.background;
  const titleRegion = layout.title;
  const contentRegion = layout.content;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  if (isDev && contentRegion.height < 200) {
    console.warn(`[FigureFrame] Content region height is only ${contentRegion.height}px for format "${format}" — content may overflow.`);
  }

  const titleX = titleRegion.x;
  const titleY = titleRegion.y + fs.figureTitle;
  const subtitleY = title ? titleRegion.y + measured.titleBlockH + fs.figureSubtitle : titleY;
  const rawBaselineRuleY = subtitle
    ? subtitleY + measured.subtitleBlockH - fs.figureSubtitle * 0.3 + 8
    : titleY + measured.titleBlockH - fs.figureTitle * 0.25 + 8;
  // Keep the rule inside the title region so it never paints into content.
  const baselineRuleY = Math.min(rawBaselineRuleY, contentRegion.y - 4);
  const contentTransform = `translate(${contentRegion.x} ${contentRegion.y})`;

  // Bottom chrome must sit inside safeArea — layout.padding is only a side gutter
  // (~40), while portrait/story reserve 120–140px for IG feed / story UI.
  const safeBottomY = layout.safeArea.y + layout.safeArea.height;
  const chromeBaselineY = safeBottomY - fs.source * 0.25;
  const showFooter = hasBranding && Boolean(branding) && showBrandingFooter;
  const slideIndexInFooter = showFooter && slideIndex != null && slideCount != null;

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
          y={baselineRuleY}
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
          x={layout.safeArea.x}
          y={chromeBaselineY}
        >
          {source}
        </text>
      )}

      {showFooter && branding && renderBrandingFooter(layout, theme, branding, source)}

      {hasBranding && branding && !showBrandingFooter && branding.source && (
        <text
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.source}
          textAnchor="start"
          x={layout.safeArea.x}
          y={chromeBaselineY}
        >
          {branding.source}
        </text>
      )}

      {slideIndex != null && slideCount != null && showSlideIndex !== false && (
        <text
          data-testid="figure-slide-index"
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.source}
          textAnchor={slideIndexInFooter ? "start" : "end"}
          x={
            slideIndexInFooter
              ? layout.footer.x + brandMarkWidth("monogram", 44) + 12
              : layout.safeArea.x + layout.safeArea.width
          }
          y={slideIndexInFooter ? layout.footer.y + 48 : chromeBaselineY}
        >
          {`${slideIndex + 1} / ${slideCount}`}
        </text>
      )}
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
