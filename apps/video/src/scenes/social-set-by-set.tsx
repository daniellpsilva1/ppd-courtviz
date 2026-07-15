import { motionTokens } from "@ppd/tokens";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { getPlayerColor } from "@courtviz/themes";
import { theme } from "../court-viz-utils";
import { condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

export function SocialSetBySetScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const enter = spring({ config: motionTokens.springs.smooth, delay: 8, fps, frame });

  return (
    <BroadcastShell>
      <SceneHeader subtitle="Per-set score breakdown" title="Set by Set" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          height: layout.contentHeight,
          justifyContent: "center",
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        {ctx.sets.map((set, index) => {
          const rowEnter = spring({
            config: motionTokens.springs.smooth,
            delay: 12 + index * 8,
            fps,
            frame,
          });
          const hostLeads = set.hostScore >= set.guestScore;

          return (
            <div
              key={set.setNumber}
              style={{
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(0,0,0,0.55)",
                border: `1px solid ${theme.inkMuted}33`,
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                opacity: rowEnter,
                padding: "20px 28px",
                transform: `translateY(${(1 - rowEnter) * 10}px)`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: theme.inkMuted,
                    fontFamily: condensedFont,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Set {index + 1}
                </div>
                <div
                  style={{
                    color: getPlayerColor("host", theme),
                    fontFamily: condensedFont,
                    fontSize: hostLeads ? 36 : 28,
                    fontWeight: 700,
                  }}
                >
                  {ctx.hostName.split(" ").pop()} {set.hostScore}
                  {set.hostTiebreakScore != null && set.guestTiebreakScore != null && (
                    <span style={{ fontSize: 18, opacity: 0.7 }}> ({set.hostTiebreakScore})</span>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div
                  style={{
                    color: getPlayerColor("guest", theme),
                    fontFamily: condensedFont,
                    fontSize: !hostLeads ? 36 : 28,
                    fontWeight: 700,
                  }}
                >
                  {set.guestScore} {ctx.guestName.split(" ").pop()}
                  {set.hostTiebreakScore != null && set.guestTiebreakScore != null && (
                    <span style={{ fontSize: 18, opacity: 0.7 }}> ({set.guestTiebreakScore})</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <InsightCallout
        delay={30}
        orientation="vertical"
        text={`${ctx.hostName} vs ${ctx.guestName} — momentum shifted set by set.`}
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}
