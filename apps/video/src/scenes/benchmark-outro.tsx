import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { benchmarkProductTheme, benchmarkStory } from "../benchmark-story-data";

export function BenchmarkOutroScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor: benchmarkProductTheme.background,
        color: benchmarkProductTheme.ink,
        display: "flex",
        flexDirection: "column",
        fontFamily: benchmarkProductTheme.fonts.bodyFont,
        justifyContent: "center",
        padding: 64,
        textAlign: "center",
      }}
    >
      <p
        style={{
          color: benchmarkProductTheme.playerHost,
          fontFamily: benchmarkProductTheme.fonts.condensedFont,
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: 2,
          opacity,
          textTransform: "uppercase",
        }}
      >
        Peak Performance Data
      </p>
      <p style={{ fontSize: 22, marginTop: 20, opacity }}>{benchmarkStory.cta}</p>
      <p style={{ color: benchmarkProductTheme.inkMuted, fontSize: 14, marginTop: 32, opacity }}>
        {benchmarkStory.source}
      </p>
    </AbsoluteFill>
  );
}
