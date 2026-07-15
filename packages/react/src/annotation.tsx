/**
 * Editorial annotation primitives — callout circles, zone labels, insight callouts.
 *
 * Ported from DataViz/tennisviz/annotate.py for Opta/Athletic-style storytelling.
 */

import { memo, useMemo } from "react";
import { polygonCentroid } from "d3-polygon";
import { type CourtScales, type DensityContour } from "@courtviz/core";
import { type CourtvizTheme, ppd } from "@courtviz/themes";

export interface AnnotationProps {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  text: string;
  subtext?: string;
  theme?: CourtvizTheme;
  showCallout?: boolean;
  dotRadius?: number;
}

export const Annotation = memo(function Annotation({
  dotRadius = 3,
  labelX,
  labelY,
  showCallout = false,
  subtext,
  text,
  theme = ppd,
  x,
  y,
}: AnnotationProps) {
  const ann = theme.annotation;
  const fs = theme.fontSize;
  const fonts = theme.fonts;

  const textW = text.length * fs.label * 0.6 + 8;
  const textH = subtext ? fs.label * 3 : fs.label * 1.8;
  const calloutX = labelX < x ? labelX - textW : labelX;
  const calloutY = labelY - fs.label;

  return (
    <g>
      <line
        stroke={ann.leaderColor}
        strokeWidth={ann.leaderWidth}
        x1={x}
        x2={labelX}
        y1={y}
        y2={labelY}
      />
      <circle cx={x} cy={y} fill={ann.leaderColor} r={dotRadius} />
      {showCallout && (
        <rect
          fill={ann.calloutFill}
          height={textH}
          opacity={0.9}
          rx={3}
          width={textW}
          x={calloutX}
          y={calloutY}
        />
      )}
      <text
        dominantBaseline="middle"
        fill={ann.calloutTextColor}
        fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
        fontSize={fs.label}
        fontWeight={600}
        textAnchor={labelX < x ? "end" : "start"}
        x={labelX + (labelX < x ? -4 : 4)}
        y={subtext ? labelY - fs.label * 0.5 : labelY}
      >
        {text}
      </text>
      {subtext && (
        <text
          dominantBaseline="middle"
          fill={theme.inkMuted}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.label * 0.85}
          textAnchor={labelX < x ? "end" : "start"}
          x={labelX + (labelX < x ? -4 : 4)}
          y={labelY + fs.label * 0.7}
        >
          {subtext}
        </text>
      )}
    </g>
  );
});

export interface CalloutCircleProps {
  cx: number;
  cy: number;
  radius?: number;
  color?: string;
  strokeWidth?: number;
  theme?: CourtvizTheme;
}

