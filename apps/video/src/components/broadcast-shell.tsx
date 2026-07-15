import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { signatureDevices } from "@ppd/tokens";
import { PPD, theme } from "../ppd-tokens";

type BroadcastShellProps = {
  children: React.ReactNode;
};

export function BroadcastShell({ children }: BroadcastShellProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <AmbientBackground />
      <BaselineRuleBar />
      {children}
    </AbsoluteFill>
  );
}

function AmbientBackground() {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 24], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          background: `radial-gradient(circle at 18% 22%, ${theme.playerGuest}12 0%, transparent 50%)`,
          height: "100%",
          left: -drift,
          position: "absolute",
          top: 0,
          width: "55%",
        }}
      />
      <div
        style={{
          background: `radial-gradient(circle at 82% 78%, ${theme.playerHost}10 0%, transparent 50%)`,
          height: "100%",
          position: "absolute",
          right: -drift * 0.5,
          top: 0,
          width: "55%",
        }}
      />
      <div
        style={{
          backgroundImage: `linear-gradient(${PPD.border}55 1px, transparent 1px), linear-gradient(90deg, ${PPD.border}55 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          height: "120%",
          left: -36,
          opacity: 0.18,
          position: "absolute",
          top: -36,
          transform: `translateY(${drift * 0.1}px)`,
          width: "120%",
        }}
      />
    </AbsoluteFill>
  );
}

function BaselineRuleBar() {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentW = signatureDevices.baselineRule.accentWidth;
  const barH = signatureDevices.baselineRule.height;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          background: PPD.border,
          bottom: 0,
          height: barH,
          left: 0,
          position: "absolute",
          width: "100%",
        }}
      />
      <div
        style={{
          background: theme.playerHost,
          bottom: 0,
          height: barH,
          left: 0,
          position: "absolute",
          transform: `scaleX(${sweep})`,
          transformOrigin: "left center",
          width: `${accentW * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
}
