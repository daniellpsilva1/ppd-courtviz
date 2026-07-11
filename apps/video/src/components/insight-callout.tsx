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
  const maxLines = orientation === "vertical" ? 1 : 2;

  const enter = spring({
    config: { damping: 28, stiffness: 200 },
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
          fontFamily: bodyFont,
          fontSize: orientation === "vertical" ? 16 : 19,
          lineHeight: 1.45,
          maxHeight: orientation === "vertical" ? 52 : undefined,
          overflow: "hidden",
          padding: orientation === "vertical" ? "10px 24px" : "14px 28px",
          textOverflow: "ellipsis",
          whiteSpace: orientation === "vertical" && maxLines === 1 ? "nowrap" : "normal",
        }}
      >
        {text}
      </div>
    </div>
  );
}
