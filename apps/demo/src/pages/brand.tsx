import { useMemo, useState } from "react";
import { Court, HexbinLayer, FigureFrame } from "@courtviz/react";
import { createCourtScales } from "@courtviz/core";
import {
  broadcast,
  ppd,
  ppdLight,
  sprawlball,
  type CourtvizTheme,
} from "@courtviz/themes";
import {
  chartPalette,
  colorPrimitives,
  semanticColors,
  sportColors,
  tokens,
  typography,
} from "@ppd/tokens";
import { enrichedShots, guestName, hostName, surface } from "@courtviz/data";

const themeOptions: Array<{ key: string; theme: CourtvizTheme; label: string }> = [
  { key: "ppd", label: "PPD (default)", theme: ppd },
  { key: "ppdLight", label: "PPD Light", theme: ppdLight },
  { key: "broadcast", label: "Broadcast", theme: broadcast },
  { key: "sprawlball", label: "SprawlBall (legacy)", theme: sprawlball },
];

const exportFormats = ["square", "portrait", "story", "landscape"] as const;

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="swatch">
      <div className="swatch-color" style={{ background: color }} />
      <div className="swatch-label">
        <strong>{label}</strong>
        <span>{color}</span>
      </div>
    </div>
  );
}

export function BrandPage() {
  const [previewTheme, setPreviewTheme] = useState("ppd");
  const theme = themeOptions.find((t) => t.key === previewTheme)?.theme ?? ppd;

  const hostShots = useMemo(
    () => enrichedShots.filter((s) => s.player === "host" && s.stroke !== "Serve"),
    [],
  );
  const scales = useMemo(
    () => createCourtScales({ half: "near", height: 360, margin: 1.5, width: 360 }),
    [],
  );

  return (
    <div className="page brand-page">
      <header className="page-header">
        <h2>Brand System</h2>
        <p>
          Unified PPD design tokens — {hostName} vs {guestName}, {surface}
        </p>
      </header>

      <section className="brand-section">
        <h3>Color primitives</h3>
        <div className="swatch-grid">
          {Object.entries(colorPrimitives).slice(0, 12).map(([name, hex]) => (
            <Swatch color={hex} key={name} label={name} />
          ))}
        </div>
      </section>

      <section className="brand-section">
        <h3>Semantic roles (dark)</h3>
        <div className="swatch-grid">
          {Object.entries(semanticColors.dark).map(([name, hex]) => (
            <Swatch color={hex} key={name} label={name} />
          ))}
        </div>
      </section>

      <section className="brand-section">
        <h3>Chart palette</h3>
        <div className="swatch-grid">
          {chartPalette.map((hex, i) => (
            <Swatch color={hex} key={hex} label={`chart-${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="brand-section">
        <h3>Sport encoding</h3>
        <div className="swatch-grid">
          <Swatch color={sportColors.playerHost} label="playerHost" />
          <Swatch color={sportColors.playerGuest} label="playerGuest" />
          <Swatch color={sportColors.diverging.low} label="diverging.low" />
          <Swatch color={sportColors.diverging.mid} label="diverging.mid" />
          <Swatch color={sportColors.diverging.peak} label="diverging.peak" />
          <Swatch color={sportColors.surface.clay} label="surface.clay" />
        </div>
      </section>

      <section className="brand-section">
        <h3>Typography ramp</h3>
        <div className="type-ramp">
          {Object.entries(typography.sizes).map(([name, size]) => (
            <div className="type-sample" key={name}>
              <span className="type-meta">{name} · {size}px</span>
              <p
                style={{
                  fontFamily: name.startsWith("figure") || name === "title"
                    ? typography.families.condensed
                    : typography.families.body,
                  fontSize: size,
                  margin: 0,
                }}
              >
                {name.startsWith("figure") || name === "title"
                  ? "PEAK PERFORMANCE DATA"
                  : "Unified athlete intelligence for tennis academies"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="brand-section">
        <h3>Theme comparison</h3>
        <div className="theme-tabs">
          {themeOptions.map((opt) => (
            <button
              className={previewTheme === opt.key ? "active" : ""}
              key={opt.key}
              onClick={() => setPreviewTheme(opt.key)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="theme-preview">
          <FigureFrame
            branding={{ logo: true }}
            format="square"
            height={480}
            subtitle={`${hostName} vs ${guestName}`}
            theme={theme}
            title="Shot Frequency & Efficiency"
            width={480}
          >
            <g transform="translate(60, 0)">
              <Court half="near" height={300} surface="clay" theme={theme} width={300}>
                <HexbinLayer
                  colorScale="efficiency"
                  gridsize={30}
                  player="host"
                  scales={scales}
                  shots={hostShots}
                  theme={theme}
                />
              </Court>
            </g>
          </FigureFrame>
        </div>
      </section>

      <section className="brand-section">
        <h3>Export gallery</h3>
        <p className="muted">
          Generated by <code>pnpm export:social</code> — {tokens.brand.handle}
        </p>
        <div className="export-gallery">
          {exportFormats.map((format) => (
            <div className="export-format-group" key={format}>
              <h4>{format}</h4>
              <div className="export-thumbs">
                {["hexbin-host", "momentum", "serve-host"].map((name) => (
                  <a
                    href={`/exports/${format}/${name}.png`}
                    key={`${format}-${name}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <img
                      alt={`${name} ${format}`}
                      loading="lazy"
                      src={`/exports/${format}/${name}.png`}
                    />
                    <span>{name}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
