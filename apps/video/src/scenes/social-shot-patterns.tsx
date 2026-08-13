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
import { verticalContentLayout } from "../scene-layout";

const BUCKET_LABELS = ["1–3", "4–6", "7+"];

export function SocialShotPatternsScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const hostBuckets = computeRallyBucketStats(ctx.enrichedShots, "host");
  const guestBuckets = computeRallyBucketStats(ctx.enrichedShots, "guest");
  const enter = spring({ config: motionTokens.springs.smooth, delay: 14, fps, frame });
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);

  return (
    <BroadcastShell>
      <SFXTick delay={14} />
      <SceneHeader delay={12} orientation="vertical" subtitle="Rally length win rates" title="Shot Patterns" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          height: layout.contentHeight,
          justifyContent: "center",
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <div style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 28, fontWeight: 700, textAlign: "center" }}>
          Who wins each rally length?
        </div>

        {hostBuckets.map((bucket, index) => {
          const hostPct = bucket.winRate !== null ? Math.round(bucket.winRate * 100) : 0;
          const guestPct = guestBuckets[index]?.winRate != null ? Math.round(guestBuckets[index]!.winRate * 100) : 0;
          const maxPct = Math.max(hostPct, guestPct, 1);
          return (
            <DuelRow
              delay={20 + index * 10}
              frame={frame}
              fps={fps}
              guestColor={guestColor}
              guestPct={guestPct}
              guestTotal={guestBuckets[index]?.total ?? 0}
              hostColor={hostColor}
              hostPct={hostPct}
              hostTotal={bucket.total}
              key={bucket.bucket}
              label={BUCKET_LABELS[index] ?? bucket.bucket}
              maxPct={maxPct}
            />
          );
        })}

        <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
          <LegendDot color={hostColor} label={ctx.hostName.split(" ").pop() ?? ""} />
          <LegendDot color={guestColor} label={ctx.guestName.split(" ").pop() ?? ""} />
        </div>
      </div>

      <InsightCallout
        delay={34}
        orientation="vertical"
        text="Short rallies = serve+1 tennis. Long rallies = endurance and consistency."
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}

function DuelRow({
  delay,
  frame,
  fps,
  guestColor,
  guestPct,
  guestTotal,
  hostColor,
  hostPct,
  hostTotal,
  label,
  maxPct,
}: {
  delay: number;
  frame: number;
  fps: number;
  guestColor: string;
  guestPct: number;
  guestTotal: number;
  hostColor: string;
  hostPct: number;
  hostTotal: number;
  label: string;
  maxPct: number;
}) {
  const enter = spring({ config: motionTokens.springs.snappy, delay, fps, frame });
  const barProgress = spring({ config: motionTokens.springs.smooth, delay: delay + 4, fps, frame });
  const barH = 32;
  const trackW = 380;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      <div style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 14, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label} shots
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
        <span style={{ color: hostColor, fontFamily: condensedFont, fontSize: 36, fontWeight: 700, textAlign: "right", width: 80 }}>
          {hostPct}%
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ backgroundColor: `${theme.inkMuted}22`, borderRadius: 4, height: barH, overflow: "hidden", width: trackW }}>
            <div style={{ backgroundColor: hostColor, borderRadius: 4, height: "100%", marginLeft: "auto", width: `${(hostPct / maxPct) * 100 * barProgress}%` }} />
          </div>
          <div style={{ backgroundColor: `${theme.inkMuted}22`, borderRadius: 4, height: barH, overflow: "hidden", width: trackW }}>
            <div style={{ backgroundColor: guestColor, borderRadius: 4, height: "100%", width: `${(guestPct / maxPct) * 100 * barProgress}%` }} />
          </div>
        </div>
        <span style={{ color: guestColor, fontFamily: condensedFont, fontSize: 36, fontWeight: 700, width: 80 }}>
          {guestPct}%
        </span>
      </div>
      <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 11 }}>
        {hostTotal} pts vs {guestTotal} pts
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
      <div style={{ backgroundColor: color, borderRadius: "50%", height: 10, width: 10 }} />
      <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12 }}>{label}</span>
    </div>
  );
}
