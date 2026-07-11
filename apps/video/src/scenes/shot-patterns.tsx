import { computeRallyBucketStats } from "@courtviz/core";
import { getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SFXTick } from "../components/sfx-cues";
import { theme } from "../court-viz-utils";
import { condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";

export function ShotPatternsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const hostBuckets = computeRallyBucketStats(ctx.enrichedShots, "host");
  const guestBuckets = computeRallyBucketStats(ctx.enrichedShots, "guest");
  const enter = spring({ config: { damping: 200 }, delay: 10, fps, frame });

  return (
    <BroadcastShell>
      <SFXTick delay={14} />
      <SceneHeader subtitle="Win rate by rally length" title="Shot Patterns" />

      <div
        style={{
          display: "flex",
          gap: 48,
          justifyContent: "center",
          left: 0,
          opacity: enter,
          position: "absolute",
          right: 0,
          top: 220,
        }}
      >
        <BucketPanel
          buckets={hostBuckets}
          color={getPlayerColor("host", theme)}
          frame={frame}
          fps={fps}
          name={ctx.hostName}
          startDelay={14}
        />
        <BucketPanel
          buckets={guestBuckets}
          color={getPlayerColor("guest", theme)}
          frame={frame}
          fps={fps}
          name={ctx.guestName}
          startDelay={24}
        />
      </div>

      <InsightCallout
        delay={50}
        text="Coach to the rally length where your player wins — shorten or extend exchanges deliberately."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function BucketPanel({
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
  const enter = spring({ config: { damping: 200 }, delay: startDelay, fps, frame });

  return (
    <div
      style={{
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(0,0,0,0.55)",
        border: `1px solid ${color}33`,
        borderRadius: 12,
        minWidth: 420,
        opacity: enter,
        padding: "24px 28px",
      }}
    >
      <div
        style={{
          color,
          fontFamily: condensedFont,
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 18,
          textTransform: "uppercase",
        }}
      >
        {name}
      </div>
      {buckets.map((bucket, index) => {
        const bar = spring({
          config: { damping: 200 },
          delay: startDelay + 8 + index * 6,
          fps,
          frame,
        });
        return (
          <div key={bucket.bucket} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 14 }}>
                {bucket.bucket} shots
              </span>
              <span style={{ color, fontFamily: condensedFont, fontSize: 28, fontWeight: 700 }}>
                {Math.round(bucket.winRate * 100)}%
              </span>
            </div>
            <div style={{ background: `${theme.inkMuted}33`, borderRadius: 4, height: 10, overflow: "hidden" }}>
              <div
                style={{
                  background: color,
                  height: "100%",
                  transform: `scaleX(${bar})`,
                  transformOrigin: "left",
                  width: "100%",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
