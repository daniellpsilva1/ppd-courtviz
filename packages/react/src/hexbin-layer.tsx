'use client';

import { memo, useMemo } from "react";
import { interpolateRgb } from "d3-interpolate";
import {
  type CourtHalf,
  type CourtScales,
  type EnrichedShot,
  COURT_LENGTH,
  SINGLES_HALF,
  computeHexbins,
  normalizeShot,
  shotPlayerWonPoint,
} from "@courtviz/core";
import {
  type CourtvizTheme,
  efficiencyColorStops,
  getPlayerColor,
} from "@courtviz/themes";
import { useHasSvgTooltipProvider, useSvgTooltip } from "./svg-tooltip-context";
import { SvgTooltip } from "./svg-tooltip";

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
  /** Hex size range relative to grid cell (default tighter to reduce overlap) */
  sizeRange?: [number, number];
  /** Shared efficiency domain for comparable side-by-side courts */
  valueDomain?: { vmin: number; vmax: number };
  /** Clip hexes to court bounds (parent Court also clips) */
  clip?: boolean;
  /** Normalize bounce coords to near half (dominance posters) */
  useHalfCourtNormalization?: boolean;
  /** Binning extent [xmin, xmax, ymin, ymax] in court meters */
  extent?: [number, number, number, number];
}

function getEfficiencyColor(value: number, vmin: number, vmax: number, stops: Array<[number, string]>): string {
  const span = Math.max(vmax - vmin, 0.001);
  const t = Math.max(0, Math.min(1, (value - vmin) / span));
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

function hexLuminance(hex: string): number {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return 0.5;
  const r = parseInt(m[1]!, 16) / 255;
  const g = parseInt(m[2]!, 16) / 255;
  const b = parseInt(m[3]!, 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function contrastTextColor(fill: string, halo: string): string {
  return hexLuminance(fill) > 0.55 ? halo : "#ffffff";
}

/** Sequential density fill: light tint → player color as count increases. */
function getCountColor(count: number, vmax: number, playerColor: string, lowColor = "#E8F0FF"): string {
  const t = vmax > 0 ? Math.max(0, Math.min(1, count / vmax)) : 0;
  // Keep sparse bins visible; reserve the darkest stop for the densest bin.
  return interpolateRgb(lowColor, playerColor)(0.2 + 0.8 * t);
}

export const HexbinLayer = memo(function HexbinLayer({
  alpha = 0.68,
  clip = false,
  colorScale = "efficiency",
  extent,
  gridsize = 6,
  half = "full",
  haloWidth = 0.5,
  labelMinCount = 6,
  minCount = 2,
  player,
  scales,
  showLabels = true,
  shots,
  sizeRange = [0.25, 0.65],
  theme,
  useHalfCourtNormalization = false,
  valueDomain,
}: HexbinLayerProps) {
  const { hide, show, tooltip } = useSvgTooltip();
  const hasTooltipProvider = useHasSvgTooltipProvider();

  const hexbins = useMemo(() => {
    const filtered = shots.filter(
      (s) =>
        (!player || s.player === player) &&
        s.bounceX != null &&
        s.bounceY != null &&
        s.result === "In",
    );

    const xs = filtered.map((s) => {
      if (!useHalfCourtNormalization) return s.bounceX!;
      return normalizeShot(s.bounceX!, s.bounceY!, s.hitY!)[0];
    });
    const ys = filtered.map((s) => {
      if (!useHalfCourtNormalization) return s.bounceY!;
      return normalizeShot(s.bounceX!, s.bounceY!, s.hitY!)[1];
    });

    let values: number[] | undefined;
    if (colorScale === "efficiency") {
      values = filtered.map((s) => (shotPlayerWonPoint(s) ? 1 : 0));
    } else if (colorScale === "speed") {
      values = filtered.map((s) => s.speedKmh ?? 0);
    }

    return computeHexbins(
      { x: xs, y: ys, values },
      { gridsize, half, minCount, sizeRange, extent },
    );
  }, [shots, player, half, gridsize, minCount, colorScale, sizeRange, extent, useHalfCourtNormalization]);

  const stops = useMemo(() => efficiencyColorStops(theme), [theme]);

  const colorRange = useMemo(() => {
    if (valueDomain) return valueDomain;
    if (colorScale === "efficiency") {
      return { vmax: 1, vmin: 0 };
    }
    if (colorScale === "speed") {
      return { vmax: 120, vmin: 40 };
    }
    return { vmax: hexbins.reduce((m, h) => Math.max(m, h.count), 0), vmin: 0 };
  }, [colorScale, hexbins, valueDomain]);

  const labelSize = theme.fontSize.label;
  const clipId = `hexbin-clip-${half}`;

  return (
    <g onMouseLeave={hide}>
      {clip && (
        <defs>
          <clipPath id={clipId}>
            <rect height={scales.y(0) - scales.y(COURT_LENGTH)} width={scales.x(SINGLES_HALF) - scales.x(-SINGLES_HALF)} x={scales.x(-SINGLES_HALF)} y={scales.y(COURT_LENGTH)} />
          </clipPath>
        </defs>
      )}
      <g clipPath={clip ? `url(#${clipId})` : undefined}>
      {hexbins.map((hex, i) => {
        const playerColor = getPlayerColor(player ?? "host", theme);
        const color = colorScale === "count"
          ? getCountColor(hex.count, colorRange.vmax, playerColor)
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
        const pointsWon = colorScale === "efficiency" ? Math.round(hex.value * hex.count) : null;
        const tooltipLines = [
          `${hex.count} shots landed here`,
          winPct != null ? `${winPct}% win rate (${pointsWon}/${hex.count} points)` : null,
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
                strokeWidth={haloWidth}
              />
            )}

            <polygon
              fill={color}
              opacity={alpha}
              points={points}
              stroke={theme.haloColor}
              strokeWidth={0.3}
            />

            {showLabels && hex.count >= labelMinCount && r > labelSize * 0.9 && (
              <text
                dominantBaseline="middle"
                fill={contrastTextColor(color, theme.haloColor)}
                fontFamily={`${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`}
                fontSize={Math.min(labelSize, r * 0.85)}
                fontWeight={700}
                pointerEvents="none"
                textAnchor="middle"
                x={cx}
                y={cy}
              >
                {hex.count}
              </text>
            )}
          </g>
        );
      })}
      </g>
      {!hasTooltipProvider ? <SvgTooltip theme={theme} tooltip={tooltip} /> : null}
    </g>
  );
});
