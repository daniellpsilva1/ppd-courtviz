'use client';

import { memo, useMemo } from "react";
import { interpolateRgb } from "d3-interpolate";
import {
  type CourtHalf,
  type CourtScales,
  type EnrichedShot,
  computeHexbins,
  shotPlayerWonPoint,
} from "@courtviz/core";
import {
  type CourtvizTheme,
  efficiencyColorStops,
  getPlayerColor,
} from "@courtviz/themes";
import { SvgTooltip, useSvgTooltip } from "./svg-tooltip";

export type HexbinColorScale = "efficiency" | "speed" | "count";

export interface HexbinLayerProps {
  shots: EnrichedShot[];
  player?: string;
  half?: CourtHalf;
  scales: CourtScales;
  theme: CourtvizTheme;
  gridsize?: number;
  minCount?: number;
  colorScale?: HexbinColorScale;
  alpha?: number;
  showLabels?: boolean;
  labelMinCount?: number;
  haloWidth?: number;
}

function getEfficiencyColor(value: number, vmin: number, vmax: number, stops: Array<[number, string]>): string {
  const t = Math.max(0, Math.min(1, (value - vmin) / (vmax - vmin)));
  for (let i = 0; i < stops.length - 1; i++) {
    const [offset1, color1] = stops[i]!;
    const [offset2, color2] = stops[i + 1]!;
    if (t >= offset1 && t <= offset2) {
      const localT = (t - offset1) / (offset2 - offset1);
      return interpolateRgb(color1, color2)(localT);
    }
  }
  return stops[stops.length - 1]![1];
}

export const HexbinLayer = memo(function HexbinLayer({
  alpha = 0.85,
  colorScale = "efficiency",
  gridsize = 6,
  half = "full",
  haloWidth = 1.5,
  labelMinCount = 4,
  minCount = 2,
  player,
  scales,
  showLabels = true,
  shots,
  theme,
}: HexbinLayerProps) {
  const { hide, show, tooltip } = useSvgTooltip();

  const hexbins = useMemo(() => {
    const filtered = shots.filter(
      (s) =>
        (!player || s.player === player) &&
        s.bounceX != null &&
        s.bounceY != null &&
        s.result === "In",
    );

    const xs = filtered.map((s) => s.bounceX!);
    const ys = filtered.map((s) => s.bounceY!);

    let values: number[] | undefined;
    if (colorScale === "efficiency") {
      values = filtered.map((s) => (shotPlayerWonPoint(s) ? 1 : 0));
    } else if (colorScale === "speed") {
      values = filtered.map((s) => s.speedKmh ?? 0);
    }

    return computeHexbins(
      { x: xs, y: ys, values },
      { gridsize, half, minCount, sizeRange: [0.25, 0.95] },
    );
  }, [shots, player, half, gridsize, minCount, colorScale]);

  const stops = useMemo(() => efficiencyColorStops(theme), [theme]);

  const colorRange = useMemo(() => {
    if (colorScale === "efficiency") {
      return { vmax: 1, vmin: 0 };
    }
    if (colorScale === "speed") {
      return { vmax: 120, vmin: 40 };
    }
    return { vmax: hexbins.reduce((m, h) => Math.max(m, h.count), 0), vmin: 0 };
  }, [colorScale, hexbins]);

  const labelSize = theme.fontSize.label;

  return (
    <g onMouseLeave={hide}>
      {hexbins.map((hex, i) => {
        const color = colorScale === "count"
          ? getPlayerColor(player ?? "host", theme)
          : getEfficiencyColor(hex.value, colorRange.vmin, colorRange.vmax, stops);

        const points = hex.vertices
          .map(([vx, vy]) => `${scales.x(vx)},${scales.y(vy)}`)
          .join(" ");

        const cx = scales.x(hex.cx);
        const cy = scales.y(hex.cy);
        const r = Math.sqrt(
          (scales.x(hex.vertices[0]![0]) - cx) ** 2 +
          (scales.y(hex.vertices[0]![1]) - cy) ** 2,
        );
        const winPct = colorScale === "efficiency" ? Math.round(hex.value * 100) : null;
        const tooltipLines = [
          `${hex.count} shots`,
          winPct != null ? `${winPct}% win rate` : null,
        ].filter(Boolean) as string[];

        return (
          <g
            key={i}
            onMouseEnter={() => show(cx, cy, tooltipLines)}
            style={{ cursor: "pointer" }}
          >
            {haloWidth > 0 && (
              <polygon
                fill="none"
                opacity={alpha * 0.6}
                points={points}
                stroke={theme.haloColor}
                strokeWidth={haloWidth + 1}
              />
            )}

            <polygon
              fill={color}
              opacity={alpha}
              points={points}
              stroke={theme.ink}
              strokeWidth={0.5}
            />

            {showLabels && hex.count >= labelMinCount && r > r * 0.5 && (
              <text
                dominantBaseline="middle"
                fill={theme.haloColor}
                fontFamily={`${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`}
                fontSize={labelSize}
                fontWeight={700}
                pointerEvents="none"
                textAnchor="middle"
                x={cx}
                y={cy}
              >
                {hex.count}
              </text>
            )}
            <title>{tooltipLines.join(" · ")}</title>
          </g>
        );
      })}
      <SvgTooltip theme={theme} tooltip={tooltip} />
    </g>
  );
});
