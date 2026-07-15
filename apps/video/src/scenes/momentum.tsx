import { motionTokens } from "@ppd/tokens";
import { MomentumChart } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { formatMatchResultFromContext, sceneInsightForStats, getMatchStats } from "../match-stats";
import { getVideoMatchContext } from "../match-data";
import { chromeOffsets, landscapeContentLayout } from "../scene-layout";

const CHART_WIDTH = 1760;
const CHART_HEIGHT = 540;
const CHART_LEFT = 80;

const hostColor = getPlayerColor("host", theme);
const guestColor = getPlayerColor("guest", theme);

export function MomentumScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = landscapeContentLayout(height);
  const stats = getMatchStats();
  const { legendBottom } = chromeOffsets("landscape");

  const revealWidth = interpolate(frame, [15, 120], [0, CHART_WIDTH], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = spring({ config: motionTokens.springs.snappy, delay: 25, fps, frame });
  const resultOpacity = spring({ config: motionTokens.springs.snappy, delay: 125, fps, frame });

  return (
    <BroadcastShell>
      <SceneHeader
        subtitle={`${ctx.hostName} ${Math.round(stats.hostWinRate.rate * 100)}% · ${ctx.guestName} ${Math.round(stats.guestWinRate.rate * 100)}%`}
        title="Match Momentum"
      />

      <div
        style={{
          left: CHART_LEFT,
          overflow: "hidden",
          position: "absolute",
          top: layout.contentTop,
          width: revealWidth,
        }}
      >
        <MomentumChart
          height={CHART_HEIGHT}
          hostPlayer="host"
          points={ctx.momentumPoints}
          showBreakPoints
          showSetBoundaries
          showSetLabels
          theme={theme}
          width={CHART_WIDTH}
        />
      </div>

      {revealWidth >= CHART_WIDTH - 2 ? (
        <div
          style={{
            left: CHART_LEFT + CHART_WIDTH - 300,
            opacity: resultOpacity,
            position: "absolute",
            top: layout.contentTop + 16,
          }}
        >
          <div
            style={{
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0,0,0,0.7)",
              border: `1px solid ${theme.inkMuted}44`,
              borderRadius: 6,
              color: theme.ink,
              fontFamily: condensedFont,
              fontSize: 15,
              fontWeight: 700,
              padding: "10px 16px",
            }}
          >
            {formatMatchResultFromContext(ctx)}
          </div>
        </div>
      ) : null}

      <div
        style={{
          bottom: legendBottom,
          display: "flex",
          gap: 40,
          left: CHART_LEFT,
          opacity: labelOpacity,
          position: "absolute",
        }}
      >
        <PlayerLabel color={hostColor} name={ctx.hostName} />
        <PlayerLabel color={guestColor} name={ctx.guestName} />
        <span style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 16 }}>
          ● Break points
        </span>
      </div>

      <InsightCallout delay={80} text={sceneInsightForStats(stats, "momentum")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function PlayerLabel({ color, name }: { color: string; name: string }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
      <div style={{ backgroundColor: color, borderRadius: 2, height: 14, width: 14 }} />
      <span style={{ color: theme.ink, fontFamily: bodyFont, fontSize: 18 }}>{name}</span>
    </div>
  );
}
