import type { Story } from "@ladle/react";
import { Court, DensityLayer, CentroidAnnotation } from "@courtviz/react";
import { createCourtScales, computeDensity } from "@courtviz/core";
import { broadcast, ppd, ppdEditorial, type CourtvizTheme } from "@courtviz/themes";
import { enrichedShots, guestName, hostName } from "@courtviz/data";

const themes: Record<string, CourtvizTheme> = { broadcast, ppd, ppdEditorial };

export const DensityHost: Story = () => {
  const theme = ppd;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });
  const groundstrokes = enrichedShots.filter(
    (s) => s.player === "host" && s.stroke !== "Serve" && s.result === "In",
  );

  return (
    <div>
      <Court half="near" height={600} surface="clay" theme={theme} width={600}>
        <DensityLayer
          bandwidth={1.2}
          half="near"
          scales={scales}
          shots={groundstrokes}
          theme={theme}
        />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        {hostName} groundstroke density — KDE contours
      </p>
    </div>
  );
};

export const DensityGuest: Story = () => {
  const theme = ppd;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });
  const groundstrokes = enrichedShots.filter(
    (s) => s.player === "guest" && s.stroke !== "Serve" && s.result === "In",
  );

  return (
    <div>
      <Court half="near" height={600} surface="hard" theme={theme} width={600}>
        <DensityLayer
          bandwidth={1.2}
          half="near"
          scales={scales}
          shots={groundstrokes}
          theme={theme}
        />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        {guestName} groundstroke density — KDE contours
      </p>
    </div>
  );
};

export const DensityWithAnnotation: Story = () => {
  const theme = ppdEditorial;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });
  const groundstrokes = enrichedShots.filter(
    (s) => s.player === "host" && s.stroke !== "Serve" && s.result === "In",
  );

  const contours = computeDensity(
    { x: groundstrokes.map((s) => s.bounceX!), y: groundstrokes.map((s) => s.bounceY!) },
    { bandwidth: 1.2, half: "near", thresholds: 6 },
  );
  const peakContour = contours[contours.length - 1];

  return (
    <div>
      <Court half="near" height={600} surface="clay" theme={theme} width={600}>
        <DensityLayer
          bandwidth={1.2}
          half="near"
          scales={scales}
          shots={groundstrokes}
          theme={theme}
        />
        {peakContour && (
          <CentroidAnnotation
            contour={peakContour}
            offset={{ x: 50, y: -30 }}
            scales={scales}
            subtext="Peak concentration zone"
            text="HOT ZONE"
            theme={theme}
          />
        )}
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        Density with centroid-based smart annotation
      </p>
    </div>
  );
};

export const DensityDarkTheme: Story = () => {
  const theme = broadcast;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });
  const groundstrokes = enrichedShots.filter(
    (s) => s.player === "host" && s.stroke !== "Serve" && s.result === "In",
  );

  return (
    <div>
      <Court half="near" height={600} surface="hard" theme={theme} width={600}>
        <DensityLayer
          bandwidth={1.2}
          half="near"
          scales={scales}
          shots={groundstrokes}
          theme={theme}
        />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        {hostName} density — broadcast dark theme
      </p>
    </div>
  );
};
