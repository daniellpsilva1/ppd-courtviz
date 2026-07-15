import { interpolate, useCurrentFrame } from "remotion";
import { motionTokens } from "@ppd/tokens";
import { bodyFont, condensedFont } from "../fonts";
import { PPD, theme } from "../ppd-tokens";

type KineticNumberProps = {
  delay?: number;
  durationInFrames?: number;
  fontFamily?: "condensed" | "body";
  fontSize?: number;
  format?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  value: number;
};

export function KineticNumber({
  delay = 0,
  durationInFrames,
  fontFamily = "condensed",
  fontSize = 48,
  format = (v) => Math.round(v).toString(),
  prefix = "",
  suffix = "",
  value,
}: KineticNumberProps) {
  const frame = useCurrentFrame();

  const duration = durationInFrames ?? motionTokens.durations.normalFrames;
  const localFrame = frame - delay;

  const progress = interpolate(
    localFrame,
    [0, duration],
    [0, 1],
    {
      easing: (t) => 1 - Math.pow(1 - t, 4),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const displayValue = progress * value;
  const font = fontFamily === "condensed" ? condensedFont : bodyFont;

  return (
    <span
      style={{
        color: theme.ink,
        fontFamily: font,
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.03em",
        opacity: interpolate(localFrame, [0, 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {prefix}
      {format(displayValue)}
      {suffix}
    </span>
  );
}

type KineticStatProps = {
  delay?: number;
  label: string;
  suffix?: string;
  value: number;
};

export function KineticStat({ delay = 0, label, suffix = "", value }: KineticStatProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <KineticNumber delay={delay} suffix={suffix} value={value} />
      <div
        style={{
          color: PPD.textMuted,
          fontFamily: bodyFont,
          fontSize: 13,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
