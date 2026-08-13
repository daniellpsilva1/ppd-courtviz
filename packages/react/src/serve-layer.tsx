'use client';

import { memo, useMemo } from "react";
import { type CourtScales, type EnrichedShot, type Surface, COURT_LENGTH, hasValidServeCoords, NET_Y, normalizeShot, shouldDisplayServe } from "@courtviz/core";
import { type CourtvizTheme, getPlayerColor } from "@courtviz/themes";
import { useHasSvgTooltipProvider, useSvgTooltip } from "./svg-tooltip-context";
import { SvgTooltip } from "./svg-tooltip";

export type ServeType = "first_serve" | "second_serve" | "both";

/** Amber/gold 2nd serve — never guest orange (#F97316), especially on clay. */
export const SECOND_SERVE_COLOR = "#FACC15";
export const SECOND_SERVE_COLOR_HARD = "#FBBF24";

function secondServeColor(surface?: Surface): string {
  return surface === "clay" ? SECOND_SERVE_COLOR : SECOND_SERVE_COLOR_HARD;
}

/** Dark halo on clay; editorial paper halo elsewhere. */
function serveHaloColor(theme: CourtvizTheme, surface?: Surface): string {
  return surface === "clay" ? "#0F172A" : theme.haloColor;
}

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
  /** Scale marker size by serve speed */
  sizeBy?: "speed";
  /** Court surface — drives 2nd-serve color + clay halo contrast */
  courtSurface?: Surface;
}

export const ServeLayer = memo(function ServeLayer({
  alpha = 0.8,
  courtSurface,
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
  sizeBy,
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
  const secondColor = secondServeColor(courtSurface);
  const halo = serveHaloColor(theme, courtSurface);

  const trianglePath = (cx: number, cy: number, r: number): string => {
    const h = r * 1.15;
    return `M${cx},${cy - h}L${cx - r * 0.95},${cy + h * 0.55}L${cx + r * 0.95},${cy + h * 0.55}Z`;
  };

  // Domain from filtered serves only — all-shot speeds (e.g. 338 km/h BH) crush markers.
  const speeds = serves.map(({ shot }) => shot.speedKmh).filter((v): v is number => v != null);
  const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 1;
  const speedScale = (sp: number | null) => {
    if (sp == null || maxSpeed === minSpeed) return size;
    // Wider dynamic range so social crops still read "larger = faster".
    return size * (0.45 + 1.1 * ((sp - minSpeed) / (maxSpeed - minSpeed)));
  };

  return (
    <g onMouseLeave={hide}>
      {serves.map(({ isIn, isSecond, shot, x, y }, i) => {
        const cx = scales.x(x);
        const cy = scales.y(y);
        const markerSize = sizeBy === "speed" ? speedScale(shot.speedKmh) : size;
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
                  d={trianglePath(cx, cy, markerSize + haloWidth)}
                  fill="none"
                  opacity={0.55}
                  stroke={halo}
                  strokeWidth={Math.max(haloWidth, 1)}
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  fill="none"
                  opacity={0.55}
                  r={markerSize + haloWidth}
                  stroke={halo}
                  strokeWidth={Math.max(haloWidth, 1)}
                />
              )
            )}

            {useTriangle ? (
              <path
                d={trianglePath(cx, cy, markerSize)}
                fill={isIn ? secondColor : "none"}
                opacity={fillOpacity}
                stroke={isIn ? halo : secondColor}
                strokeWidth={isIn ? 0.6 : 2}
              />
            ) : (
              <circle
                cx={cx}
                cy={cy}
                fill={isIn ? color : "none"}
                opacity={fillOpacity}
                r={markerSize}
                stroke={isIn ? halo : color}
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
