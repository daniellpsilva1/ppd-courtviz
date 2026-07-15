import { motionTokens } from "@ppd/tokens";
import { generateCoachInsights } from "@ppd/brand";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SFXImpact } from "../components/sfx-cues";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { PPD } from "../ppd-tokens";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

const CATEGORY_COLORS: Record<string, string> = {
  pattern: PPD.primary,
  rally: PPD.primary,
  serve: PPD.primary,
  zone: PPD.primary,
};

export function SocialCoachInsightsScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const insights = generateCoachInsights(
    {
      enrichedShots: ctx.enrichedShots,
      guestName: ctx.guestName,
      hostName: ctx.hostName,
      points: ctx.points,
    },
    3,
  );
  const cycleFrames = Math.floor((4 * fps) / insights.length);
  const activeIndex = Math.min(insights.length - 1, Math.floor(frame / cycleFrames));
  const insight = insights[activeIndex]!;
  const accent = CATEGORY_COLORS[insight.category] ?? PPD.primary;
  const enter = spring({ config: motionTokens.springs.smooth, delay: 10, fps, frame: frame % cycleFrames });

  return (
    <BroadcastShell>
      <SFXImpact delay={12} />
      <SceneHeader subtitle="Actionable takeaways" title="Coach Insights" />

      <div
        style={{
          height: layout.contentHeight,
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0,0,0,0.55)",
            border: `1px solid ${accent}44`,
            borderLeft: `5px solid ${accent}`,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            padding: "28px 32px",
            transform: `translateY(${(1 - enter) * 12}px)`,
          }}
        >
          <span
            style={{
              background: `${accent}22`,
              border: `1px solid ${accent}55`,
              borderRadius: 20,
              color: accent,
              fontFamily: condensedFont,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: 16,
              padding: "4px 12px",
              textTransform: "uppercase",
              width: "fit-content",
            }}
          >
            {insight.category}
          </span>
          <div
            style={{
              color: theme.ink,
              fontFamily: condensedFont,
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.25,
              marginBottom: 12,
            }}
          >
            {insight.headline}
          </div>
          <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 15, lineHeight: 1.45 }}>
            {insight.action}
          </div>
          <div
            style={{
              color: theme.inkMuted,
              display: "flex",
              fontFamily: bodyFont,
              fontSize: 12,
              gap: 8,
              marginTop: 24,
            }}
          >
            {insights.map((item, index) => (
              <span
                key={item.id}
                style={{
                  background: index === activeIndex ? accent : `${theme.inkMuted}44`,
                  borderRadius: 4,
                  height: 4,
                  width: index === activeIndex ? 24 : 12,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <InsightCallout
        delay={36}
        orientation="vertical"
        text={`${ctx.hostName} vs ${ctx.guestName} — coaching priorities from tracked shot data.`}
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}
