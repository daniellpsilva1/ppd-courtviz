import { motionTokens } from "@ppd/tokens";
import { computeServePlusOneChains, formatRate } from "@courtviz/core";
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
const MINI_W = 250;
const MINI_H = 260;

const hostScales = defaultCourtScales(COURT_W, COURT_H, "full");
const guestScales = defaultCourtScales(COURT_W, COURT_H, "full");
const hostBounds = courtPixelBounds(hostScales, "full");
const guestBounds = courtPixelBounds(guestScales, "full");

const CHAIN_FRAMES = 45;
const GHOST_OPACITY = 0.18;

export function ShotTrajectoriesScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const stats = getMatchStats();
  const layout = landscapeContentLayout(height);
  const { legendBottom } = chromeOffsets("landscape");

  const hostChains = computeServePlusOneChains(ctx.enrichedShots, "host").slice(0, 3);
  const guestChains = computeServePlusOneChains(ctx.enrichedShots, "guest").slice(0, 3);
  const hostFlows = buildPlayerFlows(ctx.enrichedShots, "host")
    .sort((a, b) => (b.winRate ?? 0) * Math.log(b.count + 1) - (a.winRate ?? 0) * Math.log(a.count + 1))
    .slice(0, 3);
  const guestFlows = buildPlayerFlows(ctx.enrichedShots, "guest")
    .sort((a, b) => (b.winRate ?? 0) * Math.log(b.count + 1) - (a.winRate ?? 0) * Math.log(a.count + 1))
    .slice(0, 3);
  const maxFlowCount = Math.max(
    ...hostFlows.map((f) => f.count),
    ...guestFlows.map((f) => f.count),
    1,
  );

  const maxChainCount = Math.max(hostChains.length, guestChains.length);
  const chainPhaseEnd = maxChainCount * CHAIN_FRAMES + 30;
  const flowPhaseStart = chainPhaseEnd + 20;
  const TOTAL_W = COURT_W * 2 + GAP + 64;
  const LEFT = (width - TOTAL_W) / 2;

  const legendOpacity = interpolate(frame, [flowPhaseStart, flowPhaseStart + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BroadcastShell>
      <SceneHeader
        subtitle="Serve+1 spotlight · then top rally flows"
        title="Tactical Patterns"
      />

      <div style={{ display: "flex", gap: GAP, left: LEFT, position: "absolute", top: layout.contentTop }}>
        <ServePlusOnePanel
          bounds={hostBounds}
          chains={hostChains}
          color={getPlayerColor("host", darkCourt)}
          flows={hostFlows}
          flowPhaseStart={flowPhaseStart}
          frame={frame}
          fps={fps}
          maxFlowCount={maxFlowCount}
          name={ctx.hostName}
          scales={hostScales}
          sideDelay={14}
        />
        <ServePlusOnePanel
          bounds={guestBounds}
          chains={guestChains}
          color={getPlayerColor("guest", darkCourt)}
          flows={guestFlows}
          flowPhaseStart={flowPhaseStart}
          frame={frame}
          fps={fps}
          maxFlowCount={maxFlowCount}
          name={ctx.guestName}
          scales={guestScales}
          sideDelay={14}
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
        Top 3 serve+1 chains · then top 3 rally flows · color = win rate
      </div>

      <InsightCallout delay={60} text={sceneInsightForStats(stats, "trajectories")} />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} />
    </BroadcastShell>
  );
}

