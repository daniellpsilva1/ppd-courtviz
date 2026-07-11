/**
 * ZoneWinRateLayer — court zone polygons colored by win rate.
 */

import { memo } from "react";
import {
  type CourtScales,
  type ZoneWinRate,
  BOUNCE_ZONE_RECTS_NEAR,
  bounceZoneCentroid,
  zoneRectToSvg,
} from "@courtviz/core";
import { type CourtvizTheme, getPlayerColor } from "@courtviz/themes";

export interface ZoneWinRateLayerProps {
  zones: ZoneWinRate[];
  scales: CourtScales;
  theme: CourtvizTheme;
  player: "host" | "guest";
  minSamples?: number;
  showLabels?: boolean;
  hatchId?: string;
}

export const ZoneWinRateLayer = memo(function ZoneWinRateLayer({
  hatchId = "zone-hatch",
  minSamples = 8,
  player,
  scales,
  showLabels = true,
  theme,
  zones,
}: ZoneWinRateLayerProps) {
  const zoneMap = new Map(zones.map((zone) => [zone.zone.toLowerCase().replace(/\s+/g, "_"), zone]));
  const playerColor = getPlayerColor(player, theme);

  return (
    <g>
      {BOUNCE_ZONE_RECTS_NEAR.map((rect) => {
        const zone = zoneMap.get(rect.id);
        const total = zone?.total ?? 0;
        const winRate = zone?.winRate ?? 0;
        const hasEnough = total >= minSamples;
        const svg = zoneRectToSvg(scales, rect);
        const centroid = bounceZoneCentroid(rect.id);
        const labelX = centroid ? scales.x(centroid.cx) : svg.x + svg.w / 2;
        const labelY = centroid ? scales.y(centroid.cy) : svg.y + svg.h / 2;

        return (
          <g key={rect.id}>
            <rect
              fill={hasEnough ? playerColor : `url(#${hatchId})`}
              fillOpacity={hasEnough ? 0.2 + winRate * 0.6 : 0.35}
              height={svg.h}
              rx={2}
              stroke={hasEnough ? playerColor : theme.inkMuted}
              strokeDasharray={hasEnough ? undefined : "4 3"}
              strokeOpacity={hasEnough ? 0.85 : 0.5}
              strokeWidth={1}
              width={svg.w}
              x={svg.x}
              y={svg.y}
            />
            {showLabels ? (
              <text
                fill={hasEnough ? theme.ink : theme.inkMuted}
                fontFamily={theme.fonts.bodyFont}
                fontSize={theme.fontSize.label}
                fontWeight={700}
                textAnchor="middle"
                x={labelX}
                y={labelY - 4}
              >
                {hasEnough ? `${Math.round(winRate * 100)}%` : "—"}
              </text>
            ) : null}
            {showLabels && total > 0 ? (
              <text
                fill={theme.inkMuted}
                fontFamily={theme.fonts.bodyFont}
                fontSize={theme.fontSize.small}
                textAnchor="middle"
                x={labelX}
                y={labelY + 10}
              >
                ({total})
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
});
