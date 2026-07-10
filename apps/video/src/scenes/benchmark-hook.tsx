import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { benchmarkStory } from "../benchmark-story-data";
import { benchmarkProductTheme } from "../benchmark-story-data";

export function BenchmarkHookScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 25], [40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: benchmarkProductTheme.background,
        color: benchmarkProductTheme.ink,
        fontFamily: benchmarkProductTheme.fonts.bodyFont,
        justifyContent: "flex-end",
        padding: "120px 64px 200px",
      }}
    >
      <p
        style={{
          color: benchmarkProductTheme.playerHost,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 4,
          opacity,
          textTransform: "uppercase",
        }}
      >
        PPD Insights
      </p>
      <h1
        style={{
          fontFamily: benchmarkProductTheme.fonts.condensedFont,
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: 1,
          lineHeight: 1.05,
          marginTop: 16,
          opacity,
          textTransform: "uppercase",
          transform: `translateY(${y}px)`,
        }}
      >
        {benchmarkStory.title}
      </h1>
      <p style={{ color: benchmarkProductTheme.inkMuted, fontSize: 22, marginTop: 20, opacity }}>
        {benchmarkStory.hostName} def. {benchmarkStory.guestName} · {benchmarkStory.setScore}
      </p>
      <p style={{ fontSize: 18, marginTop: 12, opacity: opacity * 0.9 }}>
        {benchmarkStory.editorialQuestion}
      </p>
    </AbsoluteFill>
  );
}
