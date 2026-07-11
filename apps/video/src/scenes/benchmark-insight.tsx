import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { benchmarkProductTheme, benchmarkStory } from "../benchmark-story-data";

export function BenchmarkInsightScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: benchmarkProductTheme.surfaceColors.hard,
        backgroundImage: `linear-gradient(180deg, ${benchmarkProductTheme.background} 0%, ${benchmarkProductTheme.surfaceColors.hard}55 100%)`,
        color: benchmarkProductTheme.ink,
        fontFamily: benchmarkProductTheme.fonts.bodyFont,
        justifyContent: "center",
        padding: "80px 64px",
      }}
    >
      <div
        style={{
          backgroundColor: `${benchmarkProductTheme.background}ee`,
          border: `1px solid ${benchmarkProductTheme.inkMuted}44`,
          borderRadius: 16,
          opacity,
          padding: 32,
        }}
      >
        <p
          style={{
            color: benchmarkProductTheme.playerHost,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Coach read
        </p>
        <p style={{ fontSize: 26, lineHeight: 1.45, marginTop: 16 }}>{benchmarkStory.insight}</p>
        <p style={{ color: benchmarkProductTheme.inkMuted, fontSize: 18, lineHeight: 1.5, marginTop: 20 }}>
          {benchmarkStory.coachInterpretation}
        </p>
      </div>
    </AbsoluteFill>
  );
}
