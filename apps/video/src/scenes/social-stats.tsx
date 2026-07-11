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
  const enter = spring({ config: { damping: 28, stiffness: 200 }, delay: 8, fps, frame });

  const hostTopZoneRate =
    stats.hostZones
      .filter((zone) => zone.total >= 5)
      .sort((a, b) => b.winRate - a.winRate)[0]?.winRate ?? 0;
  const guestTopZoneRate =
    stats.guestZones
      .filter((zone) => zone.total >= 5)
      .sort((a, b) => b.winRate - a.winRate)[0]?.winRate ?? 0;

  const longTotal = Math.max(stats.longRallyBattle.hostWon + stats.longRallyBattle.guestWon, 1);

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
      delay: 18,
      guestShare: stats.guestServiceStats.servePlusOneRate,
      guestValue: `${Math.round(stats.guestServiceStats.servePlusOneRate * 100)}%`,
      hostShare: stats.hostServiceStats.servePlusOneRate,
      hostValue: `${Math.round(stats.hostServiceStats.servePlusOneRate * 100)}%`,
      title: "Serve +1",
    },
    {
      delay: 24,
      guestShare: stats.longRallyBattle.guestWon / longTotal,
      guestValue: `${Math.round((stats.longRallyBattle.guestWon / longTotal) * 100)}%`,
      hostShare: stats.longRallyBattle.hostWon / longTotal,
      hostValue: `${Math.round((stats.longRallyBattle.hostWon / longTotal) * 100)}%`,
      title: "Long Rallies Won (7+)",
    },
    {
      delay: 30,
      guestShare: stats.guestFirstServe.rate,
      guestValue: `${Math.round(stats.guestFirstServe.rate * 100)}%`,
      hostShare: stats.hostFirstServe.rate,
      hostValue: `${Math.round(stats.hostFirstServe.rate * 100)}%`,
      title: "First Serve In",
    },
    {
      delay: 36,
      guestShare: stats.guestBreakConv.rate,
      guestValue: `${Math.round(stats.guestBreakConv.rate * 100)}%`,
      hostShare: stats.hostBreakConv.rate,
      hostValue: `${Math.round(stats.hostBreakConv.rate * 100)}%`,
      title: "Break Points Converted (Return)",
    },
    {
      delay: 42,
      guestShare: guestTopZoneRate,
      guestValue: `${Math.round(guestTopZoneRate * 100)}%`,
      hostShare: hostTopZoneRate,
      hostValue: `${Math.round(hostTopZoneRate * 100)}%`,
      title: "Top Zone Win Rate",
    },
  ];

  return (
    <BroadcastShell>
      <SceneHeader subtitle="How the match was won" title="Key Stats" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: layout.contentHeight,
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
