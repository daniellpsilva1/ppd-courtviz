'use client';

import { memo } from "react";
import type { CourtvizTheme } from "@courtviz/themes";
import { SvgTooltipProvider, useSvgTooltip } from "./svg-tooltip-context";

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
  const { hide, show } = useSvgTooltip();
  const rows = data.slice(0, maxBars);
  const pad = { bottom: 12, left: 120, right: 16, top: 12 };
  const innerW = width - pad.left - pad.right;
  const rowH = (height - pad.top - pad.bottom) / Math.max(rows.length, 1);

  return (
    <SvgTooltipProvider bounds={{ height, width }} theme={theme}>
      <svg height={height} onMouseLeave={hide} role="img" viewBox={`0 0 ${width} ${height}`} width={width}>
        <title>Win rate by court zone</title>
        {rows.map((row, i) => {
        const y = pad.top + i * rowH + rowH * 0.15;
        const barH = rowH * 0.55;
        const barW = innerW * Math.max(0, Math.min(1, row.winRate));
        const label = row.zone.replace(/_/g, " ");
        const tooltipLines = [
          `${row.playerLabel}: ${label}`,
          `${Math.round(row.winRate * 100)}% win rate`,
          `${row.total} shots`,
        ];

        return (
          <g
            key={`${row.playerLabel}-${row.zone}`}
            onMouseEnter={() => show(pad.left + barW, y + barH / 2, tooltipLines)}
            style={{ cursor: "pointer" }}
          >
            <text
              fill={theme.inkMuted}
              fontFamily={`${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`}
              fontSize={10}
              pointerEvents="none"
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
              textAnchor="end"
              x={width - pad.right}
              y={y + barH * 0.75}
            >
              {Math.round(row.winRate * 100)}% ({row.total})
            </text>
          </g>
        );
      })}
      </svg>
    </SvgTooltipProvider>
  );
});
