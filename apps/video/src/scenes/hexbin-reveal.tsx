import { motionTokens } from "@ppd/tokens";
import { Court } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import type { ZoneWinRate } from "@courtviz/core";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { BroadcastShell } from "../components/broadcast-shell";
import { CourtCard } from "../components/court-card";
import { CourtZoom } from "../components/court-zoom";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SCENE_DURATIONS } from "../constants";
import {
  buildPlayerHexbins,
  darkCourt,
  darkStops,
  defaultCourtScales,
  getEfficiencyColor,
  sharedEfficiencyDomain,
} from "../court-viz-utils";
import { condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { chromeOffsets, landscapeContentLayout } from "../scene-layout";

const HEX_OPTS = { minCount: 1, sizeRange: [0.3, 0.8] as [number, number] };

const COURT_W = 540;
const COURT_H = 560;
const GAP = 40;
const CHIP_W = 108;

const hostScales = defaultCourtScales(COURT_W, COURT_H, "near");
const guestScales = defaultCourtScales(COURT_W, COURT_H, "near");

export function HexbinRevealScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const layout = landscapeContentLayout(height);

  const hostHexbins = buildPlayerHexbins(ctx.enrichedShots, "host", "near", HEX_OPTS);
  const guestHexbins = buildPlayerHexbins(ctx.enrichedShots, "guest", "near", HEX_OPTS);
  const efficiencyDomain = sharedEfficiencyDomain([hostHexbins, guestHexbins]);
  const maxCount = Math.max(
    ...hostHexbins.map((h) => h.count),
    ...guestHexbins.map((h) => h.count),
    1,
  );
  const TOTAL_W = CHIP_W + COURT_W + GAP + COURT_W + GAP + CHIP_W;
  const LEFT = (width - TOTAL_W) / 2;
  const { legendBottom } = chromeOffsets("landscape");

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Size = frequency · color = win rate" title="Court Dominance" />

      <div style={{ left: LEFT, position: "absolute", top: layout.contentTop }}>
        <CourtZoom durationInFrames={SCENE_DURATIONS.hexbinReveal}>
          <div style={{ alignItems: "flex-start", display: "flex", gap: GAP }}>
            <ZoneChips accentColor={getPlayerColor("host", darkCourt)} zones={stats.hostZones} />
            <PlayerPanel
              color={getPlayerColor("host", darkCourt)}
              efficiencyDomain={efficiencyDomain}
              frame={frame}
              fps={fps}
              hexbins={hostHexbins}
              name={ctx.hostName}
              scales={hostScales}
              sideDelay={12}
            />
            <PlayerPanel
              color={getPlayerColor("guest", darkCourt)}
              efficiencyDomain={efficiencyDomain}
              frame={frame}
              fps={fps}
              hexbins={guestHexbins}
              name={ctx.guestName}
              scales={guestScales}
              sideDelay={28}
            />
            <ZoneChips accentColor={getPlayerColor("guest", darkCourt)} zones={stats.guestZones} />
          </div>
        </CourtZoom>
      </div>

      <div style={{ bottom: legendBottom, display: "flex", gap: 60, left: "50%", opacity: spring({ config: motionTokens.springs.snappy, delay: 40, fps, frame }), position: "absolute", transform: "translateX(-50%)" }}>
        <LegendBar maxCount={maxCount} />
      </div>

      <InsightCallout delay={50} text={sceneInsightForStats(stats, "hexbin")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function zoneRate(zones: ZoneWinRate[], side: "deuce" | "ad"): number | null {
  const matching = zones.filter((z) => z.zone.startsWith(`${side}_`));
  const total = matching.reduce((sum, z) => sum + z.total, 0);
  const won = matching.reduce((sum, z) => sum + z.won, 0);
  if (total < 3) return null;
  return won / total;
}

function ZoneChips({ accentColor, zones }: { accentColor: string; zones: ZoneWinRate[] }) {
  const deuceRate = zoneRate(zones, "deuce");
  const adRate = zoneRate(zones, "ad");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 72, width: CHIP_W }}>
      {deuceRate != null ? (
        <ZoneChip accentColor={accentColor} label="Deuce" value={`${Math.round(deuceRate * 100)}%`} />
      ) : null}
      {adRate != null ? (
        <ZoneChip accentColor={accentColor} label="Ad" value={`${Math.round(adRate * 100)}%`} />
      ) : null}
    </div>
  );
}

