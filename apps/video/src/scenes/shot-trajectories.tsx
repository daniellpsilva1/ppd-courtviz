import { motionTokens } from "@ppd/tokens";
import { computeServePlusOneChains } from "@courtviz/core";
import { Court } from "@courtviz/react";
import { getPlayerColor } from "@courtviz/themes";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { BroadcastShell } from "../components/broadcast-shell";
import { CourtCard } from "../components/court-card";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import {
  buildPlayerFlows,
  courtPixelBounds,
  curvedPath,
  darkCourt,
  defaultCourtScales,
  getEfficiencyColor,
} from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { getMatchStats, sceneInsightForStats } from "../match-stats";
import { chromeOffsets, landscapeContentLayout } from "../scene-layout";

const COURT_W = 540;
const COURT_H = 560;
const GAP = 48;

const hostScales = defaultCourtScales(COURT_W, COURT_H, "full");
const guestScales = defaultCourtScales(COURT_W, COURT_H, "full");
const hostBounds = courtPixelBounds(hostScales, "full");
const guestBounds = courtPixelBounds(guestScales, "full");

export function ShotTrajectoriesScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const layout = landscapeContentLayout(height);
  const { legendBottom } = chromeOffsets("landscape");

  const hostFlows = buildPlayerFlows(ctx.enrichedShots, "host")
    .sort((a, b) => b.winRate * Math.log(b.count + 1) - a.winRate * Math.log(a.count + 1))
    .slice(0, 5);
  const guestFlows = buildPlayerFlows(ctx.enrichedShots, "guest")
    .sort((a, b) => b.winRate * Math.log(b.count + 1) - a.winRate * Math.log(a.count + 1))
    .slice(0, 5);
  const maxFlowCount = Math.max(
    ...hostFlows.map((f) => f.count),
    ...guestFlows.map((f) => f.count),
    1,
  );
  const hostChains = computeServePlusOneChains(ctx.enrichedShots, "host").slice(0, 3);
  const guestChains = computeServePlusOneChains(ctx.enrichedShots, "guest").slice(0, 3);
  const TOTAL_W = COURT_W * 2 + GAP + 64;
  const LEFT = (width - TOTAL_W) / 2;

  const legendOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BroadcastShell>
      <SceneHeader
        subtitle="Top rally flows & serve+1 chains · color = win rate"
        title="Tactical Patterns"
      />

      <div style={{ display: "flex", gap: GAP, left: LEFT, position: "absolute", top: layout.contentTop }}>
        <FlowPanel
          bounds={hostBounds}
          chains={hostChains}
          clipId="flow-clip-host"
          color={getPlayerColor("host", darkCourt)}
          flows={hostFlows}
          frame={frame}
          fps={fps}
          maxFlowCount={maxFlowCount}
          name={ctx.hostName}
          scales={hostScales}
          sideDelay={14}
        />
        <FlowPanel
          bounds={guestBounds}
          chains={guestChains}
          clipId="flow-clip-guest"
          color={getPlayerColor("guest", darkCourt)}
          flows={guestFlows}
          frame={frame}
          fps={fps}
          maxFlowCount={maxFlowCount}
          name={ctx.guestName}
          scales={guestScales}
          sideDelay={26}
        />
      </div>

      <div
        style={{
          bottom: legendBottom,
          color: darkCourt.inkMuted,
          fontFamily: bodyFont,
          fontSize: 14,
          left: "50%",
          opacity: legendOpacity,
          position: "absolute",
          transform: "translateX(-50%)",
        }}
      >
        Top 5 rally flows per player · arrow width = frequency
      </div>

      <InsightCallout delay={60} text={sceneInsightForStats(stats, "trajectories")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function FlowPanel({
  bounds,
  chains,
  clipId,
  color,
  flows,
  frame,
  fps,
  maxFlowCount,
  name,
  scales,
  sideDelay,
}: {
  bounds: ReturnType<typeof courtPixelBounds>;
  chains: ReturnType<typeof computeServePlusOneChains>;
  clipId: string;
  color: string;
  flows: ReturnType<typeof buildPlayerFlows>;
  frame: number;
  fps: number;
  maxFlowCount: number;
  name: string;
  scales: ReturnType<typeof defaultCourtScales>;
  sideDelay: number;
}) {
  const labelSpring = spring({
    config: motionTokens.springs.snappy,
    delay: sideDelay,
    fps,
    frame,
  });

  return (
    <CourtCard accentColor={color} label={name} labelOpacity={labelSpring}>
      <Court half="full" height={COURT_H} surface={BRAND_SURFACE} theme={darkCourt} width={COURT_W}>
        <defs>
          <clipPath id={clipId}>
            <rect
              height={bounds.yMax - bounds.yMin}
              width={bounds.xMax - bounds.xMin}
              x={bounds.xMin}
              y={bounds.yMin}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
        {flows.map((flow, index) => {
          const progress = spring({
            config: motionTokens.springs.snappy,
            delay: sideDelay + index * 2.5,
            fps,
            frame,
          });
          const strokeW = Math.max(1.2, 7 * Math.sqrt(flow.count / maxFlowCount)) * progress;
          const x1 = scales.x(flow.fromX);
          const y1 = scales.y(flow.fromY);
          const x2 = scales.x(flow.toX);
          const y2 = scales.y(flow.toY);
          const d = curvedPath(x1, y1, x2, y2, 0.02, bounds);
          const flowColor = getEfficiencyColor(flow.winRate, true);
          const inset = strokeW * 0.5;

          return (
            <g key={index} opacity={0.82 * progress}>
              <path
                d={d}
                fill="none"
                stroke={flowColor}
                strokeLinecap="round"
                strokeWidth={strokeW}
              />
              <circle
                cx={Math.max(bounds.xMin + inset, Math.min(bounds.xMax - inset, x1))}
                cy={Math.max(bounds.yMin + inset, Math.min(bounds.yMax - inset, y1))}
                fill="none"
                r={3.5 * progress}
                stroke={color}
                strokeWidth={1.5}
              />
              <circle
                cx={Math.max(bounds.xMin + inset, Math.min(bounds.xMax - inset, x2))}
                cy={Math.max(bounds.yMin + inset, Math.min(bounds.yMax - inset, y2))}
                fill={flowColor}
                r={3 * progress}
                stroke={darkCourt.haloColor}
                strokeWidth={0.5}
              />
              {progress > 0.8 && flow.count >= 3 ? (
                <text
                  dominantBaseline="middle"
                  fill={darkCourt.ink}
                  fontFamily={condensedFont}
                  fontSize={10}
                  fontWeight={700}
                  opacity={(progress - 0.8) * 5}
                  textAnchor="middle"
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                >
                  {Math.round(flow.winRate * 100)}% · n={flow.count}
                </text>
              ) : null}
            </g>
          );
        })}
        </g>
      </Court>
      {chains.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
          <div style={{ color: darkCourt.inkMuted, fontFamily: condensedFont, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Serve + 1 chains
          </div>
          {chains.map((chain, i) => (
            <div
              key={i}
              style={{
                alignItems: "center",
                color: darkCourt.ink,
                display: "flex",
                fontFamily: bodyFont,
                fontSize: 12,
                gap: 6,
                justifyContent: "space-between",
                opacity: spring({ config: motionTokens.springs.snappy, delay: sideDelay + 30 + i * 8, fps, frame }),
              }}
            >
              <span>{chain.serveZone} → {chain.plusOneStroke} {chain.plusOneZone}</span>
              <span style={{ color: getEfficiencyColor(chain.winRate, true), fontFamily: condensedFont, fontWeight: 700 }}>
                {Math.round(chain.winRate * 100)}% · n={chain.count}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </CourtCard>
  );
}
