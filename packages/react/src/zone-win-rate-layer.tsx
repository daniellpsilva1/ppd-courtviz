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

const ZONE_CAPTIONS: Record<string, string> = {
  ad: "Ad",
  ad_alley: "Ad alley",
  center_line: "Middle",
  deuce: "Deuce",
  deuce_alley: "Deuce alley",
};

const NARROW_ZONE_MIN_WIDTH = 36;

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

  const courtBottomY = Math.max(
    ...BOUNCE_ZONE_RECTS_NEAR.map((rect) => scales.y(rect.yMin)),
  );

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
        const isNarrow = svg.w < NARROW_ZONE_MIN_WIDTH;

        return (
          <g key={rect.id}>
            <rect
              fill={hasEnough ? playerColor : `url(#${hatchId})`}
              fillOpacity={hasEnough ? Math.min(0.65, 0.22 + winRate * 0.43) : 0.35}
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
              <>
                {!isNarrow ? (
                  <>
                    <text
                      dominantBaseline="middle"
                      fill={hasEnough ? theme.background : theme.inkMuted}
                      fontFamily={theme.fonts.bodyFont}
                      fontSize={13}
                      fontWeight={700}
                      paintOrder="stroke"
                      stroke={hasEnough ? theme.ink : "none"}
                      strokeWidth={hasEnough ? 3 : 0}
                      textAnchor="middle"
                      x={labelX}
                      y={labelY}
                    >
                      {hasEnough ? `${Math.round(winRate * 100)}%` : "—"}
                    </text>
                    {total > 0 ? (
                      <text
                        dominantBaseline="middle"
                        fill={hasEnough ? theme.background : theme.inkMuted}
                        fontFamily={theme.fonts.bodyFont}
                        fontSize={9}
                        opacity={0.9}
                        paintOrder="stroke"
                        stroke={hasEnough ? theme.ink : "none"}
                        strokeWidth={hasEnough ? 2 : 0}
                        textAnchor="middle"
                        x={labelX}
                        y={labelY + 14}
                      >
                        n={total}
                      </text>
                    ) : null}
                  </>
                ) : hasEnough ? (
                  <text
                    dominantBaseline="middle"
                    fill={theme.background}
                    fontFamily={theme.fonts.bodyFont}
                    fontSize={10}
                    fontWeight={700}
                    paintOrder="stroke"
                    stroke={theme.ink}
                    strokeWidth={2}
                    textAnchor="middle"
                    x={labelX}
                    y={labelY}
                  >
                    {Math.round(winRate * 100)}%
                  </text>
                ) : null}
                {!isNarrow && rect.id !== "ad_alley" && rect.id !== "deuce_alley" ? (
                  <text
                    fill={theme.inkMuted}
                    fontFamily={theme.fonts.condensedFont}
                    fontSize={9}
                    fontWeight={600}
                    textAnchor="middle"
                    x={labelX}
                    y={courtBottomY + 14}
                  >
                    {ZONE_CAPTIONS[rect.id] ?? rect.id}
                  </text>
                ) : null}
              </>
            ) : null}
          </g>
        );
      })}
    </g>
  );
});
