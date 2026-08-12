"use client";

/**
 * Browser point-by-point 2D court replay driven by PlaybackClock.
 * Pacing is reconstructed when video timestamps are absent.
 */

import { memo, useId, useMemo } from "react";
import {
  curvedPath,
  type EnrichedShot,
  type Surface,
} from "@courtviz/core";
import type { CourtvizTheme } from "@courtviz/themes";
import { ppd } from "@courtviz/themes";
import { Court } from "./court";
import { useCourtScales } from "./court-scales-context";
import { BroadcastScorebug } from "./broadcast-scorebug";
import { usePlaybackClock } from "./use-playback-clock";

export interface PointReplayCourtProps {
  shots: EnrichedShot[];
  hostName?: string;
  guestName?: string;
  surface?: Surface;
  theme?: CourtvizTheme;
  width?: number;
  height?: number;
  /** Show transport controls under the court */
  showControls?: boolean;
  /** Show broadcast scorebug */
  showScorebug?: boolean;
  autoPlay?: boolean;
  className?: string;
}

export const PointReplayCourt = memo(function PointReplayCourt({
  shots,
  hostName = "Host",
  guestName = "Guest",
  surface = "hard",
  theme = ppd,
  width = 480,
  height = 640,
  showControls = true,
  showScorebug = true,
  autoPlay = false,
  className,
}: PointReplayCourtProps) {
  const {
    playback,
    state,
    play,
    pause,
    toggle,
    seek,
    stepShot,
    stepPoint,
    isPlaying,
  } = usePlaybackClock({ shots, autoPlay });

  const ep = state.episode;
  const pointLabel = ep
    ? `Set ${ep.setNumber} · Game ${ep.gameNumber} · Pt ${ep.pointNumber}`
    : "No points";

  return (
    <div
      className={className}
      data-testid="point-replay-court"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width,
        background: theme.background,
        color: theme.ink,
        fontFamily: `${theme.fonts.bodyFont}, ${theme.fonts.bodyFontFallback}`,
      }}
    >
      {showScorebug && (
        <BroadcastScorebug
          hostName={hostName}
          guestName={guestName}
          score={state.score}
          server={ep?.server ?? null}
          theme={theme}
          width={width}
        />
      )}

      <div style={{ position: "relative", width, height }}>
        <Court
          surface={surface}
          theme={theme}
          width={width}
          height={height}
          accessibleSummary={`Point-by-point replay. ${pointLabel}. Score ${state.score.pointLabel}.`}
        >
          <ReplayOverlay
            stateBall={state.ball}
            episodeShots={ep?.shots ?? []}
            shotIndex={state.shotIndex}
            shotProgress={state.shotProgress}
            theme={theme}
          />
        </Court>
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 12,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: theme.inkMuted,
            background: `${theme.background}CC`,
            padding: "4px 8px",
          }}
        >
          {pointLabel}
          <span style={{ marginLeft: 8, opacity: 0.8 }}>
            (reconstructed pace)
          </span>
        </div>
      </div>

      {showControls && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            type="range"
            min={0}
            max={playback.totalDurationSec || 1}
            step={1 / playback.fps}
            value={state.timeSec}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek replay"
            style={{ width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ctrl onClick={() => stepPoint(-1)} label="Prev point" />
            <Ctrl onClick={() => stepShot(-1)} label="Prev shot" />
            <Ctrl
              onClick={() => (isPlaying ? pause() : play())}
              label={isPlaying ? "Pause" : "Play"}
              primary
            />
            <Ctrl onClick={() => stepShot(1)} label="Next shot" />
            <Ctrl onClick={() => stepPoint(1)} label="Next point" />
            <button
              type="button"
              onClick={toggle}
              style={{ display: "none" }}
              aria-hidden
            />
            <span style={{ fontSize: 12, color: theme.inkMuted, marginLeft: "auto" }}>
              {formatTime(state.timeSec)} / {formatTime(playback.totalDurationSec)}
              {" · "}
              {playback.episodes.length} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

function Ctrl({
  onClick,
  label,
  primary,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "6px 10px",
        border: primary ? "1px solid #3B82F6" : "1px solid #334155",
        background: primary ? "#1D4ED8" : "transparent",
        color: "#F8FAFC",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function formatTime(sec: number): string {
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ReplayOverlay({
  stateBall,
  episodeShots,
  shotIndex,
  shotProgress,
  theme,
}: {
  stateBall: { x: number; y: number } | null;
  episodeShots: {
    hitX: number;
    hitY: number;
    bounceX: number;
    bounceY: number;
    shot: EnrichedShot;
  }[];
  shotIndex: number;
  shotProgress: number;
  theme: CourtvizTheme;
}) {
  const scales = useCourtScales();
  const gradId = useId();

  const trails = useMemo(() => {
    return episodeShots.map((s, i) => {
      const d = curvedPath(
        scales.x(s.hitX),
        scales.y(s.hitY),
        scales.x(s.bounceX),
        scales.y(s.bounceY),
        0.12,
      );
      const done = i < shotIndex || (i === shotIndex && shotProgress >= 1);
      const active = i === shotIndex;
      const color =
        s.shot.player === "guest" ? theme.playerGuest : theme.playerHost;
      return { d, done, active, color, bounceX: s.bounceX, bounceY: s.bounceY, hitX: s.hitX, hitY: s.hitY };
    });
  }, [episodeShots, scales, shotIndex, shotProgress, theme]);

  return (
    <g aria-hidden>
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0%" stopColor="#fff" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0.15} />
        </radialGradient>
      </defs>
      {trails.map((t, i) => (
        <g key={i}>
          <path
            d={t.d}
            fill="none"
            stroke={t.color}
            strokeWidth={t.active ? 2.5 : 1.5}
            strokeOpacity={t.done || t.active ? (t.active ? 0.95 : 0.35) : 0.12}
            strokeLinecap="round"
          />
          <circle
            cx={scales.x(t.bounceX)}
            cy={scales.y(t.bounceY)}
            r={t.done || t.active ? 4 : 2}
            fill={t.color}
            opacity={t.done || t.active ? 0.85 : 0.2}
          />
          {(t.done || t.active) && (
            <circle
              cx={scales.x(t.hitX)}
              cy={scales.y(t.hitY)}
              r={3}
              fill="none"
              stroke={t.color}
              strokeWidth={1}
              opacity={0.5}
            />
          )}
        </g>
      ))}
      {stateBall && (
        <circle
          cx={scales.x(stateBall.x)}
          cy={scales.y(stateBall.y)}
          r={5}
          fill={`url(#${gradId})`}
          stroke="#F8FAFC"
          strokeWidth={1.25}
        />
      )}
    </g>
  );
}
