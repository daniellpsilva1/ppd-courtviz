import { motionTokens } from "@ppd/tokens";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { useSceneTheme } from "../components/scene-theme-context";
import { bodyFont, condensedFont } from "../fonts";
import { getMatchStats } from "../match-stats";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

export function SocialClutchSpeedScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = useMemo(() => getMatchStats(), []);
  const layout = verticalContentLayout(height);
  const theme = useSceneTheme();
  const enter = spring({ config: motionTokens.springs.smooth, delay: 8, fps, frame });
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);

  const hostBP = stats.hostBreakConv;
  const guestBP = stats.guestBreakConv;
  const hostPct = hostBP.total > 0 ? hostBP.won / hostBP.total : 0;
  const guestPct = guestBP.total > 0 ? guestBP.won / guestBP.total : 0;

  const { bins, maxBin, speedMax, speedMin } = useMemo(() => {
    const speeds = ctx.enrichedShots
      .filter((s) => s.speedKmh != null && s.speedKmh > 0)
      .map((s) => s.speedKmh as number);
    const sMin = Math.floor(Math.min(...speeds, 80) / 10) * 10;
    const sMax = Math.ceil(Math.max(...speeds, 200) / 10) * 10;
    const binCount = 8;
    const binSize = (sMax - sMin) / binCount;
    const computedBins = Array.from({ length: binCount }, (_, i) => {
      const lo = sMin + i * binSize;
      const hi = lo + binSize;
      return { count: speeds.filter((s) => s >= lo && s < hi).length, hi, lo };
    });
    const mBin = Math.max(...computedBins.map((b) => b.count), 1);
    return { bins: computedBins, maxBin: mBin, speedMax: sMax, speedMin: sMin };
  }, [ctx.enrichedShots]);

  const funnelProgress = interpolate(frame, [12, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const speedProgress = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BroadcastShell variant="social">
      <SceneHeader delay={12} orientation="vertical" subtitle="Pressure & power" title="Clutch & Speed" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          height: layout.contentHeight,
          justifyContent: "center",
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <div style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 24, fontWeight: 700, textAlign: "center" }}>
          Break Point Conversion
        </div>

        <div style={{ display: "flex", gap: 48 }}>
          <BPFunnel
            color={hostColor}
            label={ctx.hostName.split(" ").pop() ?? ""}
            pct={hostPct}
            progress={funnelProgress}
            total={hostBP.total}
            won={hostBP.won}
          />
          <BPFunnel
            color={guestColor}
            label={ctx.guestName.split(" ").pop() ?? ""}
            pct={guestPct}
            progress={funnelProgress}
            total={guestBP.total}
            won={guestBP.won}
          />
        </div>

        <div style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 24, fontWeight: 700, marginTop: 8, textAlign: "center" }}>
          Serve Speed Distribution
        </div>

        <SpeedStrip
          bins={bins}
          color={hostColor}
          maxBin={maxBin}
          progress={speedProgress}
          speedMax={speedMax}
          speedMin={speedMin}
          stripW={width - layout.sidePadding * 2 - 40}
        />
      </div>

      <InsightCallout
        delay={36}
        orientation="vertical"
        text="Break point conversion and serve velocity — the clutch and power story."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}

function BPFunnel({
  color,
  label,
  pct,
  progress,
  total,
  won,
}: {
  color: string;
  label: string;
  pct: number;
  progress: number;
  total: number;
  won: number;
}) {
  const theme = useSceneTheme();
  const r = 50;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct * progress;
  return (
    <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 8 }}>
      <svg height={130} width={130}>
        <circle cx={65} cy={65} fill="none" r={r} stroke={`${theme.inkMuted}22`} strokeWidth={8} />
        <circle
          cx={65}
          cy={65}
          fill="none"
          r={r}
          stroke={color}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          strokeWidth={8}
          transform="rotate(-90 65 65)"
        />
        <text dominantBaseline="central" fill={color} fontFamily={condensedFont} fontSize={28} fontWeight={700} textAnchor="middle" x={65} y={60}>
          {Math.round(pct * 100 * progress)}%
        </text>
        <text dominantBaseline="central" fill={theme.inkMuted} fontFamily={bodyFont} fontSize={10} textAnchor="middle" x={65} y={85}>
          {won}/{total} converted
        </text>
      </svg>
      <span style={{ color, fontFamily: condensedFont, fontSize: 16, fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

function SpeedStrip({
  bins,
  color,
  maxBin,
  progress,
  speedMax,
  speedMin,
  stripW,
}: {
  bins: Array<{ count: number; hi: number; lo: number }>;
  color: string;
  maxBin: number;
  progress: number;
  speedMax: number;
  speedMin: number;
  stripW: number;
}) {
  const theme = useSceneTheme();
  const stripH = 100;
  const barW = stripW / bins.length;
  const gap = 4;
  const actualBarW = barW - gap;

  return (
    <svg height={stripH + 30} width={stripW}>
      {bins.map((bin, i) => {
        const barH = (bin.count / maxBin) * stripH * progress;
        const x = i * barW + gap / 2;
        const y = stripH - barH;
        return (
          <g key={i}>
            <rect fill={`${theme.inkMuted}22`} height={stripH} rx={3} width={actualBarW} x={x} y={0} />
            <rect fill={color} height={barH} rx={3} width={actualBarW} x={x} y={y} />
            <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={9} textAnchor="middle" x={x + actualBarW / 2} y={stripH + 14}>
              {Math.round(bin.lo)}
            </text>
          </g>
        );
      })}
      <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={10} textAnchor="start" x={0} y={stripH + 26}>
        km/h
      </text>
      <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={9} textAnchor="end" x={stripW} y={stripH + 26}>
        {speedMin}–{speedMax}
      </text>
    </svg>
  );
}
