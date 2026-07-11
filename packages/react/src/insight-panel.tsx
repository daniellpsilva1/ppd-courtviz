/**
 * InsightPanel — coach-facing takeaway block for social posters.
 */

import { memo } from "react";
import { type CourtvizTheme, ppd } from "@courtviz/themes";

export interface InsightPanelProps {
  text: string;
  theme?: CourtvizTheme;
  width?: number;
  x?: number;
  y?: number;
}

const PANEL_HEIGHT = 80;
const LINE_HEIGHT = 18;
const MAX_CHARS_PER_LINE = 72;

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

export const InsightPanel = memo(function InsightPanel({
  text,
  theme = ppd,
  width = 960,
  x = 0,
  y = 0,
}: InsightPanelProps) {
  const fonts = theme.fonts;
  const fs = theme.fontSize;
  const lines = wrapText(text, MAX_CHARS_PER_LINE);

  return (
    <g data-testid="insight-panel" transform={`translate(${x}, ${y})`}>
      <rect
        fill={theme.annotation.calloutFill}
        height={PANEL_HEIGHT}
        opacity={0.92}
        rx={8}
        stroke={theme.border}
        strokeWidth={1}
        width={width}
        x={0}
        y={0}
      />
      <rect fill={theme.playerHost} height={PANEL_HEIGHT} rx={8} width={4} x={0} y={0} />
      <text
        fill={theme.inkMuted}
        fontFamily={`${fonts.condensedFont}, ${fonts.condensedFontFallback}`}
        fontSize={fs.label}
        fontWeight={600}
        letterSpacing="0.12em"
        textAnchor="start"
        x={16}
        y={16}
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
          y={38 + index * LINE_HEIGHT}
        >
          {line}
        </text>
      ))}
    </g>
  );
});
