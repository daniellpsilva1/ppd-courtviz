import { motionTokens } from "@ppd/tokens";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { bodyFont } from "../fonts";
import { chromeOffsets } from "../scene-layout";
import { PPD, theme } from "../ppd-tokens";

type InsightCalloutProps = {
  delay?: number;
  orientation?: "vertical" | "landscape";
  text: string;
};

export function InsightCallout({ delay = 20, orientation = "landscape", text }: InsightCalloutProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { insightBottom } = chromeOffsets(orientation);
  const maxWidth = orientation === "vertical" ? 920 : 1100;

  const enter = spring({
    config: motionTokens.springs.smooth,
    delay,
    fps,
    frame,
  });

  return (
    <div
      style={{
        bottom: insightBottom,
        left: "50%",
        maxWidth,
        opacity: enter,
        position: "absolute",
        transform: `translateX(-50%) translateY(${(1 - enter) * 10}px)`,
        zIndex: 15,
      }}
    >
      <div
        style={{
          backgroundColor: theme.annotation.calloutFill,
          border: `1px solid ${PPD.border}`,
          borderLeft: `3px solid ${PPD.primary}`,
          borderRadius: 8,
          color: theme.annotation.calloutTextColor,
          display: "-webkit-box",
          fontFamily: bodyFont,
          fontSize: orientation === "vertical" ? 16 : 19,
          lineHeight: 1.4,
          maxHeight: orientation === "vertical" ? 72 : 56,
          overflow: "hidden",
          padding: orientation === "vertical" ? "10px 24px" : "14px 28px",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        {text}
      </div>
    </div>
  );
}
