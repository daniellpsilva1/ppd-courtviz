import { useMemo } from "react";
import { Court } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import {
  buildPlayerHexbins,
  darkCourt,
  defaultCourtScales,
  getEfficiencyColor,
  sharedEfficiencyDomain,
} from "../court-viz-utils";
import { condensedFont } from "../fonts";
import { sceneInsightForStats, getMatchStats } from "../match-stats";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

const COURT_W = 480;
const COURT_H = 500;

export function SocialHexbinScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = useMemo(() => getMatchStats(), []);
  const layout = verticalContentLayout(height);
  const hostHexbins = buildPlayerHexbins(ctx.enrichedShots, "host");
  const guestHexbins = buildPlayerHexbins(ctx.enrichedShots, "guest");
  const hostScales = defaultCourtScales(COURT_W, COURT_H, "near");
  const guestScales = defaultCourtScales(COURT_W, COURT_H, "near");
  const efficiencyDomain = sharedEfficiencyDomain([hostHexbins, guestHexbins]);

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Bigger = more shots · color = point win rate" title="Court Heatmaps" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          height: layout.contentHeight,
          justifyContent: "space-evenly",
          left: layout.sidePadding,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <PlayerBlock
          color={getPlayerColor("host", darkCourt)}
          efficiencyDomain={efficiencyDomain}
          frame={frame}
          fps={fps}
          hexbins={hostHexbins}
          name={ctx.hostName}
          scales={hostScales}
          startDelay={12}
          surface={ctx.surface ?? BRAND_SURFACE}
        />
        <PlayerBlock
          color={getPlayerColor("guest", darkCourt)}
          efficiencyDomain={efficiencyDomain}
          frame={frame}
          fps={fps}
          hexbins={guestHexbins}
          name={ctx.guestName}
          scales={guestScales}
          startDelay={30}
          surface={ctx.surface ?? BRAND_SURFACE}
        />
        <EfficiencyLegend domain={efficiencyDomain} />
      </div>

      <InsightCallout delay={40} orientation="vertical" text={sceneInsightForStats(stats, "hexbin")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}

function PlayerBlock({
  color,
  efficiencyDomain,
  frame,
  fps,
  hexbins,
  name,
  scales,
  startDelay,
  surface,
}: {
  color: string;
  efficiencyDomain: { vmin: number; vmax: number };
  frame: number;
  fps: number;
  hexbins: ReturnType<typeof buildPlayerHexbins>;
  name: string;
  scales: ReturnType<typeof defaultCourtScales>;
  startDelay: number;
  surface: string;
}) {
  const label = spring({ config: { damping: 28, stiffness: 200 }, delay: startDelay, fps, frame });
  const colorT = (value: number) => {
    const span = Math.max(0.001, efficiencyDomain.vmax - efficiencyDomain.vmin);
    return getEfficiencyColor((value - efficiencyDomain.vmin) / span, true);
  };
  const sortedHexbins = [...hexbins].sort((a, b) => a.count - b.count);

  return (
    <div style={{ opacity: label, width: COURT_W }}>
      <div
        style={{
          color,
          fontFamily: condensedFont,
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        {name}
      </div>
      <Court half="near" height={COURT_H} surface={surface as "clay" | "hard" | "grass"} theme={darkCourt} width={COURT_W}>
        {sortedHexbins.map((hex, index) => {
          const progress = spring({
            config: { damping: 28, stiffness: 200 },
            delay: startDelay + index,
            fps,
            frame,
          });
          const cx = scales.x(hex.cx);
          const cy = scales.y(hex.cy);
          const points = hex.vertices
            .map(([vx, vy]) => {
              const px = scales.x(vx);
              const py = scales.y(vy);
              return `${cx + (px - cx) * progress},${cy + (py - cy) * progress}`;
            })
            .join(" ");

          return (
            <polygon
              fill={colorT(hex.value)}
              key={index}
              opacity={0.9 * progress}
              points={points}
              stroke={darkCourt.haloColor}
              strokeWidth={0.6}
            />
          );
        })}
      </Court>
    </div>
  );
}

function EfficiencyLegend({ domain }: { domain: { vmin: number; vmax: number } }) {
  const cold = getEfficiencyColor(0, true);
  const hot = getEfficiencyColor(1, true);
  const mid = getEfficiencyColor(0.5, true);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "center",
        marginTop: 4,
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        <span
          style={{
            color: darkCourt.inkMuted,
            fontFamily: condensedFont,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Point win rate
        </span>
        <div
          style={{
            background: `linear-gradient(90deg, ${cold}, ${mid}, ${hot})`,
            borderRadius: 4,
            height: 10,
            width: 180,
          }}
        />
        <span style={{ color: darkCourt.inkMuted, fontFamily: condensedFont, fontSize: 12 }}>
          {Math.round(domain.vmin * 100)}%–{Math.round(domain.vmax * 100)}%
        </span>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
        <span
          style={{
            color: darkCourt.inkMuted,
            fontFamily: condensedFont,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Bigger = more shots
        </span>
        {[6, 10, 14].map((radius) => (
          <div
            key={radius}
            style={{
              background: darkCourt.inkMuted,
              borderRadius: "50%",
              height: radius,
              opacity: 0.75,
              width: radius,
            }}
          />
        ))}
      </div>
    </div>
  );
}
