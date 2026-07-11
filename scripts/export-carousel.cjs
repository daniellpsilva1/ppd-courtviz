/**
 * Coach deck exporter — one cohesive slide sequence in portrait + story formats.
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const React = require("react");
const { FigureFrame } = require("@courtviz/react");
const { resolveFrameLayout } = require("@courtviz/core");
const { ppd, getPlayerColor } = require("@courtviz/themes");
const { exportGraphic } = require("@courtviz/render");
const { socialFormats } = require("@ppd/tokens");
const { generateCoachInsights } = require("@ppd/brand");
const { loadMatchContext } = require("./load-match-data.cjs");
const { getLogoDataUri } = require("./logo-data.cjs");
const { resolveBranding } = require("./brand-helpers.cjs");
const {
  buildAcesStats,
  buildBreakPointBattleStats,
  buildClutchStats,
  buildErrorHeatmapStats,
  buildKeyStats,
  buildReturnGameStats,
  buildRallyHighlightStats,
  buildServeSpeedStats,
  buildSetBySetStats,
  buildSpinDirectionStats,
  buildWinnersErrorStats,
  renderCoachCards,
  renderDensitySlide,
  renderDuelStats,
  renderErrorHeatmapSlide,
  renderGenericDuelSlide,
  renderMiniDualCourt,
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
  { id: "slide-serve", title: "Serve Report", subtitle: "Host court + zone win rates for both players" },
  { id: "slide-zones", title: "Zone Win Rates", subtitle: "Where each player wins points" },
  { id: "slide-patterns", title: "Shot Patterns", subtitle: "Hit-to-bounce tendencies" },
  { id: "slide-rally", title: "Rally Profile", subtitle: "Win rate by rally length" },
  { id: "slide-stats", title: "Key Stats", subtitle: "Head-to-head key numbers" },
  { id: "slide-breakpoints", title: "Break Point Battle", subtitle: "Chances, conversions, and saves" },
  { id: "slide-winners", title: "Winners vs Errors", subtitle: "Forehand and backhand shot quality" },
  { id: "slide-aces", title: "Aces & Double Faults", subtitle: "Serve firepower and leaks" },
  { id: "slide-speed", title: "Serve Speed", subtitle: "P50, P90, and max tracked speeds" },
  { id: "slide-sets", title: "Set by Set", subtitle: "Per-set score breakdown" },
  { id: "slide-rally-highlights", title: "Rally Highlights", subtitle: "Longest rally and average length" },
  { id: "slide-return", title: "Return Game", subtitle: "Return win rate and depth" },
  { id: "slide-spin", title: "Spin & Direction", subtitle: "Best-performing shot profiles" },
  { id: "slide-clutch", title: "Clutch Points", subtitle: "Break point, deuce, and set-point win rates" },
  { id: "slide-errors", title: "Error Heatmap", subtitle: "Where out and net errors landed" },
  { id: "slide-density", title: "Shot Density", subtitle: "KDE contours of bounce locations" },
  { id: "slide-placement", title: "Serve Placement", subtitle: "First-serve targets and in-rates" },
  { id: "slide-coach", title: "Coach Takeaway", subtitle: "Practice priorities" },
  { id: "slide-cta", title: "Peak Performance Data", subtitle: "Full match intelligence on Tennis Bench" },
];

const DECK_FORMATS = ["portrait", "story"];

function parseArgs() {
  const formatArg = process.argv.find((a) => a.startsWith("--format="));
  const format = formatArg ? formatArg.split("=")[1] : "all";
  const svgOnly = process.argv.includes("--svg-only");
  return { format, svgOnly };
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
      const courtW = Math.min(layout.content.width, 520);
      const courtH = Math.floor(courtW * 0.42);

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
          { transform: "translate(0, 8)" },
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 56,
              fontWeight: 700,
              x: 0,
              y: 56,
            },
            setScore(ctx.sets),
          ),
          React.createElement(
            "text",
            {
              fill: getPlayerColor("host", theme),
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.subtitle,
              fontWeight: 700,
              x: 0,
              y: 88,
            },
            ctx.hostName,
          ),
          React.createElement(
            "text",
            {
              fill: getPlayerColor("guest", theme),
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.subtitle,
              fontWeight: 700,
              x: layout.content.width / 2,
              y: 88,
            },
            ctx.guestName,
          ),
          React.createElement(
            "rect",
            {
              fill: `${theme.inkMuted}22`,
              height: 28,
              rx: 14,
              stroke: `${theme.inkMuted}44`,
              width: 180,
              x: 0,
              y: 104,
            },
          ),
          React.createElement(
            "text",
            {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.label,
              fontWeight: 600,
              x: 16,
              y: 123,
            },
            `${ctx.surface.toUpperCase()} · ${ctx.matchDate}`,
          ),
          renderMiniDualCourt(ctx, theme, 0, 148, courtW, courtH),
        ),
      );
    },

    "slide-serve": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Serve placement and in-rate by zone",
          theme,
          title: "Serve Report",
        },
        renderServeSlide(
          ctx,
          theme,
          resolveFrameLayout(format),
          insights.find((insight) => insight.category === "serve") ?? insights[0],
        ),
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

    "slide-stats": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Head-to-head key numbers",
          theme,
          title: "Key Stats",
        },
        renderDuelStats(ctx, theme, resolveFrameLayout(format), buildKeyStats(ctx)),
      ),

    "slide-breakpoints": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Chances, conversions, and saves",
          theme,
          title: "Break Point Battle",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildBreakPointBattleStats(ctx)),
      ),

    "slide-winners": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Forehand and backhand shot quality",
          theme,
          title: "Winners vs Errors",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildWinnersErrorStats(ctx)),
      ),

    "slide-aces": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Serve firepower and leaks",
          theme,
          title: "Aces & Double Faults",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildAcesStats(ctx)),
      ),

    "slide-speed": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "P50, P90, and max tracked speeds",
          theme,
          title: "Serve Speed",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildServeSpeedStats(ctx)),
      ),

    "slide-sets": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Per-set score breakdown",
          theme,
          title: "Set by Set",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildSetBySetStats(ctx)),
      ),

    "slide-rally-highlights": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Longest rally and average length",
          theme,
          title: "Rally Highlights",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildRallyHighlightStats(ctx)),
      ),

    "slide-return": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Return win rate and depth",
          theme,
          title: "Return Game",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildReturnGameStats(ctx)),
      ),

    "slide-spin": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Best-performing shot profiles",
          theme,
          title: "Spin & Direction",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildSpinDirectionStats(ctx)),
      ),

    "slide-clutch": (format) =>
      React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Break point, deuce, and set-point win rates",
          theme,
          title: "Clutch Points",
        },
        renderGenericDuelSlide(ctx, theme, resolveFrameLayout(format), buildClutchStats(ctx)),
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
      const centerY = layout.content.height / 2;

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
          { transform: `translate(${centerX}, ${centerY - 60})` },
          React.createElement("image", {
            height: 96,
            href: branding.logoHref,
            preserveAspectRatio: "xMidYMid meet",
            width: 96,
            x: -48,
            y: -48,
          }),
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 28,
              fontWeight: 700,
              textAnchor: "middle",
              x: 0,
              y: 72,
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
              x: 0,
              y: 104,
            },
            "tennisbench.com",
          ),
        ),
      );
    },
  };

  return builders[slideId];
}

async function main() {
  const { format: formatFilter, svgOnly } = parseArgs();
  const ctx = await loadMatchContext();
  const outRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "deck");
  const formats = formatFilter === "all" ? DECK_FORMATS : [formatFilter];

  console.log(`\n📱 Deck export — ${ctx.hostName} vs ${ctx.guestName}\n`);

  const manifest = {
    formats: {},
    guestName: ctx.guestName,
    hostName: ctx.hostName,
    matchDate: ctx.matchDate,
    matchId: ctx.matchId,
    slides: SLIDES,
    generatedAt: new Date().toISOString(),
  };

  for (const format of formats) {
    if (!DECK_FORMATS.includes(format)) continue;
    const outDir = path.join(outRoot, format);
    fs.mkdirSync(outDir, { recursive: true });
    const slidePaths = [];

    for (const slide of SLIDES) {
      const builder = buildSlide(slide.id, ctx);
      const preset = socialFormats[format];
      const element = builder(format);
      const svgPath = path.join(outDir, `${slide.id}.svg`);
      const pngPath = svgOnly ? undefined : path.join(outDir, `${slide.id}.png`);
      await exportGraphic(element, {
        pngHeight: preset.height,
        pngPath,
        pngWidth: preset.width,
        svgPath,
      });
      slidePaths.push({
        id: slide.id,
        png: pngPath ? path.relative(outRoot, pngPath) : null,
        svg: path.relative(outRoot, svgPath),
        title: slide.title,
      });
      console.log(`  ✓ deck/${format}/${slide.id}`);
    }

    manifest.formats[format] = {
      height: socialFormats[format].height,
      platforms: format === "portrait" ? ["instagram", "twitter"] : ["tiktok"],
      slides: slidePaths,
      width: socialFormats[format].width,
    };
  }

  fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n✅ Deck exported to ${outRoot}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
