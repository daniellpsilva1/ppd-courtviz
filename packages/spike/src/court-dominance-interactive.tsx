"use client";

import { useMemo, useState } from "react";
import {
  createCourtScales,
  type EnrichedShot,
} from "@courtviz/core";
import type { Point } from "@courtviz/data";
import { CourtSurface, HexbinLayer } from "@courtviz/react";
import {
  type CourtvizTheme,
  efficiencyColorStops,
  getPlayerColor,
  ppd,
} from "@courtviz/themes";
import { primaryCoachInsight } from "@ppd/brand";
import {
  DOMINANCE_GRIDSIZE,
  DOMINANCE_HALF,
  DOMINANCE_HEX_MIN,
  DOMINANCE_SIZE_RANGE,
  combinedEfficiencyDomain,
  singlesExtent,
} from "./dominance-utils";

export interface CourtDominanceInteractiveProps {
  enrichedShots: EnrichedShot[];
  points: Point[];
  hostName: string;
  guestName: string;
  surface?: "clay" | "hard" | "grass";
  theme?: CourtvizTheme;
  width?: number;
  courtHeight?: number;
}

export function CourtDominanceInteractive({
  enrichedShots,
  points,
  hostName,
  guestName,
  surface = "clay",
  theme = ppd,
  width = 420,
  courtHeight = 420,
}: CourtDominanceInteractiveProps) {
  const [activePlayer, setActivePlayer] = useState<"host" | "guest" | "both">("both");
  const scales = useMemo(
    () => createCourtScales({ half: DOMINANCE_HALF, height: courtHeight, margin: 1.5, width }),
    [courtHeight, width],
  );
  const valueDomain = useMemo(
    () => combinedEfficiencyDomain(enrichedShots, ["host", "guest"], DOMINANCE_HALF, DOMINANCE_GRIDSIZE),
    [enrichedShots],
  );
  const extent = singlesExtent(DOMINANCE_HALF);
  const insight = primaryCoachInsight({ enrichedShots, points, hostName, guestName });
  const stops = efficiencyColorStops(theme);

  const groundstrokes = enrichedShots.filter((s) => s.stroke !== "Serve");

  return (
    <div style={{ color: theme.ink, fontFamily: theme.fonts.bodyFont, maxWidth: width * 2 + 48 }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ fontFamily: theme.fonts.condensedFont, fontSize: theme.fontSize.title, margin: 0 }}>
          Court Dominance
        </h2>
        <p style={{ color: theme.inkMuted, fontSize: theme.fontSize.small, margin: "4px 0 0" }}>
          Size = frequency · color = win rate · {hostName} vs {guestName}
        </p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["both", "host", "guest"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePlayer(key)}
            style={{
              background: activePlayer === key ? theme.playerHost : theme.background,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              color: activePlayer === key ? theme.background : theme.ink,
              cursor: "pointer",
              fontSize: theme.fontSize.label,
              padding: "6px 10px",
            }}
          >
            {key === "both" ? "Both" : key === "host" ? hostName : guestName}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {(activePlayer === "both" ? (["host", "guest"] as const) : [activePlayer]).map((player) => (
          <div key={player}>
            <p
              style={{
                color: getPlayerColor(player, theme),
                fontFamily: theme.fonts.condensedFont,
                fontWeight: 700,
                margin: "0 0 6px",
              }}
            >
              {player === "host" ? hostName : guestName}
            </p>
            <CourtSurface
              half={DOMINANCE_HALF}
              height={courtHeight}
              idPrefix={`dominance-${player}`}
              surface={surface}
              theme={theme}
              width={width}
            >
              <HexbinLayer
                colorScale="efficiency"
                gridsize={DOMINANCE_GRIDSIZE}
                half={DOMINANCE_HALF}
                labelMinCount={6}
                minCount={DOMINANCE_HEX_MIN}
                player={player}
                scales={scales}
                shots={groundstrokes}
                sizeRange={DOMINANCE_SIZE_RANGE}
                theme={theme}
                useHalfCourtNormalization
                valueDomain={valueDomain}
                extent={extent}
              />
            </CourtSurface>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
        <div style={{ display: "flex", height: 8, flex: 1, borderRadius: 4, overflow: "hidden" }}>
          {stops.map(([_, color], i) => (
            <div key={i} style={{ background: color, flex: 1 }} />
          ))}
        </div>
        <span style={{ color: theme.inkMuted, fontSize: theme.fontSize.label }}>Efficiency</span>
      </div>

      <p
        style={{
          background: theme.background,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          fontSize: theme.fontSize.body,
          lineHeight: 1.45,
          marginTop: 16,
          padding: 12,
        }}
      >
        {insight}
      </p>
    </div>
  );
}
