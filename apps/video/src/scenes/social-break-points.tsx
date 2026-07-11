import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { DuelStatRow } from "../components/duel-stat-row";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

function officialValue(stats: ReturnType<typeof getVideoMatchContext>["stats"], player: string, statName: string) {
  const row = stats?.find(
    (stat) => stat.player === player && stat.setNumber === 0 && stat.statName === statName,
  );
  return row?.statValue ?? null;
}

export function SocialBreakPointsScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const enter = spring({ config: { damping: 28, stiffness: 200 }, delay: 8, fps, frame });

  const rows = [
    {
      delay: 12,
      guestShare: officialValue(ctx.stats, "guest", "Break Point Opportunities") ?? 0,
      guestValue: String(officialValue(ctx.stats, "guest", "Break Point Opportunities") ?? "—"),
      hostShare: officialValue(ctx.stats, "host", "Break Point Opportunities") ?? 0,
      hostValue: String(officialValue(ctx.stats, "host", "Break Point Opportunities") ?? "—"),
      title: "Break Point Chances",
    },
    {
      delay: 18,
      guestShare: officialValue(ctx.stats, "guest", "Break Points Won") ?? 0,
      guestValue: String(officialValue(ctx.stats, "guest", "Break Points Won") ?? "—"),
      hostShare: officialValue(ctx.stats, "host", "Break Points Won") ?? 0,
      hostValue: String(officialValue(ctx.stats, "host", "Break Points Won") ?? "—"),
      title: "Break Points Converted",
    },
    {
      delay: 24,
      guestShare: officialValue(ctx.stats, "guest", "Break Points Saved") ?? 0,
      guestValue: String(officialValue(ctx.stats, "guest", "Break Points Saved") ?? "—"),
      hostShare: officialValue(ctx.stats, "host", "Break Points Saved") ?? 0,
      hostValue: String(officialValue(ctx.stats, "host", "Break Points Saved") ?? "—"),
      title: "Break Points Saved",
    },
  ];

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Pressure points decided the match" title="Break Point Battle" />

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
        {rows.map((row) => (
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

      <InsightCallout
        delay={30}
        orientation="vertical"
        text="Break point conversion and save rate — the clearest clutch indicator in the recap."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}
