/**
 * Hard broadcast-style scorebug — shared by interactive replay and export.
 * Avoids soft SaaS cards (no drop-shadow pills / full wordmark lockups).
 */

import { memo } from "react";
import type { ScoreState, Side } from "@courtviz/core";
import { colorPrimitives, layout, sportColors } from "@ppd/tokens";
import type { CourtvizTheme } from "@courtviz/themes";
import { ppd } from "@courtviz/themes";

export interface BroadcastScorebugProps {
  hostName: string;
  guestName: string;
  score: ScoreState;
  server?: Side | null;
  theme?: CourtvizTheme;
  width?: number;
  /** Compact for nested courts */
  compact?: boolean;
  className?: string;
}

function truncateName(name: string, max: number): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export const BroadcastScorebug = memo(function BroadcastScorebug({
  hostName,
  guestName,
  score,
  server = null,
  theme = ppd,
  width = 420,
  compact = false,
  className,
}: BroadcastScorebugProps) {
  const h = compact
    ? 44
    : (layout as { chrome?: { vertical?: { scoreBar?: number } } }).chrome
        ?.vertical?.scoreBar ?? 66;
  const notch = layout.signatureDevices.cornerNotch.size;
  const padX = compact ? 10 : 14;
  const nameSize = compact ? 11 : 13;
  const scoreSize = compact ? 14 : 18;
  const accent = theme.playerHost;
  const guestAccent = theme.playerGuest;
  const bg = theme.background;
  const fg = theme.ink;
  const muted = theme.inkMuted;
  const border = theme.border;

  return (
    <div
      className={className}
      style={{
        width,
        height: h,
        display: "flex",
        alignItems: "stretch",
        background: bg,
        color: fg,
        fontFamily: `${theme.fonts.condensedFont}, ${theme.fonts.condensedFontFallback}`,
        position: "relative",
        border: `1px solid ${border}`,
        boxSizing: "border-box",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: notch,
          height: notch,
          borderLeft: `${layout.signatureDevices.cornerNotch.strokeWidth}px solid ${accent}`,
          borderTop: `${layout.signatureDevices.cornerNotch.strokeWidth}px solid ${accent}`,
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: notch,
          height: notch,
          borderRight: `${layout.signatureDevices.cornerNotch.strokeWidth}px solid ${guestAccent}`,
          borderBottom: `${layout.signatureDevices.cornerNotch.strokeWidth}px solid ${guestAccent}`,
        }}
      />

      <Row
        name={truncateName(hostName, compact ? 10 : 16)}
        point={
          score.isTiebreak
            ? score.pointLabel.split("-")[0]!
            : formatFigure(score.hostPoints)
        }
        games={score.hostGames}
        sets={score.hostSets}
        serving={server === "host"}
        accent={accent}
        fg={fg}
        muted={muted}
        padX={padX}
        nameSize={nameSize}
        scoreSize={scoreSize}
        align="left"
      />

      <div
        style={{
          width: 1,
          background: muted,
          opacity: 0.35,
          margin: "8px 0",
        }}
      />

      <Row
        name={truncateName(guestName, compact ? 10 : 16)}
        point={
          score.isTiebreak
            ? score.pointLabel.split("-")[1]!
            : formatFigure(score.guestPoints)
        }
        games={score.guestGames}
        sets={score.guestSets}
        serving={server === "guest"}
        accent={guestAccent}
        fg={fg}
        muted={muted}
        padX={padX}
        nameSize={nameSize}
        scoreSize={scoreSize}
        align="right"
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: layout.signatureDevices.baselineRule.height,
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} ${layout.signatureDevices.baselineRule.accentWidth * 100}%, ${sportColors.playerGuest} ${layout.signatureDevices.baselineRule.accentWidth * 100}%, ${colorPrimitives.inkSubtle} 100%)`,
          opacity: 0.95,
        }}
      />
    </div>
  );
});

function formatFigure(p: ScoreState["hostPoints"]): string {
  return p === "AD" ? "AD" : String(p);
}

function Row({
  name,
  point,
  games,
  sets,
  serving,
  accent,
  fg,
  muted,
  padX,
  nameSize,
  scoreSize,
  align,
}: {
  name: string;
  point: string;
  games: number;
  sets: number;
  serving: boolean;
  accent: string;
  fg: string;
  muted: string;
  padX: number;
  nameSize: number;
  scoreSize: number;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: align === "left" ? "flex-start" : "flex-end",
        gap: 8,
        padding: `0 ${padX}px`,
        minWidth: 0,
      }}
    >
      {align === "left" && (
        <>
          <ServePip active={serving} color={accent} />
          <NameBlock name={name} size={nameSize} fg={fg} />
          <Nums
            point={point}
            games={games}
            sets={sets}
            scoreSize={scoreSize}
            muted={muted}
            fg={fg}
          />
        </>
      )}
      {align === "right" && (
        <>
          <Nums
            point={point}
            games={games}
            sets={sets}
            scoreSize={scoreSize}
            muted={muted}
            fg={fg}
          />
          <NameBlock name={name} size={nameSize} fg={fg} />
          <ServePip active={serving} color={accent} />
        </>
      )}
    </div>
  );
}

function NameBlock({
  name,
  size,
  fg,
}: {
  name: string;
  size: number;
  fg: string;
}) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: fg,
        minWidth: 0,
      }}
    >
      {name}
    </span>
  );
}

function Nums({
  point,
  games,
  sets,
  scoreSize,
  muted,
  fg,
}: {
  point: string;
  games: number;
  sets: number;
  scoreSize: number;
  muted: string;
  fg: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ fontSize: scoreSize, fontWeight: 700, color: fg }}>
        {point}
      </span>
      <span style={{ fontSize: scoreSize - 4, fontWeight: 600, color: muted }}>
        {games}
      </span>
      <span
        style={{
          fontSize: scoreSize - 6,
          fontWeight: 600,
          color: muted,
          opacity: 0.85,
        }}
      >
        {sets}
      </span>
    </div>
  );
}

function ServePip({ active, color }: { active: boolean; color: string }) {
  return (
    <span
      aria-label={active ? "Serving" : undefined}
      style={{
        width: 7,
        height: 7,
        borderRadius: 0,
        background: active ? color : "transparent",
        border: `1px solid ${active ? color : "transparent"}`,
        flexShrink: 0,
      }}
    />
  );
}
