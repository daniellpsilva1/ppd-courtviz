import { motionTokens } from "@ppd/tokens";
import {
  computeServeZones,
  createCourtScales,
  type ServeZoneStat,
} from "@courtviz/core";
import type { EnrichedShot } from "@courtviz/core";
import { Court, ServeLayer } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { BroadcastShell } from "../components/broadcast-shell";
import { CourtCard } from "../components/court-card";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { darkCourt } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { chromeOffsets, landscapeContentLayout } from "../scene-layout";

const COURT_W = 540;
const COURT_H = 480;
const GAP = 48;

const hostScales = createCourtScales({ half: "near", height: COURT_H, margin: 1.5, width: COURT_W });
const guestScales = createCourtScales({ half: "near", height: COURT_H, margin: 1.5, width: COURT_W });

export function ServePlacementScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const layout = landscapeContentLayout(height);

  const hostZones = computeServeZones(ctx.enrichedShots, "host");
  const guestZones = computeServeZones(ctx.enrichedShots, "guest");
  const { legendBottom } = chromeOffsets("landscape");
  const TOTAL_W = COURT_W * 2 + GAP + 64;
  const LEFT = (width - TOTAL_W) / 2;

  return (
    <BroadcastShell>
      <SceneHeader
        subtitle={`First serve in · direction split · avg speed`}
        title="Serve Placement"
      />

      <div style={{ display: "flex", gap: GAP, left: LEFT, position: "absolute", top: layout.contentTop }}>
        <ServePanel
          color={getPlayerColor("host", darkCourt)}
          directions={stats.hostServeDirections}
          firstServeIn={stats.hostFirstServe.rate !== null ? Math.round(stats.hostFirstServe.rate * 100) : 0}
          frame={frame}
          fps={fps}
          name={ctx.hostName}
          player="host"
          scales={hostScales}
          shots={ctx.enrichedShots}
          startFrame={15}
          zones={hostZones}
        />
        <ServePanel
          color={getPlayerColor("guest", darkCourt)}
          directions={stats.guestServeDirections}
          firstServeIn={stats.guestFirstServe.rate !== null ? Math.round(stats.guestFirstServe.rate * 100) : 0}
          frame={frame}
          fps={fps}
          name={ctx.guestName}
          player="guest"
          scales={guestScales}
          shots={ctx.enrichedShots}
          startFrame={22}
          zones={guestZones}
        />
      </div>

      <div style={{ bottom: legendBottom, display: "flex", gap: 28, left: "50%", opacity: spring({ config: motionTokens.springs.snappy, delay: 40, fps, frame }), position: "absolute", transform: "translateX(-50%)" }}>
        <ServeLegend color={getPlayerColor("host", darkCourt)} label="● 1st in" />
        <ServeLegend color={getPlayerColor("host", darkCourt)} label="▲ 2nd in" triangle />
        <ServeLegend color={getPlayerColor("host", darkCourt)} label="○ Fault" outline />
        <span style={{ color: darkCourt.inkMuted, fontFamily: bodyFont, fontSize: 14 }}>▓ Zone heat = in-rate</span>
      </div>

      <InsightCallout delay={50} text={sceneInsightForStats(stats, "serve")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function ServeLegend({ color, label, outline, triangle }: { color: string; label: string; outline?: boolean; triangle?: boolean }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
      {triangle ? (
        <svg height={14} width={14}>
          <path d="M7,1 L1,12 L13,12 Z" fill={outline ? "none" : color} stroke={color} strokeWidth={outline ? 2 : 1} />
        </svg>
      ) : (
        <svg height={14} width={14}>
          <circle cx={7} cy={7} fill={outline ? "none" : color} r={6} stroke={color} strokeWidth={outline ? 2 : 1} />
        </svg>
      )}
      <span style={{ color: darkCourt.inkMuted, fontFamily: bodyFont, fontSize: 14 }}>{label}</span>
    </div>
  );
}

function ServePanel({
  color,
  directions,
  firstServeIn,
  frame,
  fps,
  name,
  player,
  scales,
  shots,
  startFrame,
  zones,
}: {
  color: string;
  directions: { avgSpeedKmh: number; downTheT: number; outWide: number };
  firstServeIn: number;
  frame: number;
  fps: number;
  name: string;
  player: "host" | "guest";
  scales: ReturnType<typeof createCourtScales>;
  shots: EnrichedShot[];
  startFrame: number;
  zones: ServeZoneStat[];
}) {
  const labelSpring = spring({
    config: motionTokens.springs.snappy,
    delay: startFrame,
    fps,
    frame,
  });
  const heatOpacity = interpolate(frame, [startFrame + 10, startFrame + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const maxInRate = Math.max(...zones.map((z) => z.inCount / Math.max(z.count, 1)), 0.001);

  return (
    <CourtCard
      accentColor={color}
      label={name}
      labelOpacity={labelSpring}
      subtitle={`${firstServeIn}% in · ${directions.downTheT} T / ${directions.outWide} wide · ${directions.avgSpeedKmh} km/h`}
    >
      <Court half="near" height={COURT_H} surface={BRAND_SURFACE} theme={darkCourt} width={COURT_W}>
        {zones.map((zone, i) => {
          const boxW = COURT_W / 3;
          const boxH = COURT_H / 2;
          const boxX = zone.side === "deuce" ? boxW : 0;
          const boxY = zone.zone === "T" ? 0 : boxH;
          const inRate = zone.inCount / Math.max(zone.count, 1);
          const alpha = (inRate / maxInRate) * 0.4 * heatOpacity;

          return (
            <g key={i} opacity={heatOpacity}>
              <rect
                fill={color}
                height={boxH}
                opacity={alpha}
                width={boxW}
                x={boxX}
                y={boxY}
              />
              <text
                dominantBaseline="middle"
                fill={darkCourt.ink}
                fontFamily={condensedFont}
                fontSize={14}
                fontWeight={700}
                opacity={0.9}
                textAnchor="middle"
                x={boxX + boxW / 2}
                y={boxY + boxH / 2 - 6}
              >
                {Math.round(inRate * 100)}%
              </text>
              <text
                dominantBaseline="middle"
                fill={darkCourt.inkMuted}
                fontFamily={condensedFont}
                fontSize={10}
                fontWeight={600}
                opacity={0.7}
                textAnchor="middle"
                x={boxX + boxW / 2}
                y={boxY + boxH / 2 + 10}
              >
                {zone.inCount}/{zone.count}
              </text>
            </g>
          );
        })}
        <ServeLayer
          highContrast
          includeFaults
          player={player}
          scales={scales}
          serveType="both"
          shapeEncode
          shots={shots}
          size={3}
          sizeBy="speed"
          theme={darkCourt}
        />
      </Court>
      <ZoneMatrix color={color} frame={frame} fps={fps} zones={zones} />
    </CourtCard>
  );
}

function ZoneMatrix({ color, frame, fps, zones }: { color: string; frame: number; fps: number; zones: ServeZoneStat[] }) {
  const maxInRate = Math.max(...zones.map((z) => z.inCount / Math.max(z.count, 1)), 0.001);
  const sortedZones = [...zones].sort((a, b) => {
    const rowA = a.zone === "T" ? 0 : 1;
    const rowB = b.zone === "T" ? 0 : 1;
    const colA = a.side === "deuce" ? 0 : 1;
    const colB = b.side === "deuce" ? 0 : 1;
    return rowA - rowB || colA - colB;
  });
  return (
    <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(3, 1fr)", marginTop: 10 }}>
      {sortedZones.map((zone, i) => {
        const enter = spring({ config: motionTokens.springs.snappy, delay: 30 + i * 3, fps, frame });
        const inRate = zone.inCount / Math.max(zone.count, 1);
        const heatAlpha = inRate / maxInRate;
        return (
          <div key={i} style={{
            alignItems: "center",
            backgroundColor: `${color}${Math.round(heatAlpha * 80).toString(16).padStart(2, "0")}`,
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            opacity: enter,
            padding: "4px 6px",
          }}>
            <span style={{ color: darkCourt.ink, fontFamily: condensedFont, fontSize: 12, fontWeight: 700 }}>
              {Math.round(inRate * 100)}%
            </span>
            <span style={{ color: darkCourt.inkMuted, fontFamily: bodyFont, fontSize: 9 }}>
              {(zone.side ?? "?").charAt(0).toUpperCase()}{(zone.zone ?? "?").charAt(0).toUpperCase()} · {zone.inCount}/{zone.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
