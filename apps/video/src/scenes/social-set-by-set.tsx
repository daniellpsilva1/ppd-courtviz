import { motionTokens } from "@ppd/tokens";
import { computeMomentum } from "@courtviz/core";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
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
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);
  const momentum = computeMomentum(ctx.momentumPoints, "host");

  return (
    <BroadcastShell>
      <SceneHeader delay={12} orientation="vertical" subtitle="Per-set score breakdown" title="Set by Set" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: layout.contentHeight,
          justifyContent: "space-evenly",
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        {ctx.sets.map((set, index) => {
          const rowEnter = spring({
            config: motionTokens.springs.snappy,
            delay: 12 + index * 8,
            fps,
            frame,
          });
          const hostWon = set.hostScore > set.guestScore;
          const winnerColor = hostWon ? hostColor : guestColor;
          const winnerName = hostWon ? ctx.hostName.split(" ").pop() : ctx.guestName.split(" ").pop();

          const setMomentum = momentum.filter((m) => m.setNumber === set.setNumber);
          const setMaxAbs = Math.max(1, ...setMomentum.map((m) => Math.abs(m.cumulativeDiff)));
          const momentumProgress = interpolate(
            frame,
            [20 + index * 8, 40 + index * 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <div
              key={set.setNumber}
              style={{
                alignItems: "center",
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(0,0,0,0.55)",
                border: `1px solid ${winnerColor}44`,
                borderLeft: `4px solid ${winnerColor}`,
                borderRadius: 12,
                display: "flex",
                flex: 1,
                flexDirection: "column",
                gap: 10,
                opacity: rowEnter,
                padding: "20px 28px",
                transform: `translateY(${(1 - rowEnter) * 10}px)`,
              }}
            >
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", width: "100%" }}>
                <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
                  <span style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Set {index + 1}
                  </span>
                  <span style={{ color: winnerColor, fontFamily: condensedFont, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {winnerName} won
                  </span>
                </div>
              </div>

              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", width: "100%" }}>
                <div style={{ alignItems: "baseline", display: "flex", gap: 8 }}>
                  <span style={{ color: hostColor, fontFamily: condensedFont, fontSize: hostWon ? 64 : 48, fontWeight: 700 }}>
                    {set.hostScore}
                  </span>
                  {set.hostTiebreakScore != null && set.guestTiebreakScore != null && (
                    <span style={{ color: hostColor, fontFamily: condensedFont, fontSize: 20, opacity: 0.7 }}>
                      ({set.hostTiebreakScore})
                    </span>
                  )}
                </div>
                <div style={{ alignItems: "baseline", display: "flex", gap: 8 }}>
                  {set.hostTiebreakScore != null && set.guestTiebreakScore != null && (
                    <span style={{ color: guestColor, fontFamily: condensedFont, fontSize: 20, opacity: 0.7 }}>
                      ({set.guestTiebreakScore})
                    </span>
                  )}
                  <span style={{ color: guestColor, fontFamily: condensedFont, fontSize: !hostWon ? 64 : 48, fontWeight: 700 }}>
                    {set.guestScore}
                  </span>
                </div>
              </div>

              <MiniMomentumStrip
                color={theme.ink}
                guestColor={guestColor}
                hostColor={hostColor}
                momentum={setMomentum}
                maxAbs={setMaxAbs}
                progress={momentumProgress}
              />
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

function MiniMomentumStrip({
  color,
  guestColor,
  hostColor,
  momentum,
  maxAbs,
  progress,
}: {
  color: string;
  guestColor: string;
  hostColor: string;
  momentum: Array<{ cumulativeDiff: number; pointIndex: number }>;
  maxAbs: number;
  progress: number;
}) {
  if (momentum.length === 0) return null;
  const stripW = 880;
  const stripH = 36;
  const midY = stripH / 2;
  const xScale = (i: number) => (i / Math.max(momentum.length - 1, 1)) * stripW;
  const yScale = (v: number) => midY - (v / maxAbs) * (stripH / 2 - 2);

  const visibleCount = Math.floor(momentum.length * progress);
  const visiblePoints = momentum.slice(0, visibleCount).map((m) => `${xScale(m.pointIndex)},${yScale(m.cumulativeDiff)}`).join(" ");

  return (
    <svg height={stripH} width={stripW}>
      <line stroke={theme.inkMuted} strokeDasharray="2 2" strokeWidth={0.5} x1={0} x2={stripW} y1={midY} y2={midY} />
      {visiblePoints && (
        <polyline fill="none" points={visiblePoints} stroke={color} strokeWidth={1.5} />
      )}
      {visibleCount > 0 && (
        <circle
          cx={xScale(momentum[visibleCount - 1]!.pointIndex)}
          cy={yScale(momentum[visibleCount - 1]!.cumulativeDiff)}
          fill={momentum[visibleCount - 1]!.cumulativeDiff >= 0 ? hostColor : guestColor}
          r={3}
        />
      )}
    </svg>
  );
}
