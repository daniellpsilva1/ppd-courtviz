import { enrichedShots } from "@courtviz/data/fixtures";
import { Court, HexbinLayer } from "@courtviz/react";
import { createCourtScales } from "@courtviz/core";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { benchmarkStory, benchmarkProductTheme } from "../benchmark-story-data";
import { sharedEfficiencyDomain, buildPlayerHexbins } from "../court-viz-utils";
import {
  hostServiceStats,
  longRallyBattle,
  totalBreakPoints,
} from "../match-stats";

const HERO_W = 640;
const HERO_H = 720;
const heroScales = createCourtScales({ half: "near", height: HERO_H, margin: 1.5, width: HERO_W });
const heroHexbins = buildPlayerHexbins(enrichedShots, "host");
const heroDomain = sharedEfficiencyDomain([heroHexbins]);

const statChips = [
  {
    label: "Service won",
    value: `${Math.round(hostServiceStats.serviceWinRate * 100)}%`,
  },
  {
    label: "Long rallies",
    value: `${longRallyBattle.hostWon}–${longRallyBattle.guestWon}`,
  },
  {
    label: "Break points",
    value: String(totalBreakPoints),
  },
];

export function BenchmarkHookScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 25], [40, 0], { extrapolateRight: "clamp" });
  const courtScale = interpolate(frame, [8, 35], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor: benchmarkProductTheme.background,
        color: benchmarkProductTheme.ink,
        display: "flex",
        flexDirection: "column",
        fontFamily: benchmarkProductTheme.fonts.bodyFont,
        gap: 28,
        justifyContent: "center",
        padding: "72px 48px 108px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          opacity,
          transform: `scale(${courtScale})`,
        }}
      >
        <div
          style={{
            color: benchmarkProductTheme.playerHost,
            fontFamily: benchmarkProductTheme.fonts.condensedFont,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {benchmarkStory.frozenMetrics.hostTopZoneWinPct}%
        </div>
        <div style={{ color: benchmarkProductTheme.inkMuted, fontSize: 18, marginTop: 8 }}>
          deuce-side win rate
        </div>
        <div style={{ marginTop: 24 }}>
          <Court half="near" height={HERO_H} surface={BRAND_SURFACE} theme={benchmarkProductTheme} width={HERO_W}>
            <HexbinLayer
              gridsize={6}
              half="near"
              player="host"
              scales={heroScales}
              shots={enrichedShots}
              sizeRange={[0.25, 0.65]}
              theme={benchmarkProductTheme}
              valueDomain={heroDomain}
            />
          </Court>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          maxWidth: 920,
          opacity,
        }}
      >
        {statChips.map((chip) => (
          <div
            key={chip.label}
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              border: `1px solid ${benchmarkProductTheme.inkMuted}33`,
              borderRadius: 10,
              minWidth: 160,
              padding: "14px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: benchmarkProductTheme.inkMuted,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {chip.label}
            </div>
            <div
              style={{
                color: benchmarkProductTheme.playerHost,
                fontFamily: benchmarkProductTheme.fonts.condensedFont,
                fontSize: 28,
                fontWeight: 700,
                marginTop: 6,
              }}
            >
              {chip.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 920, transform: `translateY(${y}px)` }}>
        <p
          style={{
            color: benchmarkProductTheme.playerHost,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 4,
            opacity,
            textTransform: "uppercase",
          }}
        >
          PPD Insights
        </p>
        <h1
          style={{
            fontFamily: benchmarkProductTheme.fonts.condensedFont,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1.05,
            marginTop: 16,
            opacity,
            textTransform: "uppercase",
          }}
        >
          {benchmarkStory.title}
        </h1>
        <p style={{ color: benchmarkProductTheme.inkMuted, fontSize: 20, marginTop: 16, opacity }}>
          {benchmarkStory.hostName} def. {benchmarkStory.guestName} · {benchmarkStory.setScore}
        </p>
      </div>
    </AbsoluteFill>
  );
}
