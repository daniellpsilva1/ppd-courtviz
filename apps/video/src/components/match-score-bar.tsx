import { motionTokens } from "@ppd/tokens";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { bodyFont, condensedFont } from "../fonts";
import { formatSetScoreFromSets } from "../match-stats";
import { getVideoMatchContext } from "../match-data";
import { chromeOffsets } from "../scene-layout";
import { PpdLogo } from "./ppd-logo";
import { PPD } from "../ppd-tokens";
import { useSceneTheme } from "./scene-theme-context";

type MatchScoreBarProps = {
  guestName: string;
  hostName: string;
  orientation?: "vertical" | "landscape";
};

export function MatchScoreBar({
  guestName,
  hostName,
  orientation = "landscape",
}: MatchScoreBarProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneTheme = useSceneTheme();
  const ctx = getVideoMatchContext();
  const { scoreBottom } = chromeOffsets(orientation);

  const slideIn = spring({
    config: motionTokens.springs.smooth,
    delay: 10,
    fps,
    frame,
  });

  return (
    <div
      style={{
        bottom: scoreBottom,
        left: "50%",
        opacity: interpolate(slideIn, [0, 1], [0, 1]),
        position: "absolute",
        transform: `translateX(-50%) translateY(${(1 - slideIn) * 20}px)`,
        zIndex: 30,
      }}
    >
      <div
        style={{
          alignItems: "center",
          backgroundColor: PPD.surface,
          border: `1px solid ${PPD.border}66`,
          borderRadius: PPD.radius.md,
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          display: "flex",
          gap: 24,
          padding: "14px 28px",
        }}
      >
        <span
          style={{
            color: sceneTheme.playerHost,
            fontFamily: condensedFont,
            fontSize: 18,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {hostName}
        </span>
        <span
          style={{
            color: sceneTheme.ink,
            fontFamily: condensedFont,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {formatSetScoreFromSets(ctx.sets)}
        </span>
        <span
          style={{
            color: sceneTheme.playerGuest,
            fontFamily: condensedFont,
            fontSize: 18,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {guestName}
        </span>
        <div
          style={{
            backgroundColor: PPD.border,
            height: 28,
            width: 1,
          }}
        />
        <PpdLogo height={28} width={28} />
        {orientation !== "vertical" ? (
          <span
            style={{
              color: PPD.textMuted,
              fontFamily: bodyFont,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Peak Performance Data
          </span>
        ) : null}
      </div>
    </div>
  );
}
