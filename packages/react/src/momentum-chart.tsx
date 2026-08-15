'use client';

import { memo, useMemo } from "react";
import { area, line } from "d3-shape";
import { computeMomentum, type MomentumPoint } from "@courtviz/core";
import { type CourtvizTheme, getPlayerColor } from "@courtviz/themes";
import { useSvgTooltip } from "./svg-tooltip-context";
import { SvgTooltip } from "./svg-tooltip";

export interface MomentumChartProps {
  points: Array<{
    setNumber: number;
    gameNumber: number;
    pointWinner: string;
    isBreakPoint: boolean;
    isSetPoint: boolean;
    isMatchPoint: boolean;
  }>;
  hostPlayer: string;
  theme: CourtvizTheme;
  width?: number;
  height?: number;
  showBreakPoints?: boolean;
  showSetBoundaries?: boolean;
  /** Show set number labels at boundaries (default true) */
  showSetLabels?: boolean;
  /** Use single primary color for both fills (host/guest opacities differ) */
  monoBlue?: boolean;
  /** Optional reveal progress (0-1) for wipe animation; if omitted, full chart is shown */
  revealProgress?: number;
  /** Accessible summary for screen readers */
  accessibleSummary?: string;
}

export const MomentumChart = memo(function MomentumChart({
  accessibleSummary,
  height = 200,
  hostPlayer,
  monoBlue = false,
  points,
  revealProgress = 1,
  showBreakPoints = true,
  showSetBoundaries = true,
  showSetLabels = true,
  theme,
  width = 800,
}: MomentumChartProps) {
  const { hide, show, tooltip } = useSvgTooltip();
  const momentum = useMemo(
    () => computeMomentum(points, hostPlayer),
    [points, hostPlayer],
  );

  const padding = { bottom: 24, left: 48, right: 16, top: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { maxAbs, setBoundaries } = useMemo(() => {
    const ma = Math.max(1, ...momentum.map((m) => Math.abs(m.cumulativeDiff)));
    const boundaries: Array<{ index: number; setNumber: number }> = [];
    let lastSet = -1;
    momentum.forEach((m) => {
      if (m.setNumber !== lastSet) {
        boundaries.push({ index: m.pointIndex, setNumber: m.setNumber });
        lastSet = m.setNumber;
      }
    });
    return { maxAbs: ma, setBoundaries: boundaries };
  }, [momentum]);

  const xScale = (i: number) => padding.left + (i / Math.max(momentum.length - 1, 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH / 2 - (v / maxAbs) * (chartH / 2);

  const primaryColor = theme.playerHost ?? getPlayerColor("host", theme);
  const hostColor = monoBlue ? primaryColor : getPlayerColor("host", theme);
  const guestColor = monoBlue ? primaryColor : getPlayerColor("guest", theme);
  const hostFillOpacity = monoBlue ? 0.32 : 0.26;
  const guestFillOpacity = monoBlue ? 0.18 : 0.26;
  const zeroY = yScale(0);

  // Host area (positive, above zero) — uses d3.area with clamped y1 at zero
  const hostAreaPath = useMemo(() => {
    if (momentum.length === 0) return "";
    const gen = area<typeof momentum[number]>()
      .x((m) => xScale(m.pointIndex))
      .y0(zeroY)
      .y1((m) => (m.cumulativeDiff >= 0 ? yScale(m.cumulativeDiff) : zeroY));
    return gen(momentum) ?? "";
  }, [momentum, maxAbs]);

  // Guest area (negative, below zero) — uses d3.area with clamped y1 at zero
  const guestAreaPath = useMemo(() => {
    if (momentum.length === 0) return "";
    const gen = area<typeof momentum[number]>()
      .x((m) => xScale(m.pointIndex))
      .y0(zeroY)
      .y1((m) => (m.cumulativeDiff <= 0 ? yScale(m.cumulativeDiff) : zeroY));
    return gen(momentum) ?? "";
  }, [momentum, maxAbs]);

  const linePath = useMemo(() => {
    if (momentum.length === 0) return "";
    const gen = line<typeof momentum[number]>()
      .x((m) => xScale(m.pointIndex))
      .y((m) => yScale(m.cumulativeDiff));
    return gen(momentum) ?? "";
  }, [momentum, maxAbs]);

  const breakPoints = useMemo(
    () => momentum.filter((m) => m.isBreakPoint),
    [momentum],
  ) as MomentumPoint[];

  const fontBody = `${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`;
  const fontCondensed = `${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`;
  const fs = theme.fontSize;

  return (
    <svg
      aria-describedby={accessibleSummary ? `${hostPlayer}-momentum-desc` : undefined}
      aria-labelledby={`${hostPlayer}-momentum-title`}
      height={height}
      onMouseLeave={hide}
      role="img"
      style={{ display: "block" }}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <title id={`${hostPlayer}-momentum-title`}>Momentum chart</title>
      {accessibleSummary && <desc id={`${hostPlayer}-momentum-desc`}>{accessibleSummary}</desc>}
      <rect fill={theme.background} height={height} width={width} x={0} y={0} />

      {momentum.length === 0 && (
        <text
          fill={theme.inkMuted}
          fontFamily={fontBody}
          fontSize={fs.label}
          textAnchor="middle"
          x={width / 2}
          y={height / 2}
        >
          No momentum data
        </text>
      )}

      {momentum.length > 0 && showSetBoundaries && setBoundaries.map((sb, i) => {
        const nextBoundary = setBoundaries[i + 1];
        const x1 = xScale(sb.index);
        const x2 = nextBoundary ? xScale(nextBoundary.index) : (width - padding.right);
        const isEvenSet = sb.setNumber % 2 === 0;
        const gamesInSet = nextBoundary
          ? momentum[nextBoundary.index - 1]?.gameNumber ?? 0
          : momentum[momentum.length - 1]?.gameNumber ?? 0;
        return (
          <g key={`set-band-${i}`}>
            <rect
              fill={isEvenSet ? theme.ink : theme.inkMuted}
              height={chartH}
              opacity={0.05}
              x={x1}
              y={padding.top}
              width={x2 - x1}
            />
            <line
              stroke={theme.inkMuted}
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              strokeWidth={1}
              x1={x1}
              x2={x1}
              y1={padding.top}
              y2={height - padding.bottom}
            />
            {showSetLabels && (
              <text
                fill={theme.inkMuted}
                fontFamily={fontCondensed}
                fontSize={fs.small}
                fontWeight={600}
                textAnchor="middle"
                x={(x1 + x2) / 2}
                y={padding.top - 8}
              >
                Set {sb.setNumber}
              </text>
            )}
            {/* Game ticks at each game boundary within this set */}
            {Array.from({ length: Math.max(gamesInSet - 1, 0) }, (_, g) => {
              const gameIdx = momentum.findIndex(
                (m) => m.setNumber === sb.setNumber && m.gameNumber === g + 2,
              );
              if (gameIdx < 0) return null;
              const gx = xScale(gameIdx);
              return (
                <line
                  key={`gt-${g}`}
                  stroke={theme.inkMuted}
                  strokeOpacity={0.15}
                  strokeWidth={0.5}
                  x1={gx}
                  x2={gx}
                  y1={zeroY - 4}
                  y2={zeroY + 4}
                />
              );
            })}
          </g>
        );
      })}

      {/* Zero line */}
      {momentum.length > 0 && (
        <line
          stroke={theme.inkMuted}
          strokeDasharray="4 4"
          strokeWidth={1}
          x1={padding.left}
          x2={width - padding.right}
          y1={zeroY}
          y2={zeroY}
        />
      )}

      {momentum.length > 0 && (
        <path
          d={hostAreaPath}
          fill={hostColor}
          opacity={hostFillOpacity * revealProgress}
        />
      )}

      {momentum.length > 0 && (
        <path
          d={guestAreaPath}
          fill={guestColor}
          opacity={guestFillOpacity * revealProgress}
        />
      )}

      {momentum.length > 0 && (
        <path
          d={linePath}
          fill="none"
          stroke={theme.ink}
          strokeDasharray={`${chartW * 2}`}
          strokeDashoffset={chartW * 2 * (1 - revealProgress)}
          strokeWidth={2.5}
        />
      )}

      {/* Break point markers with halos */}
      {momentum.length > 0 && showBreakPoints &&
        breakPoints.map((bp, i) => {
          const color = bp.pointWinner === hostPlayer ? hostColor : guestColor;
          const cx = xScale(bp.pointIndex);
          const cy = yScale(bp.cumulativeDiff);
          const tooltipLines = [
            `Point ${bp.pointIndex + 1}`,
            `Set ${bp.setNumber} · Game ${bp.gameNumber}`,
            `Diff: ${bp.cumulativeDiff > 0 ? "+" : ""}${bp.cumulativeDiff}`,
            bp.isBreakPoint ? "Break point" : null,
          ].filter(Boolean) as string[];
          return (
            <g
              key={`bp-${i}`}
              onMouseEnter={() => show(cx, cy, tooltipLines)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={cx} cy={cy} fill="none" opacity={0.4} r={4} stroke={theme.haloColor} strokeWidth={0.75} />
              <circle cx={cx} cy={cy} fill={color} r={2.5} stroke={theme.background} strokeWidth={0.75} />
            </g>
          );
        })}

      {momentum.length > 0 && momentum.map((point) => {
        const cx = xScale(point.pointIndex);
        const cy = yScale(point.cumulativeDiff);
        const tooltipLines = [
          `Point ${point.pointIndex + 1}`,
          `Set ${point.setNumber} · Game ${point.gameNumber}`,
          `Diff: ${point.cumulativeDiff > 0 ? "+" : ""}${point.cumulativeDiff}`,
          point.isBreakPoint ? "Break point" : null,
        ].filter(Boolean) as string[];
        return (
          <circle
            cx={cx}
            cy={cy}
            fill="transparent"
            key={`hover-${point.pointIndex}`}
            onMouseEnter={() => show(cx, cy, tooltipLines)}
            r={6}
            style={{ cursor: "pointer" }}
          />
        );
      })}

      <SvgTooltip bounds={{ height, width }} theme={theme} tooltip={tooltip} />

      {/* Y-axis labels */}
      {momentum.length > 0 && (
        <text
          fill={hostColor}
          fontFamily={fontBody}
          fontSize={fs.small}
          textAnchor="end"
          x={padding.left - 6}
          y={yScale(maxAbs) + 3}
        >
          +{maxAbs}
        </text>
      )}
      {momentum.length > 0 && (
        <text
          fill={guestColor}
          fontFamily={fontBody}
          fontSize={fs.small}
          textAnchor="end"
          x={padding.left - 6}
          y={yScale(-maxAbs) + 3}
        >
          -{maxAbs}
        </text>
      )}
      {momentum.length > 0 && (
        <text
          fill={theme.inkMuted}
          fontFamily={fontBody}
          fontSize={fs.small}
          textAnchor="end"
          x={padding.left - 6}
          y={zeroY + 3}
        >
          0
        </text>
      )}
    </svg>
  );
});
