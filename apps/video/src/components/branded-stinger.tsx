import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { motionTokens, signatureDevices } from "@ppd/tokens";
import { PpdLogo } from "./ppd-logo";
import { bodyFont, condensedFont } from "../fonts";
import { PPD, theme } from "../ppd-tokens";

type StingerProps = {
  durationInFrames?: number;
};

export function BrandedStinger({ durationInFrames }: StingerProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const duration = durationInFrames ?? motionTokens.durations.stingerFrames;
  const localFrame = frame;

  if (localFrame > duration) return null;

  const logoSpring = spring({
    config: motionTokens.springs.smooth,
    fps,
    frame: localFrame,
  });

  const lineWidth = interpolate(localFrame, [6, 24], [0, 120], {
    easing: (t) => 1 - Math.pow(1 - t, 3),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(localFrame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(localFrame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const accentW = signatureDevices.baselineRule.accentWidth;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor: theme.background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          opacity: logoSpring,
          transform: `scale(${interpolate(logoSpring, [0, 1], [0.92, 1])})`,
        }}
      >
        <PpdLogo height={72} width={72} />
        <div
          style={{
            color: theme.ink,
            fontFamily: condensedFont,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.08em",
            opacity: textOpacity,
            textTransform: "uppercase",
          }}
        >
          Peak Performance Data
        </div>
        <div
          style={{
            background: PPD.border,
            height: signatureDevices.baselineRule.height,
            width: lineWidth,
          }}
        />
        <div
          style={{
            color: PPD.textMuted,
            fontFamily: bodyFont,
            fontSize: 12,
            letterSpacing: "0.2em",
            opacity: textOpacity,
            textTransform: "uppercase",
          }}
        >
          Courtviz
        </div>
      </div>

      {/* Baseline rule accent sweep */}
      <div
        style={{
          background: theme.playerHost,
          bottom: 0,
          height: signatureDevices.baselineRule.height,
          left: 0,
          position: "absolute",
          transform: `scaleX(${interpolate(localFrame, [0, duration], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          transformOrigin: "left center",
          width: `${accentW * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
}
