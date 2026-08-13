/**
 * ServeAnnotations — editorial callouts for top serve zone insights.
 */

import { memo, useMemo } from "react";
import {
  type CourtScales,
  formatRate,
  measureSvgText,
  placeLabels,
  type ServeZoneStat,
  zoneLabel,
} from "@courtviz/core";
import { type CourtvizTheme, ppd } from "@courtviz/themes";
import { CalloutCircle, InsightLabel } from "./annotation";

export interface ServeAnnotationsProps {
  zones: ServeZoneStat[];
  scales: CourtScales;
  theme?: CourtvizTheme;
  /** Which rate to highlight in the outside label */
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

  const placement = useMemo(() => {
    if (!topZone) return null;
    const ax = scales.x(topZone.meanX);
    const ay = scales.y(topZone.meanY);
    const rate = metric === "winRate" ? topZone.winRate : topZone.inRate;
    const text = `${formatRate(rate)} ${metric === "winRate" ? "WIN" : "IN"} — ${zoneLabel(topZone).toUpperCase()}`;
    const w = measureSvgText(text, {
      fontFamily: theme.fonts.condensedFont,
      fontSize: theme.fontSize.label,
      fontWeight: 700,
    }) + 8;
    const h = theme.fontSize.label * 1.5;
    const placed = placeLabels(
      [{ height: h, width: w, x: ax, y: ay }],
      {
        bounds: { height: 2000, width: 2000, x: 0, y: 0 },
        gap: 8,
        obstacles: [
          { height: calloutRadius * 2, width: calloutRadius * 2, x: ax - calloutRadius, y: ay - calloutRadius },
        ],
      },
    )[0]!;
    return { ax, ay, placed, text };
  }, [topZone, scales, metric, theme, calloutRadius]);

  if (!topZone || !placement) return null;

  const { ax, ay, placed, text } = placement;

  return (
    <g data-testid="serve-annotations">
      <CalloutCircle cx={ax} cy={ay} radius={calloutRadius} theme={theme} />
      <InsightLabel
        anchorX={ax}
        anchorY={ay}
        text={text}
        theme={theme}
        x={placed.x}
        y={placed.y + theme.fontSize.label}
      />
    </g>
  );
});
