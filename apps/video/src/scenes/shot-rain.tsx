import { motionTokens } from "@ppd/tokens";
import { createCourtScales, hasValidSpatialCoords, shotPlayerWonPoint } from "@courtviz/core";
import type { EnrichedShot } from "@courtviz/core";
import { Court } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { BroadcastShell } from "../components/broadcast-shell";
import { CourtZoom } from "../components/court-zoom";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SetFlash } from "../components/set-flash";
import { SCENE_DURATIONS } from "../constants";
import { darkCourt } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { chromeOffsets, landscapeContentLayout } from "../scene-layout";

const REVEAL_START = 30;
const REVEAL_END = 270;
const COURT_WIDTH = 580;
const COURT_HEIGHT = 720;
const PANEL_W = 280;
const TOTAL_W = PANEL_W + 48 + COURT_WIDTH + 48 + PANEL_W;

const scales = createCourtScales({
  half: "full",
  height: COURT_HEIGHT,
  margin: 1.5,
  width: COURT_WIDTH,
});

export function ShotRainScene() {
  const frame = useCurrentFrame();
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const { legendBottom } = chromeOffsets("landscape");
  const layout = landscapeContentLayout(1080);
  const COURT_TOP = layout.contentTop + (layout.contentHeight - COURT_HEIGHT) / 2;

  const orderedShots = ctx.enrichedShots
    .filter(
      (shot) =>
        shot.stroke !== "Serve" &&
        hasValidSpatialCoords(shot) &&
        shot.result === "In",
    )
    .sort((a, b) => {
      if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber;
      if (a.gameNumber !== b.gameNumber) return a.gameNumber - b.gameNumber;
      if (a.pointNumber !== b.pointNumber) return a.pointNumber - b.pointNumber;
      return (a.shotNumber ?? 0) - (b.shotNumber ?? 0);
    });

  const setChangeFrames = (() => {
    const changes: Array<{ frame: number; setNumber: number }> = [];
    let lastSet = -1;
    const total = orderedShots.length;
    for (let i = 0; i < total; i++) {
      const set = orderedShots[i]!.setNumber;
      if (set !== lastSet && i > 0) {
        changes.push({
          frame: REVEAL_START + (i / total) * (REVEAL_END - REVEAL_START),
          setNumber: set,
        });
        lastSet = set;
      } else if (i === 0) {
        lastSet = set;
      }
    }
    return changes;
  })();
  const totalShots = orderedShots.length;
  const revealProgress = interpolate(
    frame,
    [REVEAL_START, REVEAL_END],
    [0, totalShots],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const visibleCount = Math.floor(revealProgress);
  const currentSet = orderedShots[Math.max(0, visibleCount - 1)]?.setNumber ?? 1;
  const counterSpring = spring({
    config: motionTokens.springs.snappy,
    fps: 30,
    frame: frame - REVEAL_START,
  });

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Every bounce, in match order" title="Shot Rain" />

      {setChangeFrames.map((change) => (
        <SetFlash key={change.setNumber} setNumber={change.setNumber} triggerFrame={change.frame} />
      ))}

      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          border: `1px solid ${darkCourt.inkMuted}44`,
          borderRadius: 8,
          color: darkCourt.ink,
          fontFamily: condensedFont,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.12em",
          padding: "10px 18px",
          position: "absolute",
          right: 80,
          textTransform: "uppercase",
          top: 68,
        }}
      >
        Set {currentSet}
      </div>

      <div style={{ display: "flex", gap: 48, left: (1920 - TOTAL_W) / 2, position: "absolute", top: COURT_TOP }}>
        <SidePanel
          frame={frame}
          name={ctx.hostName}
          player="host"
          shots={orderedShots}
          visibleCount={visibleCount}
        />
        <div>
          <CourtZoom durationInFrames={SCENE_DURATIONS.shotRain} from={1} to={1.04}>
            <Court half="full" height={COURT_HEIGHT} surface={BRAND_SURFACE} theme={darkCourt} width={COURT_WIDTH}>
              <defs>
                <filter id="dot-glow">
                  <feGaussianBlur result="blur" stdDeviation="2" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <AnimatedDots frame={frame} orderedShots={orderedShots} visibleCount={visibleCount} />
            </Court>
          </CourtZoom>
        </div>
        <SidePanel
          frame={frame}
          name={ctx.guestName}
          player="guest"
          shots={orderedShots}
          visibleCount={visibleCount}
        />
      </div>

      <div style={{ bottom: legendBottom, display: "flex", gap: 28, left: "50%", opacity: counterSpring, position: "absolute", transform: "translateX(-50%)" }}>
        <LegendSwatch color={getPlayerColor("host", darkCourt)} label={ctx.hostName} />
        <LegendSwatch color={getPlayerColor("guest", darkCourt)} label={ctx.guestName} />
        <LegendSwatch color={darkCourt.ink} label="Bright = point won" muted />
      </div>

      <InsightCallout delay={40} text={sceneInsightForStats(stats, "shotRain")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function SidePanel({ frame, name, player, shots, visibleCount }: {
  frame: number;
  name: string;
  player: "host" | "guest";
  shots: EnrichedShot[];
  visibleCount: number;
}) {
  const playerShots = shots.filter((s) => s.player === player);
  const visiblePlayerShots = playerShots.slice(0, Math.min(visibleCount, playerShots.length));
  const wonCount = visiblePlayerShots.filter((s) => shotPlayerWonPoint(s)).length;
  const winRate = visiblePlayerShots.length > 0 ? wonCount / visiblePlayerShots.length : 0;
  const accent = getPlayerColor(player, darkCourt);
  const enter = spring({ config: motionTokens.springs.snappy, delay: 20, fps: 30, frame });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center", opacity: enter, width: PANEL_W }}>
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        <div style={{ backgroundColor: accent, borderRadius: "50%", height: 12, width: 12 }} />
        <span style={{ color: darkCourt.ink, fontFamily: condensedFont, fontSize: 20, fontWeight: 700, textTransform: "uppercase" }}>{name}</span>
      </div>
      <StatRow label="Shots shown" value={`${Math.min(visibleCount, playerShots.length)}`} />
      <StatRow label="Points won" value={`${wonCount}`} />
      <StatRow label="Win rate" value={`${Math.round(winRate * 100)}%`} />
      <StatRow label="Total shots" value={`${playerShots.length}`} />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: darkCourt.inkMuted, fontFamily: bodyFont, fontSize: 14 }}>{label}</span>
      <span style={{ color: darkCourt.ink, fontFamily: condensedFont, fontSize: 24, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  muted = false,
}: {
  color: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
      <div
        style={{
          backgroundColor: color,
          borderRadius: "50%",
          height: 12,
          opacity: muted ? 0.5 : 1,
          width: 12,
        }}
      />
      <span style={{ color: darkCourt.ink, fontFamily: bodyFont, fontSize: 16 }}>{label}</span>
    </div>
  );
}

