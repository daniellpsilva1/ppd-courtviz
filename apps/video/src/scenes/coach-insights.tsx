import { motionTokens } from "@ppd/tokens";
import { generateCoachInsights } from "@ppd/brand";
import { getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SFXImpact } from "../components/sfx-cues";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { landscapeContentLayout } from "../scene-layout";

export function CoachInsightsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = landscapeContentLayout(1080);
  const insights = generateCoachInsights(
    {
      enrichedShots: ctx.enrichedShots,
      guestName: ctx.guestName,
      hostName: ctx.hostName,
      points: ctx.points,
    },
    3,
  );
  const enter = spring({ config: motionTokens.springs.snappy, delay: 10, fps, frame });

  return (
    <BroadcastShell>
      <SFXImpact delay={12} />
      <SceneHeader subtitle="Three priorities for practice" title="Coach Insights" />

      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(3, 1fr)",
          left: 80,
          opacity: enter,
          position: "absolute",
          right: 80,
          top: layout.contentTop,
        }}
      >
        {insights.map((insight, index) => {
          const itemEnter = spring({
            config: motionTokens.springs.snappy,
            delay: 16 + index * 12,
            fps,
            frame,
          });
          const accent = getPlayerColor(index % 2 === 0 ? "host" : "guest", theme);
          return (
            <div
              key={insight.id}
              style={{
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(0,0,0,0.55)",
                border: `1px solid ${accent}44`,
                borderRadius: 12,
                borderTop: `4px solid ${accent}`,
                opacity: itemEnter,
                padding: "24px 22px",
                transform: `translateY(${(1 - itemEnter) * 16}px)`,
              }}
            >
              <div
                style={{
                  color: theme.inkMuted,
                  fontFamily: condensedFont,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}
              >
                {insight.category}
              </div>
              <div
                style={{
                  color: theme.ink,
                  fontFamily: condensedFont,
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  marginBottom: 12,
                }}
              >
                {insight.headline}
              </div>
              <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 13, lineHeight: 1.4, marginTop: 8 }}>
                {insight.detail}
              </div>
              <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 15, lineHeight: 1.45, marginTop: 10 }}>
                {insight.action}
              </div>
            </div>
          );
        })}
      </div>

      <InsightCallout
        delay={40}
        text={`${ctx.hostName} vs ${ctx.guestName} — coaching takeaways from tracked shot data.`}
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}
