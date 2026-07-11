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
import { verticalContentLayout } from "../scene-layout";

export function SocialShotPatternsScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const hostBuckets = computeRallyBucketStats(ctx.enrichedShots, "host");
  const guestBuckets = computeRallyBucketStats(ctx.enrichedShots, "guest");
  const enter = spring({ config: { damping: 28, stiffness: 200 }, delay: 10, fps, frame });

  return (
    <BroadcastShell>
      <SFXTick delay={14} />
      <SceneHeader subtitle="Rally length win rates" title="Shot Patterns" />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 16,
          height: layout.contentHeight,
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <PatternColumn
          buckets={hostBuckets}
          color={getPlayerColor("host", theme)}
          frame={frame}
          fps={fps}
          name={ctx.hostName}
          startDelay={14}
        />
        <PatternColumn
          buckets={guestBuckets}
          color={getPlayerColor("guest", theme)}
          frame={frame}
          fps={fps}
          name={ctx.guestName}
          startDelay={20}
        />
      </div>

      <InsightCallout
        delay={34}
        orientation="vertical"
        text="Short rallies = serve+1 tennis. Long rallies = endurance and consistency — coach to the profile that wins."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}

function PatternColumn({
  buckets,
  color,
  frame,
  fps,
  name,
  startDelay,
}: {
  buckets: ReturnType<typeof computeRallyBucketStats>;
  color: string;
  frame: number;
  fps: number;
  name: string;
  startDelay: number;
}) {
  const enter = spring({ config: { damping: 28, stiffness: 200 }, delay: startDelay, fps, frame });

  return (
    <div
      style={{
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(0,0,0,0.55)",
        border: `1px solid ${color}33`,
        borderRadius: 12,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        opacity: enter,
        padding: "18px 16px",
      }}
    >
      <div
        style={{
          color,
          fontFamily: condensedFont,
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        {name}
      </div>
      {buckets.map((bucket, index) => {
        const bar = spring({
          config: { damping: 28, stiffness: 200 },
          delay: startDelay + 6 + index * 4,
          fps,
          frame,
        });
        const pct = Math.round(bucket.winRate * 100);
        const barWidth = `${pct * bar}%`;

        return (
          <div key={bucket.bucket} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 11 }}>
                {bucket.bucket}
              </span>
              <span style={{ color, fontFamily: condensedFont, fontSize: 16, fontWeight: 700 }}>
                {pct}%
              </span>
            </div>
            <div style={{ background: `${theme.inkMuted}33`, borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div
                style={{
                  background: color,
                  height: "100%",
                  width: barWidth,
                }}
              />
            </div>
            <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 10, marginTop: 3 }}>
              {bucket.total} pts
            </div>
          </div>
        );
      })}
    </div>
  );
}
