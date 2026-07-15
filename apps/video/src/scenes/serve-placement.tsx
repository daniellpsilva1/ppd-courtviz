import { motionTokens } from "@ppd/tokens";
import {
  computeServeZones,
  createCourtScales,
  type ServeZoneStat,
} from "@courtviz/core";
import type { EnrichedShot } from "@courtviz/core";
import { Court, ServeLayer } from "@courtviz/react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
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
          color="#38BDF8"
          directions={stats.hostServeDirections}
          firstServeIn={Math.round(stats.hostFirstServe.rate * 100)}
          frame={frame}
          fps={fps}
          name={ctx.hostName}
          scales={hostScales}
          shots={ctx.enrichedShots}
          startFrame={15}
          zones={hostZones}
        />
        <ServePanel
          color="#FB923C"
          directions={stats.guestServeDirections}
          firstServeIn={Math.round(stats.guestFirstServe.rate * 100)}
          frame={frame}
          fps={fps}
          name={ctx.guestName}
          scales={guestScales}
          shots={ctx.enrichedShots}
          startFrame={22}
          zones={guestZones}
        />
      </div>

      <div style={{ bottom: legendBottom, display: "flex", gap: 28, left: "50%", opacity: spring({ config: motionTokens.springs.snappy, delay: 40, fps, frame }), position: "absolute", transform: "translateX(-50%)" }}>
        <ServeLegend color="#38BDF8" label="● 1st in" />
        <ServeLegend color="#38BDF8" label="▲ 2nd in" triangle />
        <ServeLegend color="#38BDF8" label="○ Fault" outline />
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
  const player = color === "#38BDF8" ? "host" : "guest";

  return (
    <CourtCard
      accentColor={color}
      label={name}
      labelOpacity={labelSpring}
      subtitle={`${firstServeIn}% in · ${directions.downTheT} T / ${directions.outWide} wide · ${directions.avgSpeedKmh} km/h`}
    >
      <Court half="near" height={COURT_H} surface={BRAND_SURFACE} theme={darkCourt} width={COURT_W}>
        <ServeLayer
          highContrast
          includeFaults
          player={player}
          scales={scales}
          serveType="both"
          shapeEncode
          shots={shots}
          theme={darkCourt}
        />
      </Court>
      <ZoneBars color={color} frame={frame} fps={fps} zones={zones} />
    </CourtCard>
  );
}

function ZoneBars({ color, frame, fps, zones }: { color: string; frame: number; fps: number; zones: ServeZoneStat[] }) {
  const maxCount = Math.max(...zones.map((z) => z.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
      <div style={{ color: darkCourt.inkMuted, fontFamily: condensedFont, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Zone breakdown
      </div>
      {zones.slice(0, 6).map((zone, i) => {
        const enter = spring({ config: motionTokens.springs.snappy, delay: 30 + i * 4, fps, frame });
        const barWidth = `${(zone.count / maxCount) * 100}%`;
        const winPct = Math.round(zone.winRate * 100);
        return (
          <div key={i} style={{ alignItems: "center", display: "flex", gap: 8, opacity: enter }}>
            <span style={{ color: darkCourt.inkMuted, fontFamily: bodyFont, fontSize: 11, textTransform: "capitalize", width: 80 }}>
              {zone.side} {zone.zone}
            </span>
            <div style={{ backgroundColor: `${color}33`, borderRadius: 2, height: 8, width: 120 }}>
              <div style={{ backgroundColor: color, borderRadius: 2, height: 8, width: barWidth }} />
            </div>
            <span style={{ color: darkCourt.ink, fontFamily: condensedFont, fontSize: 11, fontWeight: 700 }}>
              {winPct}% · n={zone.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
