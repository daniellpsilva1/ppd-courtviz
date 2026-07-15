/**
 * Court surface as an SVG <g> — for composition inside FigureDocument without nested <svg>.
 */

import { memo, useId, useMemo, type ReactNode } from "react";
import {
  NET_Y,
  SERVICE_LINE_FAR,
  SERVICE_LINE_NEAR,
  SINGLES_HALF,
  type CourtHalf,
  type CourtScales,
  type Orientation,
  type Surface,
  courtFillRect,
  courtLines,
  createCourtScales,
} from "@courtviz/core";
import {
  type CourtvizTheme,
  getSurfaceColor,
  getSurfaceColorLight,
  getSurroundColor,
  ppd,
} from "@courtviz/themes";
import { CourtScalesProvider } from "./court-scales-context";
import { SvgTooltipProvider } from "./svg-tooltip-context";

export interface CourtSurfaceProps {
  idPrefix?: string;
  half?: CourtHalf;
  displayRange?: "full" | "near" | "serviceBoxes";
  surface?: Surface;
  orientation?: Orientation;
  width?: number;
  height?: number;
  theme?: CourtvizTheme;
  margin?: number;
  showServiceBox?: boolean;
  lineWidth?: number;
  /** Offset within parent SVG coordinate space */
  offsetX?: number;
  offsetY?: number;
  children?: ReactNode;
}

function ServiceBoxFill({
  half,
  scales,
  surfaceColorLight,
}: {
  half: CourtHalf;
  scales: CourtScales;
  surfaceColorLight: string;
}) {
  const boxes: Array<[number, number, number, number]> = [];

  if (half === "full" || half === "far") {
    boxes.push([-SINGLES_HALF, SERVICE_LINE_NEAR, SINGLES_HALF * 2, NET_Y - SERVICE_LINE_NEAR]);
    boxes.push([-SINGLES_HALF, NET_Y, SINGLES_HALF * 2, SERVICE_LINE_FAR - NET_Y]);
  }

  if (half === "near") {
    boxes.push([-SINGLES_HALF, SERVICE_LINE_NEAR, SINGLES_HALF * 2, NET_Y - SERVICE_LINE_NEAR]);
  }

  return (
    <g>
      {boxes.map((box, i) => (
        <rect
          fill={surfaceColorLight}
          height={Math.abs(scales.y(box[1]) - scales.y(box[1] + box[3]))}
          key={i}
          width={scales.x(box[0] + box[2]) - scales.x(box[0])}
          x={scales.x(box[0])}
          y={scales.y(box[1] + box[3])}
        />
      ))}
    </g>
  );
}

export const CourtSurface = memo(function CourtSurface({
  children,
  displayRange,
  half: halfProp = "full",
  height = 1080,
  idPrefix = "court",
  lineWidth = 2,
  margin = 1.5,
  offsetX = 0,
  offsetY = 0,
  orientation = "portrait",
  showServiceBox = true,
  surface = "hard",
  theme = ppd,
  width = 1080,
}: CourtSurfaceProps) {
  const half =
    displayRange === "full"
      ? "full"
      : displayRange === "near" || displayRange === "serviceBoxes"
        ? "near"
        : halfProp;

  const [svgWidth, svgHeight] =
    orientation === "landscape" ? [height, width] : [width, height];

  const scales = useMemo(
    () => createCourtScales({ width: svgWidth, height: svgHeight, half, margin }),
    [svgWidth, svgHeight, half, margin],
  );

  const lines = useMemo(() => courtLines(half), [half]);
  const fillRect = useMemo(() => courtFillRect(half), [half]);

  const surfaceColor = getSurfaceColor(surface, theme);
  const surfaceColorLight = getSurfaceColorLight(surface, theme);
  const surroundColor = getSurroundColor(surface, theme);
  const lineColor = theme.courtLine;

  const reactId = useId().replace(/:/g, "");
  const clipId = `${idPrefix}-${reactId}-clip`;
  const shadowId = `${idPrefix}-${reactId}-shadow`;

  const courtX = scales.x(fillRect[0]);
  const courtY = scales.y(fillRect[1] + fillRect[3]);
  const courtW = scales.x(fillRect[0] + fillRect[2]) - courtX;
  const courtH = scales.y(fillRect[1]) - courtY;

  const baselineIndices = new Set<number>();
  const netIndices = new Set<number>();
  lines.forEach((line, i) => {
    const [, y1, , y2] = line;
    if ((y1 === 0 && y2 === 0) || (y1 === 23.77 && y2 === 23.77)) baselineIndices.add(i);
    if (y1 === 11.885 && y2 === 11.885) netIndices.add(i);
  });

  const transform =
    orientation === "landscape"
      ? `translate(${offsetX} ${offsetY}) rotate(90 ${svgWidth / 2} ${svgHeight / 2})`
      : `translate(${offsetX} ${offsetY})`;

  return (
    <CourtScalesProvider scales={scales}>
      <defs>
        <clipPath id={clipId}>
          <rect height={courtH} width={courtW} x={courtX} y={courtY} />
        </clipPath>
        <filter id={shadowId} height="110%" width="110%" x="-5%" y="-5%">
          <feDropShadow dx={0} dy={2} floodColor="#000000" floodOpacity={0.12} stdDeviation={3} />
        </filter>
      </defs>
      <g transform={transform}>
        {/* Tooltip provider lives inside the offset transform so hover
            coordinates (court-local) line up with the rendered tooltip. */}
        <SvgTooltipProvider bounds={{ height: svgHeight, width: svgWidth }} theme={theme}>
        <rect
          fill={surroundColor}
          height={courtH + margin * scales.meterWidth * 2}
          width={courtW + margin * scales.meterWidth * 2}
          x={courtX - margin * scales.meterWidth}
          y={courtY - margin * scales.meterWidth}
        />
        <rect
          fill={surfaceColor}
          filter={`url(#${shadowId})`}
          height={courtH}
          width={courtW}
          x={courtX}
          y={courtY}
        />
        {showServiceBox && (
          <ServiceBoxFill half={half} scales={scales} surfaceColorLight={surfaceColorLight} />
        )}
        <g fill="none" stroke={lineColor} strokeWidth={lineWidth}>
          {lines.map((line, i) => {
            if (baselineIndices.has(i) || netIndices.has(i)) return null;
            return (
              <line
                key={`r-${i}`}
                x1={scales.x(line[0])}
                x2={scales.x(line[2])}
                y1={scales.y(line[1])}
                y2={scales.y(line[3])}
              />
            );
          })}
        </g>
        <g fill="none" stroke={lineColor} strokeWidth={lineWidth * 1.5}>
          {lines.map((line, i) => {
            if (!baselineIndices.has(i)) return null;
            return (
              <line
                key={`b-${i}`}
                x1={scales.x(line[0])}
                x2={scales.x(line[2])}
                y1={scales.y(line[1])}
                y2={scales.y(line[3])}
              />
            );
          })}
        </g>
        <g
          fill="none"
          stroke={lineColor}
          strokeDasharray={`${lineWidth * 3} ${lineWidth * 2}`}
          strokeWidth={lineWidth * 1.25}
        >
          {lines.map((line, i) => {
            if (!netIndices.has(i)) return null;
            return (
              <line
                key={`n-${i}`}
                x1={scales.x(line[0])}
                x2={scales.x(line[2])}
                y1={scales.y(line[1])}
                y2={scales.y(line[3])}
              />
            );
          })}
        </g>
        <g clipPath={`url(#${clipId})`}>{children}</g>
        </SvgTooltipProvider>
      </g>
    </CourtScalesProvider>
  );
});
