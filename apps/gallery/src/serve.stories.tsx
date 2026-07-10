import type { Story } from "@ladle/react";
import { Court, ServeLayer, ServeAnnotations } from "@courtviz/react";
import { computeServeZones, createCourtScales } from "@courtviz/core";
import { ppd } from "@courtviz/themes";
import { enrichedShots, guestName, hostName } from "@courtviz/data";

export const ServePlacementBoth: Story = () => {
  const theme = ppd;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });

  return (
    <div>
      <Court half="near" height={600} surface="clay" theme={theme} width={600}>
        <ServeLayer
          player="host"
          scales={scales}
          shots={enrichedShots}
          theme={theme}
        />
        <ServeLayer
          player="guest"
          scales={scales}
          shots={enrichedShots}
          theme={theme}
        />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        Serve placement — {hostName} (blue) vs {guestName} (orange), faded = out
      </p>
    </div>
  );
};

export const FirstServeHost: Story = () => {
  const theme = ppd;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });

  return (
    <div>
      <Court half="near" height={600} surface="clay" theme={theme} width={600}>
        <ServeLayer
          player="host"
          scales={scales}
          serveType="first_serve"
          shots={enrichedShots}
          theme={theme}
        />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        {hostName} — 1st serve placement
      </p>
    </div>
  );
};

export const SecondServeHost: Story = () => {
  const theme = ppd;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });

  return (
    <div>
      <Court half="near" height={600} surface="clay" theme={theme} width={600}>
        <ServeLayer
          player="host"
          scales={scales}
          serveType="second_serve"
          shots={enrichedShots}
          theme={theme}
        />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        {hostName} — 2nd serve placement
      </p>
    </div>
  );
};

export const ServeWithAnnotations: Story = () => {
  const theme = ppd;
  const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });
  const hostZones = computeServeZones(enrichedShots, "host");

  return (
    <div>
      <Court half="near" height={600} surface="clay" theme={theme} width={600}>
        <ServeLayer
          player="host"
          scales={scales}
          shots={enrichedShots}
          theme={theme}
        />
        <ServeAnnotations scales={scales} theme={theme} zones={hostZones} />
      </Court>
      <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 8 }}>
        {hostName} — serve placement with editorial callouts
      </p>
    </div>
  );
};

export const ServeSideBySide: Story = () => {
  const theme = ppd;

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      {(["first_serve", "second_serve"] as const).map((serveType) => {
        const scales = createCourtScales({ half: "near", height: 500, margin: 1.5, width: 500 });
        return (
          <div key={serveType} style={{ textAlign: "center" }}>
            <Court half="near" height={500} surface="clay" theme={theme} width={500}>
              <ServeLayer
                player="host"
                scales={scales}
                serveType={serveType}
                shots={enrichedShots}
                theme={theme}
              />
              <ServeLayer
                player="guest"
                scales={scales}
                serveType={serveType}
                shots={enrichedShots}
                theme={theme}
              />
            </Court>
            <p style={{ color: theme.ink, fontFamily: "Inter, sans-serif", fontSize: 12, marginTop: 4 }}>
              {serveType === "first_serve" ? "1ST SERVE" : "2ND SERVE"}
            </p>
          </div>
        );
      })}
    </div>
  );
};
