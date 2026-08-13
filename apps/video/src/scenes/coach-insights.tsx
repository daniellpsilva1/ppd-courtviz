import { formatRate } from "@courtviz/core";
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

const CARD_ROTATION_FRAMES = 90;

export function CoachInsightsScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = landscapeContentLayout(height);
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
  const contentW = Math.min(1600, width - 120);

  const activeIndex = Math.min(
    insights.length - 1,
    Math.floor((frame - 30) / CARD_ROTATION_FRAMES),
  );
  const activeInsight = insights[Math.max(0, activeIndex)];

  return (
    <BroadcastShell>
      <SFXImpact delay={12} />
      <SceneHeader subtitle="Three priorities for practice" title="Coach Insights" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: layout.contentHeight,
          left: "50%",
          opacity: enter,
          position: "absolute",
          top: layout.contentTop,
          transform: "translateX(-50%)",
          width: contentW,
        }}
      >
        <div style={{ display: "flex", gap: 16, width: "100%" }}>
          {insights.map((insight, index) => {
            const itemEnter = spring({
              config: motionTokens.springs.snappy,
              delay: 16 + index * 12,
              fps,
              frame,
            });
            const accent = getPlayerColor(index % 2 === 0 ? "host" : "guest", theme);
            const isActive = index === activeIndex;
            return (
              <div
                key={insight.id}
                style={{
                  backdropFilter: "blur(10px)",
                  backgroundColor: "rgba(0,0,0,0.55)",
                  border: `1px solid ${accent}${isActive ? "88" : "33"}`,
                  borderRadius: 12,
                  borderTop: `4px solid ${accent}`,
                  flex: 1,
                  opacity: itemEnter,
                  padding: "20px 20px",
                  transform: `translateY(${(1 - itemEnter) * 16}px) scale(${isActive ? 1.02 : 1})`,
                  transition: "border-color 0.3s, transform 0.3s",
                }}
              >
                <div style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 8, textTransform: "uppercase" }}>
                  {insight.category}
                </div>
                <div style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 20, fontWeight: 700, lineHeight: 1.15, marginBottom: 8 }}>
                  {insight.headline}
                </div>
                <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12, lineHeight: 1.4 }}>
                  {insight.action}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            alignItems: "center",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0,0,0,0.55)",
            border: `1px solid ${theme.inkMuted}33`,
            borderRadius: 12,
            display: "flex",
            gap: 24,
            minHeight: 200,
            padding: "24px 32px",
            width: "100%",
          }}
        >
          <CoachMiniViz frame={frame} fps={fps} insight={activeInsight} />
          <div style={{ flex: 1 }}>
            <div style={{ color: theme.inkMuted, fontFamily: condensedFont, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 8, textTransform: "uppercase" }}>
              {activeInsight?.category} — Data
            </div>
            <div style={{ color: theme.ink, fontFamily: condensedFont, fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>
              {activeInsight?.headline}
            </div>
            <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 14, lineHeight: 1.5 }}>
              {activeInsight?.detail}
            </div>
          </div>
        </div>
      </div>

      <InsightCallout
        delay={40}
        text={`${ctx.hostName} vs ${ctx.guestName} — coaching takeaways from tracked shot data.`}
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function CoachMiniViz({ frame, fps, insight }: { frame: number; fps: number; insight?: ReturnType<typeof generateCoachInsights>[number] }) {
  if (!insight?.viz) return null;
  const enter = spring({ config: motionTokens.springs.snappy, delay: 20, fps, frame });
  const viz = insight.viz;

  if (viz.kind === "serve-zones") {
    const maxInRate = Math.max(...viz.zones.map((z) => z.inCount / Math.max(z.count, 1)), 0.001);
    return (
      <svg height={160} opacity={enter} width={280}>
        {viz.zones.map((zone, i) => {
          const inRate = zone.inCount / Math.max(zone.count, 1);
          const barW = 180;
          const barH = 14;
          const y = i * 22 + 10;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={9} x={0} y={y + 10}>
                {zone.side?.charAt(0).toUpperCase() ?? "?"}{zone.zone?.charAt(0).toUpperCase() ?? "?"}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={barH} rx={2} width={barW} x={28} y={y} />
              <rect fill={getPlayerColor("host", theme)} height={barH} rx={2} width={barW * (inRate / maxInRate) * enter} x={28} y={y} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={11} fontWeight={700} x={216} y={y + 11}>
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
      <svg height={160} opacity={enter} width={280}>
        {viz.buckets.map((bucket, i) => {
          const barW = 180;
          const barH = 18;
          const y = i * 28 + 10;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={9} x={0} y={y + 13}>
                {bucket.bucket}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={barH} rx={2} width={barW} x={60} y={y} />
              <rect fill={getPlayerColor("host", theme)} height={barH} rx={2} width={barW * ((bucket.winRate ?? 0) / maxWin) * enter} x={60} y={y} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={12} fontWeight={700} x={248} y={y + 14}>
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
      <svg height={160} opacity={enter} width={280}>
        {viz.zones.map((zone, i) => {
          const y = i * 22 + 10;
          const barW = 180;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={9} x={0} y={y + 10}>
                {zone.zone.replace(/_/g, " ").slice(0, 12)}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={12} rx={2} width={barW} x={80} y={y - 1} />
              <rect fill={getPlayerColor("host", theme)} height={12} rx={2} width={barW * ((zone.winRate ?? 0) / maxWin) * enter} x={80} y={y - 1} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={10} fontWeight={700} x={266} y={y + 10}>
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
      <svg height={160} opacity={enter} width={280}>
        {viz.flows.map((flow, i) => {
          const y = i * 22 + 10;
          const barW = 180;
          return (
            <g key={i}>
              <text fill={theme.inkMuted} fontFamily={bodyFont} fontSize={9} x={0} y={y + 10}>
                {flow.fromZone.slice(0, 8)}→{flow.toZone.slice(0, 8)}
              </text>
              <rect fill={`${theme.inkMuted}22`} height={12} rx={2} width={barW} x={100} y={y - 1} />
              <rect fill={getPlayerColor("host", theme)} height={12} rx={2} width={barW * (flow.count / maxCount) * enter} x={100} y={y - 1} />
              <text fill={theme.ink} fontFamily={condensedFont} fontSize={10} fontWeight={700} x={286} y={y + 10}>
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
    const r = 60;
    const circ = 2 * Math.PI * r;
    const dash = circ * pct * enter;
    return (
      <svg height={140} opacity={enter} width={140}>
        <circle cx={70} cy={70} fill="none" r={r} stroke={`${theme.inkMuted}22`} strokeWidth={8} />
        <circle cx={70} cy={70} fill="none" r={r} stroke={getPlayerColor("host", theme)} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" strokeWidth={8} transform="rotate(-90 70 70)" />
        <text dominantBaseline="central" fill={theme.ink} fontFamily={condensedFont} fontSize={28} fontWeight={700} textAnchor="middle" x={70} y={70}>
          {Math.round(pct * 100 * enter)}%
        </text>
      </svg>
    );
  }

  return null;
}