function AnimatedDots({ frame, orderedShots, visibleCount }: { frame: number; orderedShots: EnrichedShot[]; visibleCount: number }) {
  const { fps } = useVideoConfig();
  const totalShots = orderedShots.length;

  return (
    <g>
      {orderedShots.slice(0, visibleCount).map((shot, index) => {
        const color = getPlayerColor(shot.player, darkCourt);
        const wonPoint = shotPlayerWonPoint(shot);
        const appearAt = REVEAL_START + (index / totalShots) * (REVEAL_END - REVEAL_START);
        const pop = spring({
          config: { damping: 16, stiffness: 220 },
          fps,
          frame: frame - appearAt,
        });
        const isRecent = index >= visibleCount - 8;
        const baseOpacity = wonPoint ? 0.9 : 0.65;
        const opacity = isRecent ? Math.min(1, baseOpacity + 0.25 * pop) : baseOpacity;
        const radius = (isRecent ? 7 : 5) * Math.max(pop, 0.3);
        const strokeColor = wonPoint ? "#FFFFFF" : darkCourt.haloColor;

        return (
          <circle
            cx={scales.x(shot.bounceX!)}
            cy={scales.y(shot.bounceY!)}
            fill={color}
            filter={isRecent ? "url(#dot-glow)" : undefined}
            key={`${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}-${index}`}
            opacity={opacity}
            r={radius}
            stroke={strokeColor}
            strokeWidth={wonPoint ? 1 : 0.6}
          />
        );
      })}
    </g>
  );
}
