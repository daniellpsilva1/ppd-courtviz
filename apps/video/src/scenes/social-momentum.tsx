import { motionTokens } from "@ppd/tokens";
import { useMemo } from "react";
import { computeMomentum, formatRate } from "@courtviz/core";
import { MomentumChart } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

export function SocialMomentumScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = useMemo(() => getMatchStats(), []);
  const layout = verticalContentLayout(height);
  const chartW = width - layout.sidePadding * 2;
  const chartH = Math.round(layout.contentHeight * 0.6);
  const momentum = computeMomentum(ctx.momentumPoints, "host");
  const finalLead = momentum.length ? momentum[momentum.length - 1]!.cumulativeDiff : 0;
  const leader = finalLead >= 0 ? ctx.hostName : ctx.guestName;
  const leadPts = Math.abs(finalLead);
  const hostSetsWon = ctx.sets.filter((s) => s.hostScore > s.guestScore).length;
  const guestSetsWon = ctx.sets.filter((s) => s.guestScore > s.hostScore).length;
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);

  const reveal = interpolate(frame, [8, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chartSpring = spring({ config: motionTokens.springs.smooth, delay: 6, fps, frame });
  const annotSpring = spring({ config: motionTokens.springs.smooth, delay: 40, fps, frame });
  const bpPulse = interpolate(frame, [40, 50, 60], [0, 1, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BroadcastShell>
      <SceneHeader
        delay={12}
        orientation="vertical"
        subtitle={`${formatRate(stats.hostWinRate.rate)} vs ${formatRate(stats.guestWinRate.rate)} points won`}
        title="Momentum"
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          left: layout.sidePadding,
          opacity: chartSpring,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <SetBadge color={hostColor} name={ctx.hostName.split(" ").pop() ?? ""} setsWon={hostSetsWon} />
        <SetBadge color={guestColor} name={ctx.guestName.split(" ").pop() ?? ""} setsWon={guestSetsWon} />
      </div>

      <div
        style={{
          left: layout.sidePadding,
          opacity: chartSpring,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop + 56,
          transform: `translateY(${(1 - chartSpring) * 20}px)`,
        }}
      >
        <MomentumChart
          height={chartH}
          hostPlayer="host"
          points={ctx.momentumPoints}
          revealProgress={reveal}
          showBreakPoints
          showSetBoundaries
          theme={theme}
          width={chartW}
        />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
            opacity: annotSpring,
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
            <LegendDot color={hostColor} label={ctx.hostName.split(" ").pop() ?? ""} />
            <LegendDot color={guestColor} label={ctx.guestName.split(" ").pop() ?? ""} />
            <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 11, opacity: bpPulse }}>
              ● Break points
            </span>
          </div>
          <span
            style={{
              color: finalLead >= 0 ? hostColor : guestColor,
              fontFamily: condensedFont,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {leader} +{leadPts} pts
          </span>
        </div>
      </div>

      <InsightCallout delay={40} orientation="vertical" text={sceneInsightForStats(stats, "momentum")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}

function SetBadge({ color, name, setsWon }: { color: string; name: string; setsWon: number }) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 8,
      }}
    >
      <span style={{ color, fontFamily: condensedFont, fontSize: 16, fontWeight: 700, textTransform: "uppercase" }}>
        {name}
      </span>
      <span
        style={{
          backgroundColor: `${color}22`,
          border: `1px solid ${color}55`,
          borderRadius: 6,
          color,
          fontFamily: condensedFont,
          fontSize: 14,
          fontWeight: 700,
          padding: "2px 10px",
        }}
      >
        {setsWon} sets
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
      <div style={{ backgroundColor: color, borderRadius: "50%", height: 8, width: 8 }} />
      <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 11 }}>{label}</span>
    </div>
  );
}
