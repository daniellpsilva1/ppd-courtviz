import { motionTokens } from "@ppd/tokens";
import { computeRallyBucketStats } from "@courtviz/core";
import { getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SFXTick } from "../components/sfx-cues";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { landscapeContentLayout } from "../scene-layout";

const BUCKET_LABELS: Record<string, string> = {
  short: "Short (1-3)",
  medium: "Medium (4-6)",
  long: "Long (7+)",
};

export function ShotPatternsScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = landscapeContentLayout(height);
  const hostBuckets = computeRallyBucketStats(ctx.enrichedShots, "host");
  const guestBuckets = computeRallyBucketStats(ctx.enrichedShots, "guest");
  const enter = spring({ config: motionTokens.springs.snappy, delay: 10, fps, frame });
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);

  const allBuckets = hostBuckets.length >= guestBuckets.length ? hostBuckets : guestBuckets;
  const chartW = Math.min(1200, width - 160);
  const barH = 32;
  const barGap = 6;
  const groupGap = 28;
  const labelW = 140;
  const valueW = 80;
  const trackW = chartW - labelW - valueW * 2 - 48;

  return (
    <BroadcastShell>
      <SFXTick delay={14} />
      <SceneHeader subtitle="Win rate by rally length" title="Shot Patterns" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          left: "50%",
          opacity: enter,
          position: "absolute",
          top: layout.contentTop,
          transform: "translateX(-50%)",
          width: chartW,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 32, marginBottom: 4 }}>
          <LegendDot color={hostColor} label={ctx.hostName} />
          <LegendDot color={guestColor} label={ctx.guestName} />
        </div>

        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0,0,0,0.55)",
            border: `1px solid ${theme.inkMuted}33`,
            borderRadius: 12,
            padding: "28px 32px",
            width: "100%",
          }}
        >
          {allBuckets.map((bucket, index) => {
            const hostData = hostBuckets.find((b) => b.bucket === bucket.bucket);
            const guestData = guestBuckets.find((b) => b.bucket === bucket.bucket);
            const groupEnter = spring({
              config: motionTokens.springs.snappy,
              delay: 14 + index * 10,
              fps,
              frame,
            });
            const hostPct = hostData ? (hostData.winRate !== null ? Math.round(hostData.winRate * 100) : 0) : 0;
            const guestPct = guestData ? (guestData.winRate !== null ? Math.round(guestData.winRate * 100) : 0) : 0;

            return (
              <div
                key={bucket.bucket}
                style={{
                  marginBottom: index < allBuckets.length - 1 ? groupGap : 0,
                  opacity: groupEnter,
                  transform: `translateY(${(1 - groupEnter) * 12}px)`,
                }}
              >
                <div style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 16, fontWeight: 600, marginBottom: barGap + 2, textTransform: "uppercase" }}>
                  {BUCKET_LABELS[bucket.bucket] ?? bucket.bucket}
                </div>
                <DuelBar
                  barH={barH}
                  color={hostColor}
                  label={ctx.hostName}
                  pct={hostPct}
                  springVal={spring({ config: motionTokens.springs.snappy, delay: 18 + index * 10, fps, frame })}
                  total={hostData?.total ?? 0}
                  trackW={trackW}
                />
                <DuelBar
                  barH={barH}
                  color={guestColor}
                  label={ctx.guestName}
                  pct={guestPct}
                  springVal={spring({ config: motionTokens.springs.snappy, delay: 24 + index * 10, fps, frame })}
                  total={guestData?.total ?? 0}
                  trackW={trackW}
                />
              </div>
            );
          })}
        </div>
      </div>

      <InsightCallout
        delay={50}
        text="Coach to the rally length where your player wins — shorten or extend exchanges deliberately."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
      <div style={{ backgroundColor: color, borderRadius: "50%", height: 10, width: 10 }} />
      <span style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 14, fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function DuelBar({ barH, color, label, pct, springVal, total, trackW }: {
  barH: number;
  color: string;
  label: string;
  pct: number;
  springVal: number;
  total: number;
  trackW: number;
}) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 12, marginBottom: 6 }}>
      <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12, textAlign: "right", width: 80 }}>
        {label.split(" ").slice(-1)[0]}
      </span>
      <div style={{ backgroundColor: `${theme.inkMuted}22`, borderRadius: 4, height: barH, overflow: "hidden", width: trackW }}>
        <div
          style={{
            backgroundColor: color,
            borderRadius: 4,
            height: "100%",
            width: `${pct * springVal}%`,
          }}
        />
      </div>
      <span style={{ color, fontFamily: condensedFont, fontSize: 22, fontWeight: 700, width: 60 }}>
        {pct}%
      </span>
      <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 11, width: 50 }}>
        {total} pts
      </span>
    </div>
  );
}