function ServePlusOnePanel({
  bounds,
  chains,
  color,
  flows,
  flowPhaseStart,
  frame,
  fps,
  maxFlowCount,
  name,
  scales,
  sideDelay,
}: {
  bounds: ReturnType<typeof courtPixelBounds>;
  chains: ReturnType<typeof computeServePlusOneChains>;
  color: string;
  flows: ReturnType<typeof buildPlayerFlows>;
  flowPhaseStart: number;
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

  const flowOpacity = interpolate(frame, [flowPhaseStart, flowPhaseStart + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CourtCard accentColor={color} label={name} labelOpacity={labelSpring}>
      <div style={{ display: "flex", gap: 12 }}>
        <Court half="full" height={COURT_H} surface={BRAND_SURFACE} theme={darkCourt} width={COURT_W}>
          <defs>
            <clipPath id={`clip-${name}`}>
              <rect
                height={bounds.yMax - bounds.yMin}
                width={bounds.xMax - bounds.xMin}
                x={bounds.xMin}
                y={bounds.yMin}
              />
            </clipPath>
            <marker
              id={`arrow-${name}`}
              markerHeight="6"
              markerWidth="6"
              orient="auto"
              refX="5"
              refY="3"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill={color} />
            </marker>
          </defs>
          <g clipPath={`url(#clip-${name})`}>
            {chains.map((chain, index) => {
              const chainStart = sideDelay + index * CHAIN_FRAMES;
              const chainProgress = spring({
                config: motionTokens.springs.snappy,
                delay: chainStart,
                fps,
                frame,
              });
              const isPast = frame > chainStart + CHAIN_FRAMES;
              const opacity = isPast ? GHOST_OPACITY : 0.85 * chainProgress;

              const serveX = scales.x(0);
              const serveY = scales.y(20);
              const plusOneX = scales.x(chain.meanPlusOneX || 0);
              const plusOneY = scales.y(chain.meanPlusOneY || 8);
              const d = curvedPath(serveX, serveY, plusOneX, plusOneY, 0.15, bounds);

              return (
                <g key={index} opacity={opacity}>
                  <path
                    d={d}
                    fill="none"
                    markerEnd={`url(#arrow-${name})`}
                    stroke={getEfficiencyColor(chain.winRate ?? 0, true)}
                    strokeLinecap="round"
                    strokeWidth={4 * chainProgress}
                  />
                  <circle
                    cx={serveX}
                    cy={serveY}
                    fill="none"
                    r={4 * chainProgress}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={plusOneX}
                    cy={plusOneY}
                    fill={getEfficiencyColor(chain.winRate ?? 0, true)}
                    r={4 * chainProgress}
                  />
                </g>
              );
            })}
          </g>
        </Court>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 180 }}>
          <div style={{ color: darkCourt.inkMuted, fontFamily: condensedFont, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Serve + 1
          </div>
          {chains.map((chain, i) => {
            const chainStart = sideDelay + i * CHAIN_FRAMES;
            const isActive = frame >= chainStart && frame < chainStart + CHAIN_FRAMES;
            const isPast = frame > chainStart + CHAIN_FRAMES;
            const itemOpacity = spring({
              config: motionTokens.springs.snappy,
              delay: chainStart,
              fps,
              frame,
            });

            return (
              <div
                key={i}
                style={{
                  alignItems: "center",
                  backgroundColor: isActive ? `${color}22` : "transparent",
                  border: isActive ? `1px solid ${color}44` : "1px solid transparent",
                  borderRadius: 6,
                  color: darkCourt.ink,
                  display: "flex",
                  fontFamily: bodyFont,
                  fontSize: 11,
                  gap: 4,
                  justifyContent: "space-between",
                  opacity: isPast ? GHOST_OPACITY : itemOpacity,
                  padding: "4px 8px",
                }}
              >
                <span>{chain.serveZone} → {chain.plusOneZone}</span>
                <span style={{ color: getEfficiencyColor(chain.winRate ?? 0, true), fontFamily: condensedFont, fontWeight: 700 }}>
                  {formatRate(chain.winRate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, opacity: flowOpacity }}>
        {flows.map((flow, index) => {
          const miniScales = defaultCourtScales(MINI_W, MINI_H, "full");
          const miniBounds = courtPixelBounds(miniScales, "full");
          const x1 = miniScales.x(flow.fromX);
          const y1 = miniScales.y(flow.fromY);
          const x2 = miniScales.x(flow.toX);
          const y2 = miniScales.y(flow.toY);
          const d = curvedPath(x1, y1, x2, y2, 0.02, miniBounds);
          const strokeW = Math.max(1, 5 * Math.sqrt(flow.count / maxFlowCount));
          const flowColor = getEfficiencyColor(flow.winRate ?? 0, true);

          return (
            <div key={index} style={{ position: "relative" }}>
              <Court half="full" height={MINI_H} surface={BRAND_SURFACE} theme={darkCourt} width={MINI_W}>
                <path
                  d={d}
                  fill="none"
                  stroke={flowColor}
                  strokeLinecap="round"
                  strokeWidth={strokeW}
                />
                <circle cx={x1} cy={y1} fill="none" r={3} stroke={color} strokeWidth={1} />
                <circle cx={x2} cy={y2} fill={flowColor} r={2.5} />
              </Court>
              <div style={{
                bottom: 4,
                color: darkCourt.ink,
                fontFamily: condensedFont,
                fontSize: 10,
                fontWeight: 700,
                left: 8,
                position: "absolute",
              }}>
                {formatRate(flow.winRate)} · n={flow.count}
              </div>
            </div>
          );
        })}
      </div>
    </CourtCard>
  );
}
