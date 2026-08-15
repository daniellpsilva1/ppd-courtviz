import { formatRate } from "@courtviz/core";
import { motionTokens, radii } from "@ppd/tokens";
import { generateCoachInsights } from "@ppd/brand";
import { cardBg, getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SFXImpact } from "../components/sfx-cues";
import { useSceneTheme } from "../components/scene-theme-context";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

export function SocialCoachInsightsScene() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const theme = useSceneTheme();
  const insights = generateCoachInsights(
    {
      enrichedShots: ctx.enrichedShots,
      guestName: ctx.guestName,
      hostName: ctx.hostName,
      points: ctx.points,
    },
    3,
  );
  const enter = spring({ config: motionTokens.springs.smooth, delay: 10, fps, frame });

  return (
    <BroadcastShell variant="social">
      <SFXImpact delay={12} />
      <SceneHeader delay={12} orientation="vertical" subtitle="Actionable takeaways" title="Coach Insights" />

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
        {insights.map((insight, index) => {
          const itemEnter = spring({
            config: motionTokens.springs.snappy,
            delay: 14 + index * 10,
            fps,
            frame,
          });
          const accent = getPlayerColor(index % 2 === 0 ? "host" : "guest", theme);

          return (
            <div
              key={insight.id}
              style={{
                alignItems: "center",
                backdropFilter: "blur(10px)",
                backgroundColor: cardBg(theme),
                border: `1px solid ${accent}44`,
                borderLeft: `5px solid ${accent}`,
                borderRadius: radii.lg,
                display: "flex",
                flex: 1,
                gap: 16,
                opacity: itemEnter,
                padding: "16px 20px",
                transform: `translateY(${(1 - itemEnter) * 12}px)`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    background: `${accent}22`,
                    border: `1px solid ${accent}55`,
                    borderRadius: 20,
                    color: accent,
                    fontFamily: condensedFont,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                    padding: "3px 10px",
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
                    fontSize: 18,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {insight.headline}
                </div>
                <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12, lineHeight: 1.4 }}>
                  {insight.action}
                </div>
              </div>
              <SocialMiniViz frame={frame} fps={fps} insight={insight} />
            </div>
          );
        })}
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

function SocialMiniViz({ frame, fps, insight }: { frame: number; fps: number; insight: ReturnType<typeof generateCoachInsights>[number] }) {
  const theme = useSceneTheme();
  if (!insight.viz) return null;
  const enter = spring({ config: motionTokens.springs.snappy, delay: 20, fps, frame });
  const viz = insight.viz;
  const hostColor = getPlayerColor("host", theme);

  if (viz.kind === "serve-zones") {
    const maxInRate = Math.max(...viz.zones.map((z) => z.inCount / Math.max(z.count, 1)), 0.001);
    return (
      <svg height={100} opacity={enter} width={140}>
        {viz.zones.slice(0, 4).map((zone, i) => {
          const inRate = zone.inCount / Math.max(zone.count, 1);
          const barW = 90;
          const barH = 10;
          const y = i * 16 + 8;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={7} x={0} y={y + 8}>
                {zone.side?.charAt(0).toUpperCase() ?? "?"}{zone.zone?.charAt(0).toUpperCase() ?? "?"}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={barH} rx={2} width={barW} x={16} y={y} />
              <rect fill={hostColor} height={barH} rx={2} width={barW * (inRate / maxInRate) * enter} x={16} y={y} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={8} fontWeight={700} x={110} y={y + 8}>
                {Math.round(inRate * 100)}%
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (viz.kind === "rally-buckets") {
    const maxWin = Math.max(...viz.buckets.map((b) => b.winRate ?? 0), 0.001);
    return (
      <svg height={100} opacity={enter} width={140}>
        {viz.buckets.map((bucket, i) => {
          const barW = 90;
          const barH = 12;
          const y = i * 20 + 8;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={7} x={0} y={y + 9}>
                {bucket.bucket}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={barH} rx={2} width={barW} x={30} y={y} />
              <rect fill={hostColor} height={barH} rx={2} width={barW * ((bucket.winRate ?? 0) / maxWin) * enter} x={30} y={y} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={9} fontWeight={700} x={126} y={y + 10}>
                {formatRate(bucket.winRate)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (viz.kind === "zone-heat") {
    const maxWin = Math.max(...viz.zones.map((z) => z.winRate ?? 0), 0.001);
    return (
      <svg height={100} opacity={enter} width={140}>
        {viz.zones.slice(0, 4).map((zone, i) => {
          const y = i * 16 + 8;
          const barW = 90;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={6} x={0} y={y + 8}>
                {zone.zone.replace(/_/g, " ").slice(0, 8)}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={10} rx={2} width={barW} x={40} y={y} />
              <rect fill={hostColor} height={10} rx={2} width={barW * ((zone.winRate ?? 0) / maxWin) * enter} x={40} y={y} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={8} fontWeight={700} x={134} y={y + 8}>
                {formatRate(zone.winRate)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (viz.kind === "flow") {
    const maxCount = Math.max(...viz.flows.map((f) => f.count), 1);
    return (
      <svg height={100} opacity={enter} width={140}>
        {viz.flows.slice(0, 4).map((flow, i) => {
          const y = i * 16 + 8;
          const barW = 80;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={6} x={0} y={y + 8}>
                {flow.fromZone.slice(0, 6)}→{flow.toZone.slice(0, 6)}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={10} rx={2} width={barW} x={50} y={y} />
              <rect fill={hostColor} height={10} rx={2} width={barW * (flow.count / maxCount) * enter} x={50} y={y} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={8} fontWeight={700} x={134} y={y + 8}>
                {formatRate(flow.winRate)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (viz.kind === "bp-gauge") {
    const pct = viz.total > 0 ? viz.won / viz.total : 0;
    const r = 40;
    const circ = 2 * Math.PI * r;
    const dash = circ * pct * enter;
    return (
      <svg height={100} opacity={enter} width={100}>
        <circle cx={50} cy={50} fill="none" r={r} stroke={`${theme.inkMuted}22`} strokeWidth={6} />
        <circle cx={50} cy={50} fill="none" r={r} stroke={hostColor} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" strokeWidth={6} transform="rotate(-90 50 50)" />
        <text dominantBaseline="central" fill={theme.ink} fontFamily={condensedFont} fontSize={18} fontWeight={700} textAnchor="middle" x={50} y={50}>
          {Math.round(pct * 100 * enter)}%
        </text>
      </svg>
    );
  }

  return null;
}
