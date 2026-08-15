import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { signatureDevices } from "@ppd/tokens";
import { PPD, theme } from "../ppd-tokens";
import { getSceneTheme, SceneThemeContext } from "./scene-theme-context";

type BroadcastShellProps = {
  children: React.ReactNode;
  variant?: "broadcast" | "social";
};

export function BroadcastShell({ children, variant = "broadcast" }: BroadcastShellProps) {
  const sceneTheme = getSceneTheme(variant);
  return (
    <SceneThemeContext.Provider value={sceneTheme}>
      <AbsoluteFill style={{ backgroundColor: sceneTheme.background }}>
        <AmbientBackground variant={variant} sceneTheme={sceneTheme} />
        <BaselineRuleBar variant={variant} sceneTheme={sceneTheme} />
        {children}
      </AbsoluteFill>
    </SceneThemeContext.Provider>
  );
}

function AmbientBackground({ variant = "broadcast", sceneTheme }: { variant?: "broadcast" | "social"; sceneTheme: typeof theme }) {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 24], {
    extrapolateRight: "extend",
  });

  const isSocial = variant === "social";
  const guestGlow = isSocial ? "08" : "12";
  const hostGlow = isSocial ? "06" : "10";
  const gridOpacity = isSocial ? 0.06 : 0.18;
  const gridSize = isSocial ? "120px 120px" : "72px 72px";

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          background: `radial-gradient(circle at 18% 22%, ${sceneTheme.playerGuest}${guestGlow} 0%, transparent 50%)`,
          height: "100%",
          left: -drift,
          position: "absolute",
          top: 0,
          width: "55%",
        }}
      />
      <div
        style={{
          background: `radial-gradient(circle at 82% 78%, ${sceneTheme.playerHost}${hostGlow} 0%, transparent 50%)`,
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
          backgroundSize: gridSize,
          height: "120%",
          left: -36,
          opacity: gridOpacity,
          position: "absolute",
          top: -36,
          transform: `translateY(${drift * 0.1}px)`,
          width: "120%",
        }}
      />
    </AbsoluteFill>
  );
}

function BaselineRuleBar({ variant = "broadcast", sceneTheme }: { variant?: "broadcast" | "social"; sceneTheme: typeof theme }) {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentW = signatureDevices.baselineRule.accentWidth;
  const barH = variant === "social" ? 1 : signatureDevices.baselineRule.height;

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
          background: sceneTheme.playerHost,
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
