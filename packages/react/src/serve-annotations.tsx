/**
 * ServeAnnotations — editorial callouts for top serve zone insights.
 */

import { memo } from "react";
import { type CourtScales, type ServeZoneStat, zoneLabel } from "@courtviz/core";
import { type CourtvizTheme, ppd } from "@courtviz/themes";
import { CalloutCircle, InsightLabel, ZonePercentage } from "./annotation";

export interface ServeAnnotationsProps {
  zones: ServeZoneStat[];
  scales: CourtScales;
  theme?: CourtvizTheme;
  /** Which rate to highlight in the callout badge */
  metric?: "inRate" | "winRate";
  calloutRadius?: number;
}

export const ServeAnnotations = memo(function ServeAnnotations({
  calloutRadius = 28,
  metric = "inRate",
  scales,
  theme = ppd,
  zones,
}: ServeAnnotationsProps) {
  const topZone = zones[0];
  if (!topZone) return null;

  const cx = scales.x(topZone.meanX);
  const cy = scales.y(topZone.meanY);
  const pct = metric === "winRate" ? topZone.winRate : topZone.inRate;
  const metricLabel = metric === "winRate" ? "WIN" : "IN";
  const insightText = `${Math.round(pct * 100)}% ${metricLabel} — ${zoneLabel(topZone).toUpperCase()}`;

  return (
    <g data-testid="serve-annotations">
      <CalloutCircle cx={cx} cy={cy} radius={calloutRadius} theme={theme} />
      <ZonePercentage percentage={pct * 100} theme={theme} x={cx} y={cy} />
      <InsightLabel
        anchorX={cx}
        anchorY={cy}
        text={insightText}
        theme={theme}
        x={cx + 60}
        y={cy - 40}
      />
    </g>
  );
});
