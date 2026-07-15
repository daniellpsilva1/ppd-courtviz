import { motionTokens } from "@ppd/tokens";
import { useMemo } from "react";
import { computeMomentum } from "@courtviz/core";
import { MomentumChart } from "@courtviz/react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PPD } from "../ppd-tokens";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { theme } from "../court-viz-utils";
import { condensedFont } from "../fonts";
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
  const chartH = Math.max(180, layout.contentHeight - 64);
  const momentum = computeMomentum(ctx.momentumPoints, "host");
  const finalLead = momentum.length ? momentum[momentum.length - 1]!.cumulativeDiff : 0;
  const leader = finalLead >= 0 ? ctx.hostName : ctx.guestName;
  const leadPts = Math.abs(finalLead);

  const reveal = interpolate(frame, [8, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chartSpring = spring({ config: motionTokens.springs.smooth, delay: 6, fps, frame });
  const annotSpring = spring({ config: motionTokens.springs.smooth, delay: 40, fps, frame });

  return (
    <BroadcastShell>
      <SceneHeader
        subtitle={`${Math.round(stats.hostWinRate.rate * 100)}% vs ${Math.round(stats.guestWinRate.rate * 100)}% points won`}
        title="Momentum"
      />

      <div
        style={{
          left: layout.sidePadding,
          opacity: reveal * chartSpring,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
          transform: `translateY(${(1 - chartSpring) * 20}px)`,
        }}
      >
        <MomentumChart
          height={chartH}
          hostPlayer="host"
          points={ctx.momentumPoints}
          showBreakPoints
          showSetBoundaries
          theme={theme}
          width={chartW}
        />
        <div
          style={{
            marginTop: 16,
            opacity: annotSpring,
            textAlign: "center",
          }}
        >
          <span
            style={{
              color: PPD.primary,
              fontFamily: condensedFont,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {leader} finished +{leadPts} pts
          </span>
        </div>
      </div>

      <InsightCallout delay={80} orientation="vertical" text={sceneInsightForStats(stats, "momentum")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}