function ZoneChip({
  accentColor,
  label,
  value,
}: {
  accentColor: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        border: `1px solid ${accentColor}44`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          color: darkCourt.inkMuted,
          fontFamily: condensedFont,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: accentColor,
          fontFamily: condensedFont,
          fontSize: 22,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PlayerPanel({
  color,
  efficiencyDomain,
  frame,
  fps,
  hexbins,
  name,
  scales,
  sideDelay,
}: {
  color: string;
  efficiencyDomain: { vmin: number; vmax: number };
  frame: number;
  fps: number;
  hexbins: ReturnType<typeof buildPlayerHexbins>;
  name: string;
  scales: ReturnType<typeof defaultCourtScales>;
  sideDelay: number;
}) {
  const labelSpring = spring({
    config: motionTokens.springs.snappy,
    delay: sideDelay,
    fps,
    frame,
  });

  const sortedHexbins = [...hexbins].sort((a, b) => a.count - b.count);
  const labeledKeys = new Set<string>();
  const placed: Array<{ cx: number; cy: number; r: number }> = [];
  for (const hex of [...hexbins].sort((a, b) => b.count - a.count)) {
    const cx = scales.x(hex.cx);
    const cy = scales.y(hex.cy);
    const r = Math.sqrt(
      (scales.x(hex.vertices[0]![0]) - cx) ** 2 +
      (scales.y(hex.vertices[0]![1]) - cy) ** 2,
    );
    if (hex.count < 6 || r < 14) continue;
    const labelR = r * 0.45;
    const collides = placed.some((p) => Math.hypot(p.cx - cx, p.cy - cy) < p.r + labelR + 4);
    if (!collides) {
      placed.push({ cx, cy, r: labelR });
      labeledKeys.add(`${hex.cx},${hex.cy}`);
    }
  }

  const colorT = (value: number) => {
    const span = Math.max(0.001, efficiencyDomain.vmax - efficiencyDomain.vmin);
    const t = (value - efficiencyDomain.vmin) / span;
    return getEfficiencyColor(t, true);
  };

  return (
    <CourtCard accentColor={color} label={name} labelOpacity={labelSpring}>
      <Court half="near" height={COURT_H} surface={BRAND_SURFACE} theme={darkCourt} width={COURT_W}>
        {sortedHexbins.map((hex, index) => {
          const progress = spring({
            config: motionTokens.springs.snappy,
            delay: sideDelay + index * 2,
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
            <g key={index} opacity={progress}>
              <polygon
                fill={colorT(hex.value)}
                opacity={0.9}
                points={points}
                stroke={darkCourt.ink}
                strokeWidth={0.5}
              />
              {labeledKeys.has(`${hex.cx},${hex.cy}`) && progress > 0.85 ? (
                <text
                  dominantBaseline="middle"
                  fill={darkCourt.haloColor}
                  fontFamily={condensedFont}
                  fontSize={11}
                  fontWeight={700}
                  textAnchor="middle"
                  x={cx}
                  y={cy}
                >
                  {hex.count}
                </text>
              ) : null}
            </g>
          );
        })}
      </Court>
    </CourtCard>
  );
}

function LegendBar({ maxCount }: { maxCount: number }) {
  return (
    <>
      <svg height={36} width={200}>
        <defs>
          <linearGradient id="hex-eff-grad" x1="0%" x2="100%" y1="0%" y2="0%">
            {darkStops.map(([offset, color], i) => (
              <stop key={i} offset={`${offset * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <rect fill="url(#hex-eff-grad)" height={10} rx={2} width={180} x={10} y={0} />
        <text fill={darkCourt.inkMuted} fontSize={10} x={10} y={26}>
          Cold
        </text>
        <text fill={darkCourt.inkMuted} fontSize={10} textAnchor="end" x={190} y={26}>
          Hot
        </text>
      </svg>
      <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
        <span style={{ color: darkCourt.inkMuted, fontFamily: condensedFont, fontSize: 12 }}>Frequency</span>
        <svg height={26} width={80}>
          <circle cx={10} cy={13} fill={darkCourt.playerHost} opacity={0.5} r={5} />
          <circle cx={40} cy={13} fill={darkCourt.playerHost} r={9} />
          <circle cx={70} cy={13} fill={darkCourt.playerHost} r={13} />
        </svg>
        <span style={{ color: darkCourt.inkMuted, fontFamily: condensedFont, fontSize: 10, marginLeft: 4 }}>max {maxCount}</span>
      </div>
    </>
  );
}
