/**
 * Simple horizontal bar chart for zone win rates — SVG only.
 */

import { memo } from "react";
import type { CourtvizTheme } from "@courtviz/themes";

export interface ZoneBarDatum {
  zone: string;
  winRate: number;
  total: number;
  playerLabel: string;
  color: string;
}

export interface ZoneBarChartProps {
  data: ZoneBarDatum[];
  theme: CourtvizTheme;
  width?: number;
  height?: number;
  maxBars?: number;
}

export const ZoneBarChart = memo(function ZoneBarChart({
  data,
  height = 220,
  maxBars = 6,
  theme,
  width = 520,
}: ZoneBarChartProps) {
  const rows = data.slice(0, maxBars);
  const pad = { left: 120, right: 16, top: 12, bottom: 12 };
  const innerW = width - pad.left - pad.right;
  const rowH = (height - pad.top - pad.bottom) / Math.max(rows.length, 1);

  return (
    <svg height={height} role="img" viewBox={`0 0 ${width} ${height}`} width={width}>
      <title>Win rate by court zone</title>
      {rows.map((row, i) => {
        const y = pad.top + i * rowH + rowH * 0.15;
        const barH = rowH * 0.55;
        const barW = innerW * Math.max(0, Math.min(1, row.winRate));
        const label = row.zone.replace(/_/g, " ");
        return (
          <g key={`${row.playerLabel}-${row.zone}`}>
            <text
              fill={theme.inkMuted}
              fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
              fontSize={10}
              x={pad.left - 8}
              y={y + barH * 0.75}
              textAnchor="end"
            >
              {label}
            </text>
            <rect
              fill={theme.surfaceColors.hard ? `${row.color}22` : row.color}
              height={barH}
              rx={3}
              width={innerW}
              x={pad.left}
              y={y}
            />
            <rect fill={row.color} height={barH} rx={3} width={barW} x={pad.left} y={y} />
            <text
              fill={theme.ink}
              fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
              fontSize={10}
              fontWeight={600}
              x={pad.left + barW + 6}
              y={y + barH * 0.75}
            >
              {Math.round(row.winRate * 100)}% ({row.total})
            </text>
          </g>
        );
      })}
    </svg>
  );
});
