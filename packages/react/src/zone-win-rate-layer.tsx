/**
 * ZoneWinRateLayer — court zone polygons colored by win rate.
 */

import { memo } from "react";
import {
  type CourtScales,
  type ZoneWinRate,
  type ZoneRect,
  BOUNCE_ZONE_RECTS_NEAR,
  bounceZoneCentroid,
  zoneRectToSvg,
} from "@courtviz/core";
import { type CourtvizTheme, efficiencyColorStops } from "@courtviz/themes";
import { interpolateRgb } from "d3-interpolate";

const ZONE_CAPTIONS: Record<string, string> = {
  ad: "Ad",
  ad_alley: "Ad alley",
  ad_deep: "Ad deep",
  ad_short: "Ad short",
  center_line: "Middle",
  center_deep: "Center deep",
  center_short: "Center short",
  deuce: "Deuce",
  deuce_alley: "Deuce alley",
  deuce_deep: "Deuce deep",
  deuce_short: "Deuce short",
};

const NARROW_ZONE_MIN_WIDTH = 36;

function getWinRateColor(winRate: number, theme: CourtvizTheme): string {
  const stops = efficiencyColorStops(theme);
  const t = Math.max(0, Math.min(1, winRate));
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

export interface ZoneWinRateLayerProps {
  zones: ZoneWinRate[];
  scales: CourtScales;
  theme: CourtvizTheme;
  player: "host" | "guest";
  minSamples?: number;
  showLabels?: boolean;
  hatchId?: string;
  rects?: ZoneRect[];
}

export const ZoneWinRateLayer = memo(function ZoneWinRateLayer({
  hatchId = "zone-hatch",
  minSamples = 8,
  player: _player,
  rects = BOUNCE_ZONE_RECTS_NEAR,
  scales,
  showLabels = true,
  theme,
  zones,
}: ZoneWinRateLayerProps) {
  const zoneMap = new Map(zones.map((zone) => [zone.zone.toLowerCase().replace(/\s+/g, "_"), zone]));
  const useLegacyFilter = rects === BOUNCE_ZONE_RECTS_NEAR;

  const courtBottomY = Math.max(
    ...rects.map((rect) => scales.y(rect.yMin)),
  );

  return (
    <g>
      <defs>
        <pattern
          height={6}
          id={hatchId}
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
          width={6}
        >
          <line stroke={theme.inkMuted} strokeOpacity={0.55} strokeWidth={1.25} x1={0} x2={0} y1={0} y2={6} />
        </pattern>
      </defs>
      {rects.filter((rect) => useLegacyFilter ? rect.id !== "center_line" : true).map((rect) => {
        const zone = zoneMap.get(rect.id);
        const total = zone?.total ?? 0;
        const winRate = zone?.winRate ?? 0;
        const hasEnough = total >= minSamples;
        const svg = zoneRectToSvg(scales, rect);
        const centroid = bounceZoneCentroid(rect.id);
        const labelX = centroid ? scales.x(centroid.cx) : svg.x + svg.w / 2;
        const labelY = centroid ? scales.y(centroid.cy) : svg.y + svg.h / 2;
        const isNarrow = svg.w < NARROW_ZONE_MIN_WIDTH;
        const captionY = useLegacyFilter ? courtBottomY - 10 : svg.y + svg.h - 8;

        return (
          <g key={rect.id}>
            <rect
              fill={hasEnough ? getWinRateColor(winRate, theme) : `url(#${hatchId})`}
              fillOpacity={hasEnough ? Math.min(0.85, 0.55 + winRate * 0.30) : 0.35}
              height={svg.h}
              rx={2}
              stroke={hasEnough ? "#ffffff" : theme.inkMuted}
              strokeDasharray={hasEnough ? undefined : "4 3"}
              strokeOpacity={hasEnough ? 0.85 : 0.5}
              strokeWidth={hasEnough ? 2 : 1}
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
                      fontSize={15}
                      fontWeight={700}
                      paintOrder="stroke"
                      stroke={hasEnough ? theme.ink : "none"}
                      strokeWidth={hasEnough ? 4.5 : 0}
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
                        fontSize={11}
                        opacity={0.95}
                        paintOrder="stroke"
                        stroke={hasEnough ? theme.ink : "none"}
                        strokeWidth={hasEnough ? 3.5 : 0}
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
                    fontSize={12}
                    fontWeight={700}
                    paintOrder="stroke"
                    stroke={theme.ink}
                    strokeWidth={3.5}
                    textAnchor="middle"
                    x={labelX}
                    y={labelY}
                  >
                    {`${Math.round(winRate * 1000) / 10}%`}
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
                    y={captionY}
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
