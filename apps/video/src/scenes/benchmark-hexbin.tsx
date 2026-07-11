import { enrichedShots } from "@courtviz/data/fixtures";
import { CourtSurface, HexbinLayer, useCourtScales } from "@courtviz/react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_SURFACE } from "../brand-surface";
import { benchmarkProductTheme, benchmarkStory } from "../benchmark-story-data";

const COURT_W = 720;
const COURT_H = 1180;

function HostHexbinReveal({ theme }: { theme: typeof benchmarkProductTheme }) {
  const scales = useCourtScales();
  return (
    <HexbinLayer
      gridsize={6}
      half="full"
      player="host"
      scales={scales}
      shots={enrichedShots}
      sizeRange={[0.25, 0.65]}
      theme={theme}
    />
  );
}

export function BenchmarkHexbinScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor: benchmarkProductTheme.background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 48px 140px",
      }}
    >
      <div style={{ textAlign: "center", width: "100%" }}>
        <p
          style={{
            color: benchmarkProductTheme.inkMuted,
            fontFamily: benchmarkProductTheme.fonts.condensedFont,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Territorial efficiency
        </p>
        <p
          style={{
            color: benchmarkProductTheme.playerHost,
            fontFamily: benchmarkProductTheme.fonts.condensedFont,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1,
            marginTop: 12,
          }}
        >
          {benchmarkStory.frozenMetrics.hostTopZoneWinPct}%
        </p>
        <p style={{ color: benchmarkProductTheme.inkMuted, fontSize: 18, marginTop: 8 }}>
          deuce-side win rate
        </p>
      </div>

      <div
        style={{
          opacity: reveal,
          transform: `scale(${interpolate(reveal, [0, 1], [0.94, 1])})`,
        }}
      >
        <svg height={COURT_H + 40} viewBox={`0 0 ${COURT_W + 120} ${COURT_H + 40}`} width={COURT_W + 120}>
          <CourtSurface
            height={COURT_H}
            idPrefix="benchmark-hex"
            offsetX={60}
            surface={BRAND_SURFACE}
            theme={benchmarkProductTheme}
            width={COURT_W}
          >
            <HostHexbinReveal theme={benchmarkProductTheme} />
          </CourtSurface>
        </svg>
      </div>

      <p
        style={{
          color: benchmarkProductTheme.inkMuted,
          fontFamily: benchmarkProductTheme.fonts.bodyFont,
          fontSize: 20,
          maxWidth: 900,
          textAlign: "center",
        }}
      >
        {benchmarkStory.hostName} controlled the deuce court — peak pressure zone
      </p>
    </AbsoluteFill>
  );
}
