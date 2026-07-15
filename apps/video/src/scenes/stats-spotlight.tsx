import { DuelStatRow } from "../components/duel-stat-row";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { getVideoMatchContext } from "../match-data";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { landscapeContentLayout } from "../scene-layout";

export function StatsSpotlightScene() {
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const layout = landscapeContentLayout(1080);

  return (
    <BroadcastShell>
      <SceneHeader subtitle="How the match was won" title="By The Numbers" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          height: layout.contentHeight,
          justifyContent: "space-evenly",
          left: "50%",
          position: "absolute",
          top: layout.contentTop,
          transform: "translateX(-50%)",
          width: 1000,
        }}
      >
        <DuelStatRow
          delay={8}
          guestLabel={ctx.guestName}
          guestShare={stats.guestServiceStats.serviceWinRate}
          guestValue={`${Math.round(stats.guestServiceStats.serviceWinRate * 100)}%`}
          hostLabel={ctx.hostName}
          hostShare={stats.hostServiceStats.serviceWinRate}
          hostValue={`${Math.round(stats.hostServiceStats.serviceWinRate * 100)}%`}
          title="Service Points Won"
        />
        <DuelStatRow
          delay={20}
          guestLabel={ctx.guestName}
          guestShare={stats.guestServiceStats.servePlusOneRate}
          guestValue={`${Math.round(stats.guestServiceStats.servePlusOneRate * 100)}%`}
          hostLabel={ctx.hostName}
          hostShare={stats.hostServiceStats.servePlusOneRate}
          hostValue={`${Math.round(stats.hostServiceStats.servePlusOneRate * 100)}%`}
          title="Short Rallies Won (1-3)"
        />
        <DuelStatRow
          delay={32}
          guestLabel={ctx.guestName}
          guestShare={stats.longRallyBattle.guestWon}
          guestValue={`${stats.longRallyBattle.guestWon}`}
          hostLabel={ctx.hostName}
          hostShare={stats.longRallyBattle.hostWon}
          hostValue={`${stats.longRallyBattle.hostWon}`}
          title="Long Rallies (7+)"
        />
        <DuelStatRow
          delay={44}
          guestLabel={ctx.guestName}
          guestShare={stats.guestFirstServe.rate}
          guestValue={`${Math.round(stats.guestFirstServe.rate * 100)}%`}
          hostLabel={ctx.hostName}
          hostShare={stats.hostFirstServe.rate}
          hostValue={`${Math.round(stats.hostFirstServe.rate * 100)}%`}
          title="First Serve In"
        />
      </div>

      <InsightCallout delay={50} text={sceneInsightForStats(stats, "stats")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}
