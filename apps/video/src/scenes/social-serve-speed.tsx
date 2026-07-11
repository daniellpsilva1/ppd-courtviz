import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { DuelStatRow } from "../components/duel-stat-row";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[index] ?? 0;
}

function serveSpeeds(shots: ReturnType<typeof getVideoMatchContext>["enrichedShots"], player: string) {
  return shots
    .filter((s) => s.player === player && s.stroke === "Serve" && s.speedKmh != null)
    .map((s) => s.speedKmh as number);
}

export function SocialServeSpeedScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const enter = spring({ config: { damping: 28, stiffness: 200 }, delay: 8, fps, frame });

  const hostSpeeds = serveSpeeds(ctx.enrichedShots, "host");
  const guestSpeeds = serveSpeeds(ctx.enrichedShots, "guest");

  const rows = [
    {
      delay: 12,
      guestShare: percentile(guestSpeeds, 0.5),
      guestValue: guestSpeeds.length ? `${Math.round(percentile(guestSpeeds, 0.5))} km/h` : "—",
      hostShare: percentile(hostSpeeds, 0.5),
      hostValue: hostSpeeds.length ? `${Math.round(percentile(hostSpeeds, 0.5))} km/h` : "—",
      title: "Serve Speed P50",
    },
    {
      delay: 18,
      guestShare: percentile(guestSpeeds, 0.9),
      guestValue: guestSpeeds.length ? `${Math.round(percentile(guestSpeeds, 0.9))} km/h` : "—",
      hostShare: percentile(hostSpeeds, 0.9),
      hostValue: hostSpeeds.length ? `${Math.round(percentile(hostSpeeds, 0.9))} km/h` : "—",
      title: "Serve Speed P90",
    },
    {
      delay: 24,
      guestShare: guestSpeeds.length ? Math.max(...guestSpeeds) : 0,
      guestValue: guestSpeeds.length ? `${Math.round(Math.max(...guestSpeeds))} km/h` : "—",
      hostShare: hostSpeeds.length ? Math.max(...hostSpeeds) : 0,
      hostValue: hostSpeeds.length ? `${Math.round(Math.max(...hostSpeeds))} km/h` : "—",
      title: "Max Serve Speed",
    },
  ];

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Tracked serve velocity distribution" title="Serve Speed" />

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
        text="Serve speed percentiles from tracked ball data — no on-court label clutter."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}
