/**
 * InsightPanel — coach-facing takeaway block for social posters.
 */

import { memo, useMemo } from "react";
import { fitSvgText } from "@courtviz/core";
import { type CourtvizTheme, ppd } from "@courtviz/themes";

export interface InsightPanelProps {
  accent?: string;
  text: string;
  theme?: CourtvizTheme;
  width?: number;
  x?: number;
  y?: number;
}

const LINE_HEIGHT = 18;
const PAD_X = 16;
const PAD_Y = 14;
const LABEL_GAP = 16;

export const InsightPanel = memo(function InsightPanel({
  accent,
  text,
  theme = ppd,
  width = 960,
  x = 0,
  y = 0,
}: InsightPanelProps) {
  const fonts = theme.fonts;
  const fs = theme.fontSize;
  const { lines } = useMemo(() => fitSvgText(text, {
    fontFamily: fonts.bodyFont,
    fontSize: fs.body,
    maxLines: 2,
    maxWidth: width - PAD_X * 2,
    mode: "wrap",
  }), [text, fonts.bodyFont, fs.body, width]);

  const labelH = fs.label + LABEL_GAP;
  const panelHeight = Math.max(48, PAD_Y + labelH + lines.length * LINE_HEIGHT + PAD_Y);

  return (
    <g data-testid="insight-panel" transform={`translate(${x}, ${y})`}>
      <rect
        fill={theme.annotation.calloutFill}
        height={panelHeight}
        opacity={0.92}
        rx={8}
        stroke={theme.border}
        strokeWidth={1}
        width={width}
        x={0}
        y={0}
      />
      <rect fill={accent ?? theme.playerHost} height={panelHeight} rx={8} width={4} x={0} y={0} />
      <text
        fill={theme.inkMuted}
        fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
        fontSize={fs.label}
        fontWeight={600}
        letterSpacing="0.12em"
        textAnchor="start"
        x={16}
        y={PAD_Y + fs.label}
      >
        COACH TAKEAWAY
      </text>
      {lines.map((line, index) => (
        <text
          fill={theme.ink}
          fontFamily={`${fonts.bodyFont}, ${fonts.bodyFontFallback}`}
          fontSize={fs.body}
          key={index}
          textAnchor="start"
          x={16}
          y={PAD_Y + labelH + index * LINE_HEIGHT}
        >
          {line}
        </text>
      ))}
    </g>
  );
});

export function insightPanelHeight(text: string, theme: CourtvizTheme = ppd, width = 960): number {
  const { lines } = fitSvgText(text, {
    fontFamily: theme.fonts.bodyFont,
    fontSize: theme.fontSize.body,
    maxLines: 2,
    maxWidth: width - PAD_X * 2,
    mode: "wrap",
  });
  const labelH = theme.fontSize.label + LABEL_GAP;
  return Math.max(48, PAD_Y + labelH + lines.length * LINE_HEIGHT + PAD_Y);
}
