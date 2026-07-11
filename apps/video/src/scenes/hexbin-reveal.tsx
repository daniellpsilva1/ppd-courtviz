import { enrichedShots, guestName, hostName } from "@courtviz/data/fixtures";
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
import { guestZones, hostZones, sceneInsight } from "../match-stats";

const HEX_OPTS = { minCount: 1, sizeRange: [0.3, 0.8] as [number, number] };

const COURT_W = 540;
const COURT_H = 560;
const GAP = 40;
const CHIP_W = 108;
const LEGEND_W = 148;
const TOTAL_W = CHIP_W + COURT_W + GAP + COURT_W + GAP + CHIP_W + GAP + LEGEND_W;
const LEFT = (1920 - TOTAL_W) / 2;
const TOP = 200;

const hostHexbins = buildPlayerHexbins(enrichedShots, "host", "near", HEX_OPTS);
const guestHexbins = buildPlayerHexbins(enrichedShots, "guest", "near", HEX_OPTS);
const efficiencyDomain = sharedEfficiencyDomain([hostHexbins, guestHexbins]);
const hostScales = defaultCourtScales(COURT_W, COURT_H, "near");
const guestScales = defaultCourtScales(COURT_W, COURT_H, "near");
const maxCount = Math.max(
  ...hostHexbins.map((h) => h.count),
  ...guestHexbins.map((h) => h.count),
  1,
);

export function HexbinRevealScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Size = frequency · color = win rate" title="Court Dominance" />

      <div style={{ left: LEFT, position: "absolute", top: TOP }}>
        <CourtZoom durationInFrames={SCENE_DURATIONS.hexbinReveal}>
          <div style={{ alignItems: "flex-start", display: "flex", gap: GAP }}>
            <ZoneChips accentColor={getPlayerColor("host", darkCourt)} zones={hostZones} />
            <PlayerPanel
              color={getPlayerColor("host", darkCourt)}
              efficiencyDomain={efficiencyDomain}
              frame={frame}
              fps={fps}
              hexbins={hostHexbins}
              name={hostName}
              scales={hostScales}
              sideDelay={12}
            />
            <PlayerPanel
              color={getPlayerColor("guest", darkCourt)}
              efficiencyDomain={efficiencyDomain}
              frame={frame}
              fps={fps}
              hexbins={guestHexbins}
              name={guestName}
              scales={guestScales}
              sideDelay={28}
            />
            <ZoneChips accentColor={getPlayerColor("guest", darkCourt)} zones={guestZones} />
            <LegendBar />
          </div>
        </CourtZoom>
      </div>

      <InsightCallout delay={50} text={sceneInsight("hexbin")} />
      <MatchScoreBar guestName={guestName} hostName={hostName} />
    </BroadcastShell>
  );
}

function zoneRate(zones: ZoneWinRate[], side: "deuce" | "ad"): number | null {
  const match = zones.find((zone) => zone.zone.toLowerCase().includes(side));
  if (!match || match.total < 3) return null;
  return match.winRate;
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
    config: { damping: 200 },
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
            config: { damping: 200 },
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

function LegendBar() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingTop: 72,
        width: LEGEND_W,
      }}
    >
      <svg height={120} width={LEGEND_W}>
        <defs>
          <linearGradient id="hex-eff-grad" x1="0%" x2="0%" y1="0%" y2="100%">
            {darkStops.map(([offset, color], i) => (
              <stop key={i} offset={`${offset * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <text fill={darkCourt.ink} fontSize={12} textAnchor="middle" x={LEGEND_W / 2} y={12}>
          Win rate
        </text>
        <rect fill="url(#hex-eff-grad)" height={72} rx={3} width={14} x={18} y={20} />
        <text fill={darkCourt.inkMuted} fontSize={10} x={38} y={28}>
          Hot
        </text>
        <text fill={darkCourt.inkMuted} fontSize={10} x={38} y={88}>
          Cold
        </text>
      </svg>
      <svg height={100} width={LEGEND_W}>
        <text fill={darkCourt.ink} fontSize={12} textAnchor="middle" x={LEGEND_W / 2} y={12}>
          Frequency
        </text>
        <circle cx={28} cy={52} fill={darkCourt.playerHost} opacity={0.5} r={5} />
        <circle cx={58} cy={52} fill={darkCourt.playerHost} r={9} />
        <circle cx={96} cy={52} fill={darkCourt.playerHost} r={13} />
        <text fill={darkCourt.inkMuted} fontSize={10} textAnchor="middle" x={LEGEND_W / 2} y={86}>
          max {maxCount}
        </text>
      </svg>
    </div>
  );
}
