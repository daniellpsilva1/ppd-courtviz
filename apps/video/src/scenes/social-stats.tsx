import { formatRate } from "@courtviz/core";
import { motionTokens } from "@ppd/tokens";
import { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { DuelStatRow } from "../components/duel-stat-row";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

export function SocialStatsScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = useMemo(() => getMatchStats(), []);
  const layout = verticalContentLayout(height);
  const enter = spring({ config: motionTokens.springs.smooth, delay: 8, fps, frame });

  const statRows = [
    {
      delay: 12,
      guestShare: stats.guestServiceStats.serviceWinRate,
      guestValue: `${Math.round(stats.guestServiceStats.serviceWinRate * 100)}%`,
      hostShare: stats.hostServiceStats.serviceWinRate,
      hostValue: `${Math.round(stats.hostServiceStats.serviceWinRate * 100)}%`,
      title: "Service Points Won",
    },
    {
      delay: 20,
      guestShare: stats.guestFirstServe.rate ?? 0,
      guestValue: formatRate(stats.guestFirstServe.rate),
      hostShare: stats.hostFirstServe.rate ?? 0,
      hostValue: formatRate(stats.hostFirstServe.rate),
      title: "First Serve In",
    },
    {
      delay: 28,
      guestShare: stats.guestBreakConv.rate ?? 0,
      guestValue: formatRate(stats.guestBreakConv.rate),
      hostShare: stats.hostBreakConv.rate ?? 0,
      hostValue: formatRate(stats.hostBreakConv.rate),
      title: "Break Points Converted",
    },
    {
      delay: 36,
      guestShare: stats.guestWinRate.rate ?? 0,
      guestValue: formatRate(stats.guestWinRate.rate),
      hostShare: stats.hostWinRate.rate ?? 0,
      hostValue: formatRate(stats.hostWinRate.rate),
      title: "Total Points Won",
    },
  ];

  return (
    <BroadcastShell variant="social">
      <SceneHeader delay={12} orientation="vertical" subtitle="How the match was won" title="Key Stats" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          height: layout.contentHeight,
          justifyContent: "space-evenly",
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        {statRows.map((row) => (
          <DuelStatRow
            key={row.title}
            delay={row.delay}
            guestLabel={ctx.guestName}
            guestShare={row.guestShare}
            guestValue={row.guestValue}
            hostLabel={ctx.hostName}
            hostShare={row.hostShare}
            hostValue={row.hostValue}
            title={row.title}
          />
        ))}
      </div>

      <InsightCallout delay={30} orientation="vertical" text={sceneInsightForStats(stats, "stats")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}
