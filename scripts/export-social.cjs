/**
 * Social export pipeline — multi-format SVG + PNG posters with PPD branding.
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
const oldPaths = module.paths || [];
module.paths = [demoNodeModules, rootNodeModules, ...oldPaths];

const React = require("react");
const { CourtSurface, HexbinLayer, DotLayer, ServeLayer, RayLayer, MomentumChart, ColorBar, FigureFrame } = require("@courtviz/react");
const { createCourtScales, resolveFrameLayout } = require("@courtviz/core");
const { ppd } = require("@courtviz/themes");
const { enrichedShots, momentumPoints, hostName, guestName, surface } = require("@courtviz/data");
const { exportGraphic } = require("@courtviz/render");
const { socialFormats } = require("@ppd/tokens");

const outRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports");
const theme = ppd;
const branding = { handle: "@peakperformancedata", logo: true };

function parseArgs() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const formatsArg = process.argv.find((a) => a.startsWith("--formats="));
  const svgOnly = process.argv.includes("--svg-only");
  const names = onlyArg
    ? onlyArg.split("=")[1].split(",")
    : ["hexbin-host", "hexbin-guest", "hexbin-dark", "dotdensity", "serve-host", "rays-host", "momentum"];
  const formats = formatsArg
    ? formatsArg.split("=")[1].split(",")
    : Object.keys(socialFormats);
  return { formats, names, svgOnly };
}

function courtSizeForLayout(layout, half = "near") {
  const region = layout.content;
  const aspect = half === "full" ? 600 / 800 : 1;
  const maxW = region.width - 20;
  const maxH = region.height - 20;
  let height = maxH;
  let width = height * aspect;
  if (width > maxW) {
    width = maxW;
    height = width / aspect;
  }
  return { height: Math.round(height), width: Math.round(width) };
}

function buildHexbinPoster(player, titleSuffix) {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const half = "near";
    const { height, width } = courtSizeForLayout(layout, half);
    const scales = createCourtScales({ half, height, margin: 1.5, width });
    const shots = enrichedShots.filter((s) => s.player === player && s.stroke !== "Serve");
    const courtX = layout.content.x + (layout.content.width - width) / 2;

    return React.createElement(FigureFrame, {
      branding,
      format,
      subtitle: `${hostName} vs ${guestName} · ${surface}`,
      theme,
      title: `${player === "host" ? hostName : guestName} — ${titleSuffix}`,
    },
      React.createElement("g", { transform: `translate(${courtX - (format === "landscape" ? layout.content.x : 0)}, 0)` },
        React.createElement(CourtSurface, { half, height, idPrefix: `hexbin-${player}`, surface: "clay", theme, width },
          React.createElement(HexbinLayer, {
            colorScale: "efficiency",
            gridsize: 35,
            player,
            scales,
            shots,
            theme,
          }),
        ),
        React.createElement("g", { transform: `translate(${(width - 200) / 2}, ${height + 16})` },
          React.createElement(ColorBar, { min: "Cold", max: "Hot", theme, width: 200 }),
        ),
      ),
    );
  };
}

function buildDotDensityPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const half = "full";
    const { height, width } = courtSizeForLayout(layout, half);
    const scales = createCourtScales({ half, height, margin: 1.5, width });
    const courtX = layout.content.x + (layout.content.width - width) / 2;

    return React.createElement(FigureFrame, {
      branding,
      format,
      subtitle: "Every bounce, colored by stroke type",
      theme,
      title: "Shot Bounce Locations",
    },
      React.createElement("g", { transform: `translate(${courtX - (format === "landscape" ? layout.content.x : 0)}, 0)` },
        React.createElement(CourtSurface, { half, height, idPrefix: "dotdensity", surface: "clay", theme, width },
          React.createElement(DotLayer, {
            alpha: 0.55,
            colorBy: "stroke",
            scales,
            shots: enrichedShots,
            size: 4,
            theme,
          }),
        ),
      ),
    );
  };
}

function buildServePoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const half = "near";
    const { height, width } = courtSizeForLayout(layout, half);
    const scales = createCourtScales({ half, height, margin: 1.5, width });
    const courtX = layout.content.x + (layout.content.width - width) / 2;

    return React.createElement(FigureFrame, {
      branding,
      format,
      subtitle: "1st and 2nd serve placement",
      theme,
      title: `${hostName} — Serve Placement`,
    },
      React.createElement("g", { transform: `translate(${courtX - (format === "landscape" ? layout.content.x : 0)}, 0)` },
        React.createElement(CourtSurface, { half, height, idPrefix: "serve-host", surface: "clay", theme, width },
          React.createElement(ServeLayer, {
            player: "host",
            scales,
            serveType: "both",
            shots: enrichedShots,
            theme,
          }),
        ),
      ),
    );
  };
}

function buildRaysPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const half = "full";
    const { height, width } = courtSizeForLayout(layout, half);
    const scales = createCourtScales({ half, height, margin: 1.5, width });
    const shots = enrichedShots.filter((s) => s.player === "host" && s.stroke !== "Serve");
    const courtX = layout.content.x + (layout.content.width - width) / 2;

    return React.createElement(FigureFrame, {
      branding,
      format,
      subtitle: "Hit origin to bounce destination",
      theme,
      title: `${hostName} — Shot Trajectories`,
    },
      React.createElement("g", { transform: `translate(${courtX - (format === "landscape" ? layout.content.x : 0)}, 0)` },
        React.createElement(CourtSurface, { half, height, idPrefix: "rays-host", surface: "clay", theme, width },
          React.createElement(RayLayer, {
            alpha: 0.3,
            player: "host",
            scales,
            shots,
            theme,
          }),
        ),
      ),
    );
  };
}

function buildMomentumPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const chartWidth = layout.content.width - 20;
    const chartHeight = layout.content.height - 40;

    return React.createElement(FigureFrame, {
      branding,
      format,
      subtitle: "Cumulative point differential by set",
      theme,
      title: `Momentum — ${hostName} vs ${guestName}`,
    },
      React.createElement(MomentumChart, {
        height: chartHeight,
        hostPlayer: "host",
        points: momentumPoints,
        theme,
        width: chartWidth,
      }),
    );
  };
}

const posterBuilders = {
  dotdensity: buildDotDensityPoster(),
  "hexbin-dark": buildHexbinPoster("host", "Shot Frequency & Efficiency"),
  "hexbin-guest": buildHexbinPoster("guest", "Shot Frequency & Efficiency"),
  "hexbin-host": buildHexbinPoster("host", "Shot Frequency & Efficiency"),
  momentum: buildMomentumPoster(),
  "rays-host": buildRaysPoster(),
  "serve-host": buildServePoster(),
};

async function exportPoster(name, format, svgOnly) {
  const builder = posterBuilders[name];
  if (!builder) throw new Error(`Unknown poster: ${name}`);

  const preset = socialFormats[format];
  const outDir = path.join(outRoot, format);
  fs.mkdirSync(outDir, { recursive: true });

  const element = builder(format);
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = svgOnly ? undefined : path.join(outDir, `${name}.png`);

  await exportGraphic(element, {
    pngHeight: preset.height,
    pngPath,
    pngWidth: preset.width,
    svgPath,
  });

  console.log(`  ✓ ${format}/${name}${svgOnly ? ".svg" : ".svg + .png"}`);
}

async function main() {
  const { formats, names, svgOnly } = parseArgs();
  console.log(`\n🎨 PPD social export — ${names.length} poster(s) × ${formats.length} format(s)\n`);

  for (const format of formats) {
    for (const name of names) {
      await exportPoster(name, format, svgOnly);
    }
  }

  console.log(`\n✅ Exported to ${outRoot}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
