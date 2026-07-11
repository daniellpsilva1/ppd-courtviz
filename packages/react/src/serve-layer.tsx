'use client';

import { memo, useMemo } from "react";
import { type CourtScales, type EnrichedShot, COURT_LENGTH, hasValidServeCoords, NET_Y, normalizeShot, shouldDisplayServe } from "@courtviz/core";
import { type CourtvizTheme, getPlayerColor } from "@courtviz/themes";
import { useHasSvgTooltipProvider, useSvgTooltip } from "./svg-tooltip-context";
import { SvgTooltip } from "./svg-tooltip";

export type ServeType = "first_serve" | "second_serve" | "both";

/** Mirror far-half bounces so faults remain visible on the near-half clip. */
function displayServeCoords(
  bounceX: number,
  bounceY: number,
  hitY: number | null,
): [number, number] {
  let [nx, ny] = normalizeShot(bounceX, bounceY, hitY ?? COURT_LENGTH);
  if (ny > NET_Y) {
    [nx, ny] = [-nx, COURT_LENGTH - ny];
  }
  return [nx, ny];
}

export interface ServeLayerProps {
  shots: EnrichedShot[];
  scales: CourtScales;
  theme: CourtvizTheme;
  player: string;
  serveType?: ServeType;
  size?: number;
  alpha?: number;
  haloWidth?: number;
  shapeEncode?: boolean;
  /** Show faults and out-of-box serves (poster export) */
  includeFaults?: boolean;
  /** Hide fault / out-of-box serves (default false) */
  inBoxOnly?: boolean;
  /** Brighter marker color on blue courts */
  highContrast?: boolean;
}

export const ServeLayer = memo(function ServeLayer({
  alpha = 0.8,
  haloWidth = 1,
  highContrast = false,
  includeFaults = false,
  inBoxOnly = false,
  player,
  scales,
  serveType = "both",
  shapeEncode = true,
  shots,
  size = 6,
  theme,
}: ServeLayerProps) {
  const { hide, show, tooltip } = useSvgTooltip();
  const hasTooltipProvider = useHasSvgTooltipProvider();

  const serves = useMemo(() => {
    return shots
      .filter((s) => {
        if (s.player !== player) return false;
        if (s.stroke !== "Serve") return false;
        if (!hasValidServeCoords(s)) return false;
        if (!includeFaults && !shouldDisplayServe(s)) return false;
        if (inBoxOnly && s.result !== "In") return false;
        if (serveType !== "both" && s.type !== serveType) return false;
        return true;
      })
      .map((s) => {
        const [nx, ny] = displayServeCoords(s.bounceX!, s.bounceY!, s.hitY);
        return { isIn: s.result === "In", isSecond: s.type === "second_serve", shot: s, x: nx, y: ny };
      });
  }, [shots, player, serveType, inBoxOnly, includeFaults]);

  const color = highContrast ? (player === "guest" ? "#FB923C" : "#38BDF8") : getPlayerColor(player, theme);

  const trianglePath = (cx: number, cy: number, r: number): string => {
    const h = r * 1.15;
    return `M${cx},${cy - h}L${cx - r * 0.95},${cy + h * 0.55}L${cx + r * 0.95},${cy + h * 0.55}Z`;
  };

  return (
    <g onMouseLeave={hide}>
      {serves.map(({ isIn, isSecond, shot, x, y }, i) => {
        const cx = scales.x(x);
        const cy = scales.y(y);
        const useTriangle = shapeEncode && isSecond;
        const fillOpacity = isIn ? alpha : alpha * 0.45;
        const tooltipLines = [
          isSecond ? "Second serve" : "First serve",
          `Result: ${shot.result ?? "—"}`,
          shot.speedKmh != null ? `${Math.round(shot.speedKmh)} km/h` : null,
          shot.bounceZone ? `Zone: ${shot.bounceZone.replace(/_/g, " ")}` : null,
        ].filter(Boolean) as string[];

        return (
          <g
            key={i}
            onMouseEnter={() => show(cx, cy, tooltipLines)}
            style={{ cursor: "pointer" }}
          >
            {isIn && haloWidth > 0 && (
              useTriangle ? (
                <path
                  d={trianglePath(cx, cy, size + haloWidth)}
                  fill="none"
                  opacity={0.5}
                  stroke={theme.haloColor}
                  strokeWidth={haloWidth}
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  fill="none"
                  opacity={0.5}
                  r={size + haloWidth}
                  stroke={theme.haloColor}
                  strokeWidth={haloWidth}
                />
              )
            )}

            {useTriangle ? (
              <path
                d={trianglePath(cx, cy, size)}
                fill={isIn ? color : "none"}
                opacity={fillOpacity}
                stroke={isIn ? theme.haloColor : color}
                strokeWidth={isIn ? 0.6 : 2}
              />
            ) : (
              <circle
                cx={cx}
                cy={cy}
                fill={isIn ? color : "none"}
                opacity={fillOpacity}
                r={size}
                stroke={isIn ? theme.haloColor : color}
                strokeWidth={isIn ? 0.6 : 2}
              />
            )}
          </g>
        );
      })}
      {!hasTooltipProvider ? <SvgTooltip theme={theme} tooltip={tooltip} /> : null}
    </g>
  );
});
