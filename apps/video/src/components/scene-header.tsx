import { motionTokens } from "@ppd/tokens";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { bodyFont, condensedFont } from "../fonts";
import { PPD, theme } from "../ppd-tokens";
import { landscapeContentLayout, verticalContentLayout } from "../scene-layout";

type SceneHeaderProps = {
  delay?: number;
  orientation?: "vertical" | "landscape";
  subtitle?: string;
  title: string;
};

export function SceneHeader({ delay = 0, orientation = "landscape", subtitle, title }: SceneHeaderProps) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, height } = useVideoConfig();
  const layout =
    orientation === "vertical"
      ? verticalContentLayout(height)
      : landscapeContentLayout(height);

  const progress = spring({
    config: motionTokens.springs.smooth,
    delay,
    fps,
    frame,
  });

  const exitFade =
    durationInFrames > 0
      ? interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const isVertical = orientation === "vertical";
  const accentSize = interpolate(progress, [0, 1], [0, isVertical ? 40 : 48]);

  return (
    <div
      style={{
        alignItems: "flex-start",
        display: "flex",
        gap: isVertical ? 14 : 0,
        left: layout.sidePadding,
        opacity: progress * exitFade,
        position: "absolute",
        top: layout.headerTop,
        transform: `translateY(${(1 - progress) * -16}px)`,
        zIndex: 10,
      }}
    >
      <div
        style={{
          backgroundColor: PPD.accent,
          flexShrink: 0,
          height: isVertical ? accentSize : 2,
          marginBottom: isVertical ? 0 : 12,
          width: isVertical ? 3 : accentSize,
        }}
      />
      <div>
        <div
          style={{
            color: theme.ink,
            fontFamily: condensedFont,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.03em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              color: PPD.textMuted,
              fontFamily: bodyFont,
              fontSize: 16,
              marginTop: 8,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
