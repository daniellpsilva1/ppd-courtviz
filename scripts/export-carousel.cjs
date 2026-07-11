/**
 * Coach deck exporter — one vertical 9:16 slide sequence for Instagram/TikTok.
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const React = require("react");
const { FigureFrame } = require("@courtviz/react");
const { resolveFrameLayout } = require("@courtviz/core");
const { ppd } = require("@courtviz/themes");
const { exportGraphic } = require("@courtviz/render");
const { socialFormats } = require("@ppd/tokens");
const { generateCoachInsights } = require("@ppd/brand");
const { loadMatchContext } = require("./load-match-data.cjs");
const { getLogoDataUri } = require("./logo-data.cjs");
const { resolveBranding } = require("./brand-helpers.cjs");
const {
  buildMatchNumbersStats,
  buildServeInsight,
  buildShotmakingStats,
  renderCoachCards,
  renderDensitySlide,
  renderDuelStats,
  renderErrorHeatmapSlide,
  renderMiniDualCourt,
  renderMomentumSlide,
  renderRallyBars,
  renderRaysSlide,
  renderServePlacementSlide,
  renderServeSlide,
  renderZonesSlide,
  setScore,
} = require("./export-slide-helpers.cjs");

const theme = ppd;
const branding = resolveBranding({
  logo: true,
  logoHref: getLogoDataUri(),
});

const SLIDES = [
  { id: "slide-cover", title: "Match Cover", subtitle: "Final score and court dominance preview" },
  { id: "slide-serve", title: "Serve Report", subtitle: "Placement, aces, speed, and zone win rates" },
  { id: "slide-placement", title: "Serve Placement", subtitle: "First-serve targets and in-rates" },
  { id: "slide-zones", title: "Zone Win Rates", subtitle: "Where each player wins points" },
  { id: "slide-patterns", title: "Shot Patterns", subtitle: "Hit-to-bounce tendencies" },
  { id: "slide-rally", title: "Rally Profile", subtitle: "Win rate by rally length" },
  { id: "slide-momentum", title: "Match Momentum", subtitle: "Point differential and break points" },
  { id: "slide-match-numbers", title: "Match Numbers", subtitle: "Overview, break points, clutch, and sets" },
  { id: "slide-shotmaking", title: "Shotmaking", subtitle: "Winners, errors, and return game" },
  { id: "slide-errors", title: "Error Heatmap", subtitle: "Where out and net errors landed" },
  { id: "slide-density", title: "Shot Density", subtitle: "KDE contours of bounce locations" },
  { id: "slide-coach", title: "Coach Takeaway", subtitle: "Practice priorities" },
  { id: "slide-cta", title: "Peak Performance Data", subtitle: "Full match intelligence on Tennis Bench" },
];

const DECK_FORMAT = "story";

function parseArgs() {
  const formatArg = process.argv.find((a) => a.startsWith("--format="));
  const format = formatArg ? formatArg.split("=")[1] : DECK_FORMAT;
  const svgOnly = process.argv.includes("--svg-only");
  return { format, svgOnly };
}

function cleanDeckOutput(outRoot, slideIds) {
  fs.mkdirSync(outRoot, { recursive: true });

  for (const legacyDir of ["portrait", "story"]) {
    const legacyPath = path.join(outRoot, legacyDir);
    if (fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { force: true, recursive: true });
    }
  }

  const keep = new Set(slideIds.flatMap((id) => [`${id}.png`, `${id}.svg`]));
  for (const file of fs.readdirSync(outRoot)) {
    if (!file.startsWith("slide-")) continue;
    if (!keep.has(file)) {
      fs.unlinkSync(path.join(outRoot, file));
    }
  }
}

function buildSlide(slideId, ctx) {
  const insights = generateCoachInsights({
    enrichedShots: ctx.enrichedShots,
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    points: ctx.points,
  });

  const builders = {
    "slide-cover": (format) => {
      const layout = resolveFrameLayout(format);
      const contentH = layout.content.height;
      const scoreBlock = 56;
      const courtW = layout.content.width;
      const maxCourtH = contentH - scoreBlock - 20;
      const courtH = Math.min(Math.floor(courtW * 0.55), Math.floor(maxCourtH * 0.95));
      const courtY = scoreBlock + Math.floor((contentH - scoreBlock - courtH) / 2);
      const score = setScore(ctx.sets);

      return React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: `${ctx.surface} court · ${ctx.matchDate}`,
          theme,
          title: `${ctx.hostName} vs ${ctx.guestName}`,
        },
        React.createElement(
          "g",
          { transform: "translate(0, 4)" },
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 52,
              fontWeight: 700,
              x: 0,
              y: 48,
            },
            score,
          ),
          renderMiniDualCourt(ctx, theme, 0, courtY, courtW, courtH),
        ),
      );
    },

    "slide-serve": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Placement, aces, speed, and zone win rates",
          theme,
          title: "Serve Report",
        },
        renderServeSlide(
          ctx,
          theme,
          resolveFrameLayout(format),
          insights.find((insight) => insight.category === "serve") ?? buildServeInsight(ctx) ?? insights[0],
        ),
      ),

    "slide-placement": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "First-serve targets and in-rates",
          theme,
          title: "Serve Placement",
        },
        renderServePlacementSlide(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-zones": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Win rate by court zone",
          theme,
          title: "Zone Win Rates",
        },
        renderZonesSlide(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-patterns": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Hit-to-bounce tendencies",
          theme,
          title: "Shot Patterns",
        },
        renderRaysSlide(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-rally": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Win rate by rally length",
          theme,
          title: "Rally Profile",
        },
        renderRallyBars(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-momentum": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Point differential and break points",
          theme,
          title: "Match Momentum",
        },
        renderMomentumSlide(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-match-numbers": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Overview, break points, clutch, and sets",
          theme,
          title: "Match Numbers",
        },
        renderDuelStats(ctx, theme, resolveFrameLayout(format), buildMatchNumbersStats(ctx)),
      ),

    "slide-shotmaking": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Winners, errors, and return game",
          theme,
          title: "Shotmaking",
        },
        renderDuelStats(ctx, theme, resolveFrameLayout(format), buildShotmakingStats(ctx)),
      ),

    "slide-errors": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Where out and net errors landed",
          theme,
          title: "Error Heatmap",
        },
        renderErrorHeatmapSlide(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-density": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "KDE contours of bounce locations",
          theme,
          title: "Shot Density",
        },
        renderDensitySlide(ctx, theme, resolveFrameLayout(format)),
      ),

    "slide-coach": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Practice priorities",
          theme,
          title: "Coach Takeaway",
        },
        renderCoachCards(ctx, theme, resolveFrameLayout(format), insights),
      ),

    "slide-cta": (format) => {
      const layout = resolveFrameLayout(format);
      const centerX = layout.content.width / 2;
      const score = setScore(ctx.sets);
      const blockH = 320;
      const startY = Math.floor((layout.content.height - blockH) / 2);

      return React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Full match intelligence on Tennis Bench",
          theme,
          title: "Peak Performance Data",
        },
        React.createElement(
          "g",
          { transform: `translate(0, ${startY})` },
          React.createElement("rect", {
            fill: `${theme.inkMuted}18`,
            height: 44,
            rx: 8,
            width: layout.content.width,
            x: 0,
            y: 0,
          }),
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.title,
              fontWeight: 700,
              textAnchor: "middle",
              x: centerX,
              y: 28,
            },
            `${ctx.hostName} vs ${ctx.guestName} · ${score}`,
          ),
          React.createElement("image", {
            height: 120,
            href: branding.logoHref,
            preserveAspectRatio: "xMidYMid meet",
            width: 120,
            x: centerX - 60,
            y: 72,
          }),
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 32,
              fontWeight: 700,
              textAnchor: "middle",
              x: centerX,
              y: 228,
            },
            branding.handle,
          ),
          React.createElement(
            "text",
            {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.body,
              textAnchor: "middle",
              x: centerX,
              y: 262,
            },
            "tennisbench.com",
          ),
          React.createElement(
            "text",
            {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.label,
              textAnchor: "middle",
              x: centerX,
              y: 292,
            },
            "Track every shot. Coach every point.",
          ),
        ),
      );
    },
  };

  return builders[slideId];
}

async function main() {
  const { format: formatFilter, svgOnly } = parseArgs();
  const format = formatFilter === DECK_FORMAT ? DECK_FORMAT : DECK_FORMAT;
  if (formatFilter !== DECK_FORMAT) {
    console.warn(`[courtviz] Only "${DECK_FORMAT}" deck export is supported; ignoring --format=${formatFilter}`);
  }

  const ctx = await loadMatchContext();
  const outRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "deck");
  cleanDeckOutput(
    outRoot,
    SLIDES.map((slide) => slide.id),
  );

  console.log(`\n📱 Deck export — ${ctx.hostName} vs ${ctx.guestName} (${format} 9:16)\n`);

  const preset = socialFormats[format];
  const slidePaths = [];

  for (const slide of SLIDES) {
    const builder = buildSlide(slide.id, ctx);
    const element = builder(format);
    const svgPath = path.join(outRoot, `${slide.id}.svg`);
    const pngPath = svgOnly ? undefined : path.join(outRoot, `${slide.id}.png`);
    await exportGraphic(element, {
      pngHeight: preset.height,
      pngPath,
      pngWidth: preset.width,
      svgPath,
    });
    slidePaths.push({
      id: slide.id,
      png: pngPath ? path.basename(pngPath) : null,
      svg: path.basename(svgPath),
      title: slide.title,
    });
    console.log(`  ✓ deck/${slide.id}`);
  }

  const manifest = {
    format,
    guestName: ctx.guestName,
    generatedAt: new Date().toISOString(),
    height: preset.height,
    hostName: ctx.hostName,
    matchDate: ctx.matchDate,
    matchId: ctx.matchId,
    platforms: ["instagram", "tiktok"],
    slides: SLIDES,
    slidePaths,
    width: preset.width,
  };

  fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n✅ Deck exported to ${outRoot}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
