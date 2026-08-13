import { motionTokens } from "@ppd/tokens";
import { getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { landscapeContentLayout } from "../scene-layout";

export function StatsSpotlightScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const layout = landscapeContentLayout(height);
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);
  const enter = spring({ config: motionTokens.springs.snappy, delay: 8, fps, frame });

  const hostServePct = Math.round(stats.hostServiceStats.serviceWinRate * 100);
  const guestServePct = Math.round(stats.guestServiceStats.serviceWinRate * 100);
  const hostFirstIn = stats.hostFirstServe.rate !== null ? Math.round(stats.hostFirstServe.rate * 100) : 0;
  const guestFirstIn = stats.guestFirstServe.rate !== null ? Math.round(stats.guestFirstServe.rate * 100) : 0;
  const hostShortPct = Math.round(stats.hostServiceStats.servePlusOneRate * 100);
  const guestShortPct = Math.round(stats.guestServiceStats.servePlusOneRate * 100);
  const hostBPConv = stats.hostBreakConv.total > 0 ? Math.round((stats.hostBreakConv.won / stats.hostBreakConv.total) * 100) : 0;
  const guestBPConv = stats.guestBreakConv.total > 0 ? Math.round((stats.guestBreakConv.won / stats.guestBreakConv.total) * 100) : 0;

  const contentW = Math.min(1600, width - 120);

  return (
    <BroadcastShell>
      <SceneHeader subtitle="How the match was won" title="By The Numbers" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          height: layout.contentHeight,
          justifyContent: "flex-start",
          left: "50%",
          opacity: enter,
          position: "absolute",
          top: layout.contentTop,
          transform: "translateX(-50%)",
          width: contentW,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 80, justifyContent: "center" }}>
          <RadialGauge
            color={hostColor}
            delay={14}
            frame={frame}
            fps={fps}
            label="Points Won"
            name={ctx.hostName}
            pct={hostServePct}
            size={140}
          />
          <SetChips frame={frame} fps={fps} sets={ctx.sets.map((s) => ({ guestGames: s.guestScore, hostGames: s.hostScore }))} />
          <RadialGauge
            color={guestColor}
            delay={20}
            frame={frame}
            fps={fps}
            label="Points Won"
            name={ctx.guestName}
            pct={guestServePct}
            size={140}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(4, 1fr)",
            width: "100%",
          }}
        >
          <MiniGauge color={hostColor} delay={32} frame={frame} fps={fps} guestColor={guestColor} guestLabel={ctx.guestName} guestPct={guestFirstIn} hostLabel={ctx.hostName} hostPct={hostFirstIn} title="1st Serve In" />
          <MiniGauge color={hostColor} delay={40} frame={frame} fps={fps} guestColor={guestColor} guestLabel={ctx.guestName} guestPct={guestShortPct} hostLabel={ctx.hostName} hostPct={hostShortPct} title="Short Rallies Won" />
          <MiniGauge color={hostColor} delay={48} frame={frame} fps={fps} guestColor={guestColor} guestLabel={ctx.guestName} guestPct={guestBPConv} hostLabel={ctx.hostName} hostPct={hostBPConv} title="Break Points Conv." />
          <MiniGauge color={hostColor} delay={56} frame={frame} fps={fps} guestColor={guestColor} guestLabel={ctx.guestName} guestPct={Math.round(stats.longRallyBattle.guestWon)} hostLabel={ctx.hostName} hostPct={Math.round(stats.longRallyBattle.hostWon)} title="Long Rallies (7+)" />
        </div>
      </div>

      <InsightCallout delay={60} text={sceneInsightForStats(stats, "stats")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function RadialGauge({ color, delay, frame, fps, label, name, pct, size }: {
  color: string;
  delay: number;
  frame: number;
  fps: number;
  label: string;
  name: string;
  pct: number;
  size: number;
}) {
  const progress = spring({ config: motionTokens.springs.smooth, delay, fps, frame });
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100) * progress;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ color, fontFamily: condensedFont, fontSize: 16, fontWeight: 700, textTransform: "uppercase" }}>{name}</div>
      <svg height={size} width={size}>
        <circle cx={cx} cy={cy} fill="none" r={r} stroke={`${theme.inkMuted}22`} strokeWidth={8} />
        <circle
          cx={cx}
          cy={cy}
          fill="none"
          r={r}
          stroke={color}
          strokeLinecap="round"
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text dominantBaseline="central" fill={theme.ink} fontFamily={condensedFont} fontSize={36} fontWeight={700} textAnchor="middle" x={cx} y={cy}>
          {Math.round(pct * progress)}%
        </text>
      </svg>
      <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12 }}>{label}</div>
    </div>
  );
}

function SetChips({ frame, fps, sets }: { frame: number; fps: number; sets: { guestGames: number; hostGames: number }[] }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
      {sets.map((set, i) => {
        const enter = spring({ config: motionTokens.springs.snappy, delay: 24 + i * 6, fps, frame });
        return (
          <div
            key={i}
            style={{
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              border: `1px solid ${theme.inkMuted}33`,
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              opacity: enter,
              padding: "8px 16px",
              transform: `scale(${0.8 + 0.2 * enter})`,
            }}
          >
            <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 10 }}>Set {i + 1}</span>
            <span style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 22, fontWeight: 700 }}>
              {set.hostGames}-{set.guestGames}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniGauge({ color, delay, frame, fps, guestColor, guestLabel, guestPct, hostLabel, hostPct, title }: {
  color: string;
  delay: number;
  frame: number;
  fps: number;
  guestColor: string;
  guestLabel: string;
  guestPct: number;
  hostLabel: string;
  hostPct: number;
  title: string;
}) {
  const enter = spring({ config: motionTokens.springs.snappy, delay, fps, frame });
  const barProgress = spring({ config: motionTokens.springs.smooth, delay: delay + 6, fps, frame });
  const maxPct = Math.max(hostPct, guestPct, 1);

  return (
    <div
      style={{
        alignItems: "center",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(0,0,0,0.5)",
        border: `1px solid ${theme.inkMuted}22`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity: enter,
        padding: "16px 18px",
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      <div style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {title}
      </div>
      <MiniBar color={color} label={hostLabel} pct={hostPct} progress={barProgress} maxPct={maxPct} />
      <MiniBar color={guestColor} label={guestLabel} pct={guestPct} progress={barProgress} maxPct={maxPct} />
    </div>
  );
}

function MiniBar({ color, label, maxPct, pct, progress }: {
  color: string;
  label: string;
  maxPct: number;
  pct: number;
  progress: number;
}) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8, width: "100%" }}>
      <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 10, textAlign: "right", width: 50 }}>
        {label.split(" ").slice(-1)[0]}
      </span>
      <div style={{ backgroundColor: `${theme.inkMuted}22`, borderRadius: 3, flex: 1, height: 14, overflow: "hidden" }}>
        <div style={{ backgroundColor: color, borderRadius: 3, height: "100%", width: `${(pct / maxPct) * 100 * progress}%` }} />
      </div>
      <span style={{ color, fontFamily: condensedFont, fontSize: 16, fontWeight: 700, width: 48 }}>
        {pct}{pct <= 100 ? "%" : ""}
      </span>
    </div>
  );
}
