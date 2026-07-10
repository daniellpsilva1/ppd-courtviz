import { enrichedShots } from "@courtviz/data/fixtures";
import { CourtSurface, HexbinLayer, useCourtScales } from "@courtviz/react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { benchmarkProductTheme, benchmarkStory } from "../benchmark-story-data";

function HostHexbinReveal({ theme }: { theme: typeof benchmarkProductTheme }) {
  const scales = useCourtScales();
  return (
    <HexbinLayer
      gridsize={6}
      half="full"
      player="host"
      scales={scales}
      shots={enrichedShots}
      theme={theme}
    />
  );
}

export function BenchmarkHexbinScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: benchmarkProductTheme.background, padding: 48 }}>
      <p
        style={{
          color: benchmarkProductTheme.inkMuted,
          fontFamily: benchmarkProductTheme.fonts.condensedFont,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Territorial efficiency
      </p>
      <div style={{ marginTop: 24, opacity: reveal, transform: `scale(${interpolate(reveal, [0, 1], [0.92, 1])})` }}>
        <svg height={780} viewBox="0 0 984 780" width={984}>
          <CourtSurface
            height={720}
            idPrefix="benchmark-hex"
            offsetX={132}
            surface={benchmarkStory.surface}
            theme={benchmarkProductTheme}
            width={720}
          >
            <HostHexbinReveal theme={benchmarkProductTheme} />
          </CourtSurface>
        </svg>
      </div>
      <p
        style={{
          color: benchmarkProductTheme.playerHost,
          fontFamily: benchmarkProductTheme.fonts.bodyFont,
          fontSize: 24,
          marginTop: 16,
        }}
      >
        {benchmarkStory.frozenMetrics.hostTopZoneWinPct}% deuce-side win rate
      </p>
    </AbsoluteFill>
  );
}
