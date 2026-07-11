import { Court } from "@courtviz/react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { BroadcastShell } from "../components/broadcast-shell";
import { InsightCallout } from "../components/insight-callout";
import { MatchScoreBar } from "../components/match-score-bar";
import { SceneHeader } from "../components/scene-header";
import { SFXWhoosh } from "../components/sfx-cues";
import {
  courtPixelBounds,
  curvedPath,
  darkCourt,
  defaultCourtScales,
  getEfficiencyColor,
} from "../court-viz-utils";
import { normalizeHit, normalizeShot } from "@courtviz/core";
import { bodyFont, condensedFont } from "../fonts";
import { getVideoMatchContext } from "../match-data";
import { verticalContentLayout } from "../scene-layout";

const STATS_STRIP_H = 80;

export function SocialTrajectoriesScene() {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ctx = getVideoMatchContext();
  const layout = verticalContentLayout(height);
  const contentW = width - layout.sidePadding * 2;
  const courtH = layout.contentHeight - STATS_STRIP_H - 16;
  const courtW = Math.min(contentW, Math.round(courtH * 1.05));

  const shots = ctx.enrichedShots.filter(
    (s) =>
      s.player === "host" &&
      s.stroke !== "Serve" &&
      s.hitX != null &&
      s.hitY != null &&
      s.bounceX != null &&
      s.bounceY != null &&
      s.result === "In",
  );
  const sample = shots
    .filter((s) => s.speedKmh != null)
    .sort((a, b) => (b.speedKmh ?? 0) - (a.speedKmh ?? 0))
    .slice(0, 24);
  const speeds = sample.map((s) => s.speedKmh ?? 0);
  const topSpeed = speeds.length ? Math.max(...speeds) : 0;
  const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  const scales = defaultCourtScales(courtW, courtH, "near");
  const bounds = courtPixelBounds(scales, "near");
  const enter = spring({ config: { damping: 28, stiffness: 200 }, delay: 8, fps, frame });

  return (
    <BroadcastShell>
      <SFXWhoosh delay={10} />
      <SceneHeader subtitle="Hit → bounce arcs with speed" title="Ball Trajectories" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: layout.contentHeight,
          left: layout.sidePadding,
          opacity: enter,
          position: "absolute",
          right: layout.sidePadding,
          top: layout.contentTop,
        }}
      >
        <Court half="near" height={courtH} surface={ctx.surface ?? BRAND_SURFACE} theme={darkCourt} width={courtW}>
          <defs>
            <clipPath id="social-traj-clip">
              <rect
                height={bounds.yMax - bounds.yMin}
                width={bounds.xMax - bounds.xMin}
                x={bounds.xMin}
                y={bounds.yMin}
              />
            </clipPath>
          </defs>
          <g clipPath="url(#social-traj-clip)">
            {sample.map((shot, index) => {
              const progress = spring({
                config: { damping: 28, stiffness: 200 },
                delay: 12 + index,
                fps,
                frame,
              });
              const [bx, by] = normalizeShot(shot.bounceX!, shot.bounceY!, shot.hitY!);
              const [hx, hy] = normalizeHit(shot.hitX!, shot.hitY!);
              const x1 = scales.x(hx);
              const y1 = scales.y(hy);
              const x2 = scales.x(bx);
              const y2 = scales.y(by);
              const d = curvedPath(x1, y1, x2, y2, 0.03, bounds);
              const won = shot.pointWinner === shot.player;
              const strokeColor = getEfficiencyColor(won ? 0.85 : 0.25, true);

              return (
                <g key={index} opacity={0.85 * progress}>
                  <path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeDasharray={progress < 1 ? `${progress * 200} 200` : undefined}
                    strokeLinecap="round"
                    strokeWidth={2.2}
                  />
                  <circle cx={x2} cy={y2} fill={strokeColor} r={3.5 * progress} />
                </g>
              );
            })}
          </g>
        </Court>

        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0,0,0,0.55)",
            border: `1px solid ${darkCourt.inkMuted}33`,
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-around",
            padding: "16px 20px",
          }}
        >
          <StatPill label="Top speed" value={`${Math.round(topSpeed)} km/h`} />
          <StatPill label="Average" value={`${Math.round(avgSpeed)} km/h`} />
          <StatPill label="Shots shown" value={String(sample.length)} />
        </div>
      </div>

      <InsightCallout
        delay={40}
        orientation="vertical"
        text={`${ctx.hostName}'s fastest tracked shots — color shows whether the point was won.`}
      />
      <MatchScoreBar guestName={ctx.guestName} hostName={ctx.hostName} orientation="vertical" />
    </BroadcastShell>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: darkCourt.ink, fontFamily: condensedFont, fontSize: 26, fontWeight: 700 }}>{value}</div>
      <div style={{ color: darkCourt.inkMuted, fontFamily: bodyFont, fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  );
}