/** SprawlBall-style highlight circle around a hot zone. */
export const CalloutCircle = memo(function CalloutCircle({
  color,
  cx,
  cy,
  radius = 24,
  strokeWidth = 2.5,
  theme = ppd,
}: CalloutCircleProps) {
  const stroke = color ?? theme.playerHost;
  return (
    <circle
      cx={cx}
      cy={cy}
      fill="none"
      opacity={0.85}
      r={radius}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
});

export interface ZonePercentageProps {
  x: number;
  y: number;
  percentage: number;
  theme?: CourtvizTheme;
  fontSize?: number;
}

/** Percentage badge placed directly on the court. */
export const ZonePercentage = memo(function ZonePercentage({
  fontSize,
  percentage,
  theme = ppd,
  x,
  y,
}: ZonePercentageProps) {
  const fs = fontSize ?? theme.fontSize.label;
  const fonts = theme.fonts;
  const label = `${Math.round(percentage)}%`;
  const padX = label.length * fs * 0.35 + 6;
  const padY = fs * 0.9;

  return (
    <g>
      <rect
        fill={theme.ink}
        height={padY}
        opacity={0.75}
        rx={4}
        width={padX}
        x={x - padX / 2}
        y={y - padY / 2}
      />
      <text
        dominantBaseline="middle"
        fill={theme.background}
        fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
        fontSize={fs}
        fontWeight={700}
        textAnchor="middle"
        x={x}
        y={y}
      >
        {label}
      </text>
    </g>
  );
});

export interface InsightLabelProps {
  x: number;
  y: number;
  text: string;
  anchorX: number;
  anchorY: number;
  theme?: CourtvizTheme;
  color?: string;
}

/** ALL-CAPS editorial insight with leader line to a court point. */
export const InsightLabel = memo(function InsightLabel({
  anchorX,
  anchorY,
  color,
  text,
  theme = ppd,
  x,
  y,
}: InsightLabelProps) {
  const fs = theme.fontSize.label;
  const fonts = theme.fonts;
  const ink = color ?? theme.ink;

  return (
    <g>
      <line
        opacity={0.6}
        stroke={ink}
        strokeWidth={1}
        x1={anchorX}
        x2={x}
        y1={anchorY}
        y2={y}
      />
      <circle cx={anchorX} cy={anchorY} fill={theme.playerHost} r={3} />
      <text
        dominantBaseline="middle"
        fill={ink}
        fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
        fontSize={fs}
        fontWeight={700}
        letterSpacing={0.5}
        textAnchor="start"
        x={x}
        y={y}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
});

export interface ArrowAnnotationProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  strokeWidth?: number;
  theme?: CourtvizTheme;
}

/** Directional arrow between two court points. */
export const ArrowAnnotation = memo(function ArrowAnnotation({
  color,
  strokeWidth = 2,
  theme = ppd,
  x1,
  x2,
  y1,
  y2,
}: ArrowAnnotationProps) {
  const stroke = color ?? theme.playerHost;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = 8;
  const headW = 4;
  const tipX = x2;
  const tipY = y2;
  const baseX = tipX - ux * headLen;
  const baseY = tipY - uy * headLen;
  const perpX = -uy * headW;
  const perpY = ux * headW;

  return (
    <g>
      <line
        stroke={stroke}
        strokeWidth={strokeWidth}
        x1={x1}
        x2={baseX}
        y1={y1}
        y2={baseY}
      />
      <polygon
        fill={stroke}
        points={`${tipX},${tipY} ${baseX + perpX},${baseY + perpY} ${baseX - perpX},${baseY - perpY}`}
      />
    </g>
  );
});

export interface CentroidAnnotationProps {
  contour: DensityContour;
  scales: CourtScales;
  text: string;
  subtext?: string;
  theme?: CourtvizTheme;
  color?: string;
  /** Offset from centroid in SVG pixels (default: { x: 40, y: -20 }) */
  offset?: { x: number; y: number };
}

/** Smart annotation placed at the centroid of a density contour polygon. */
export const CentroidAnnotation = memo(function CentroidAnnotation({
  contour,
  offset = { x: 40, y: -20 },
  scales,
  subtext,
  text,
  theme = ppd,
}: CentroidAnnotationProps) {
  const { labelX, labelY, anchorX, anchorY } = useMemo(() => {
    const largestRing = contour.coordinates
      .flatMap((poly) => poly)
      .reduce((longest, ring) => (ring.length > longest.length ? ring : longest), [] as number[][]);

    if (largestRing.length < 3) {
      const first = largestRing[0] ?? [0, 0];
      const ax = scales.x(first[0]!);
      const ay = scales.y(first[1]!);
      return { anchorX: ax, anchorY: ay, labelX: ax + offset.x, labelY: ay + offset.y };
    }

    const cx = polygonCentroid(largestRing as Array<[number, number]>);
    const ax = scales.x(cx[0] ?? 0);
    const ay = scales.y(cx[1] ?? 0);
    return { anchorX: ax, anchorY: ay, labelX: ax + offset.x, labelY: ay + offset.y };
  }, [contour, scales, offset]);

  return (
    <Annotation
      dotRadius={4}
      labelX={labelX}
      labelY={labelY}
      showCallout
      subtext={subtext}
      text={text}
      theme={theme}
      x={anchorX}
      y={anchorY}
    />
  );
});
