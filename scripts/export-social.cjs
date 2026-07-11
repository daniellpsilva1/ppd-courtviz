/**
 * Social export pipeline — multi-format posters with measured layout and coach insights.
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const React = require("react");
const {
  CourtSurface,
  HexbinLayer,
  DotLayer,
  ServeLayer,
  RayLayer,
  MomentumChart,
  ColorBar,
  FigureFrame,
  ServeAnnotations,
  StatCallout,
  Legend,
  HexSizeLegend,
  ZoneBarChart,
  InsightPanel,
} = require("@courtviz/react");
const {
  createCourtScales,
  resolveFrameLayout,
  resolvePosterContentLayout,
  computeServeZones,
  computeZoneWinRates,
  computeHexbins,
  computeShotFlows,
  computePointsWonRate,
  computeMomentum,
  shotPlayerWonPoint,
  SINGLES_HALF,
} = require("@courtviz/core");
const { ppd, getPlayerColor } = require("@courtviz/themes");
const { exportGraphic } = require("@courtviz/render");
const { socialFormats } = require("@ppd/tokens");
const { generateCoachInsights, primaryCoachInsight } = require("@ppd/brand");
const { loadMatchContext } = require("./load-match-data.cjs");
const { getLogoDataUri } = require("./logo-data.cjs");
const { resolveBranding } = require("./brand-helpers.cjs");
const { BRAND_SURFACE } = require("./brand-surface.cjs");
const { renderCoachCards, renderCompactCoachCard } = require("./export-slide-helpers.cjs");

const DEFAULT_POSTERS = [
  "court-dominance",
  "hexbin-host",
  "dotdensity",
  "serve-host",
  "rays-host",
  "momentum",
  "coach-insights",
];
const DEFAULT_FORMATS = ["square", "portrait", "story", "landscape"];

const outRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports");
const theme = ppd;
const branding = resolveBranding({
  logo: true,
  logoHref: getLogoDataUri(),
});

let matchCtx = null;

function parseArgs() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const formatsArg = process.argv.find((a) => a.startsWith("--formats="));
  const svgOnly = process.argv.includes("--svg-only");
  const names = onlyArg ? onlyArg.split("=")[1].split(",") : DEFAULT_POSTERS;
  const formats = formatsArg ? formatsArg.split("=")[1].split(",") : DEFAULT_FORMATS;
  return { formats, names, svgOnly };
}

const STROKE_LEGEND = [
  { color: "#FB923C", label: "Forehand" },
  { color: "#22D3EE", label: "Backhand" },
  { color: "#4ADE80", label: "Volley" },
  { color: "#C084FC", label: "Serve" },
  { color: "#F472B6", label: "Overhead" },
  { color: "#FDE047", label: "Feed" },
];

const HEX_MIN_COUNT = 1;
const HEX_SIZE_RANGE = [0.35, 0.75];

function singlesExtent(half = "near") {
  const { courtYBounds } = require("@courtviz/core");
  const [yMin, yMax] = courtYBounds(half);
  return [-SINGLES_HALF, SINGLES_HALF, yMin, yMax];
}

function singlesClipBounds(scales, half = "near") {
  const { courtYBounds } = require("@courtviz/core");
  const [yMin, yMax] = courtYBounds(half);
  return {
    xMin: scales.x(-SINGLES_HALF),
    xMax: scales.x(SINGLES_HALF),
    yMin: scales.y(yMax),
    yMax: scales.y(yMin),
  };
}

function strokeCounts(shots) {
  const counts = {};
  for (const shot of shots) {
    if (!shot.stroke) continue;
    counts[shot.stroke] = (counts[shot.stroke] || 0) + 1;
  }
  return counts;
}

function maxHexCount(shots, player, half, gridsize) {
  const filtered = shots.filter(
    (s) =>
      s.player === player &&
      s.stroke !== "Serve" &&
      s.bounceX != null &&
      s.bounceY != null &&
      s.result === "In",
  );
  const hexbins = computeHexbins(
    {
      x: filtered.map((s) => s.bounceX),
      y: filtered.map((s) => s.bounceY),
      values: filtered.map((s) => (shotPlayerWonPoint(s) ? 1 : 0)),
    },
    { gridsize, half, minCount: HEX_MIN_COUNT, sizeRange: HEX_SIZE_RANGE },
  );
  return hexbins.reduce((max, h) => Math.max(max, h.count), HEX_MIN_COUNT);
}

function sharedEfficiencyDomain(player, half = "near", gridsize = 9) {
  const shots = matchCtx.enrichedShots.filter(
    (s) => s.player === player && s.stroke !== "Serve" && s.bounceX != null && s.bounceY != null && s.result === "In",
  );
  const hexbins = computeHexbins(
    {
      x: shots.map((s) => s.bounceX),
      y: shots.map((s) => s.bounceY),
      values: shots.map((s) => (shotPlayerWonPoint(s) ? 1 : 0)),
    },
    { gridsize, half, minCount: HEX_MIN_COUNT, sizeRange: HEX_SIZE_RANGE },
  );
  if (hexbins.length === 0) return { vmin: 0, vmax: 1 };
  const values = hexbins.map((h) => h.value);
  return { vmin: Math.min(...values), vmax: Math.max(...values) };
}

function dualEfficiencyDomain(players, half, gridsize) {
  const domains = players.map((p) => sharedEfficiencyDomain(p, half, gridsize));
  return {
    vmin: Math.min(...domains.map((d) => d.vmin)),
    vmax: Math.max(...domains.map((d) => d.vmax)),
  };
}

function zoneRate(zones, side) {
  const match = zones.find((z) => z.zone.toLowerCase().includes(side));
  if (!match || match.total < 3) return null;
  return match.winRate;
}

function renderLegends(width, y, peakCount) {
  const colorBarW = Math.min(Math.floor(width * 0.42), 380);
  const sizeLegendW = 300;
  const groupW = colorBarW + 32 + sizeLegendW;
  const offsetX = Math.max(0, Math.floor((width - groupW) / 2));
  const legendX = offsetX + colorBarW + 32;

  return React.createElement(
    "g",
    { transform: `translate(${offsetX}, ${y})` },
    React.createElement(ColorBar, {
      label: "Point win rate",
      max: "Wins more",
      min: "Wins less",
      theme,
      width: colorBarW,
    }),
    React.createElement(HexSizeLegend, {
      counts: [2, 6, peakCount],
      label: "Bigger = hit here more often",
      maxCount: peakCount,
      maxRadius: 14,
      theme,
      x: legendX,
      y: 0,
    }),
  );
}

function renderCoachTakeaway(width, y, insight) {
  return React.createElement(
    "g",
    { transform: `translate(0, ${y})` },
    renderCompactCoachCard(insight, theme, Math.min(width, 1000), 100),
  );
}

function renderInsight(width, y, text) {
  return React.createElement(InsightPanel, {
    text,
    theme,
    width: Math.min(width, 1000),
    x: 0,
    y,
  });
}

function coachInsightFromText(text) {
  return {
    action: text,
    category: "zone",
    headline: text,
    id: "fallback",
  };
}

function buildCourtDominancePoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const surface = BRAND_SURFACE;
    const half = "near";
    const gridsize = 8;
    const valueDomain = dualEfficiencyDomain(["host", "guest"], half, gridsize);
    const insightText = primaryCoachInsight({
      enrichedShots: matchCtx.enrichedShots,
      guestName: matchCtx.guestName,
      hostName: matchCtx.hostName,
      points: matchCtx.points,
    });
    const coachInsights = generateCoachInsights({
      enrichedShots: matchCtx.enrichedShots,
      guestName: matchCtx.guestName,
      hostName: matchCtx.hostName,
      points: matchCtx.points,
    });
    const topInsight = coachInsights[0] ?? coachInsightFromText(insightText);

    if (format === "landscape") {
      const contentY = layout.content.y;
      const contentW = layout.content.width;
      const contentH = layout.content.height - 88;
      const courtH = Math.min(contentH - 60, 420);
      const courtW = Math.floor(courtH * 0.95);
      const gap = 20;
      const chipW = 80;
      const legendW = 120;
      const blockW = chipW + courtW + gap + courtW + gap + chipW + gap + legendW;
      const startX = layout.content.x + Math.max(0, (contentW - blockW) / 2);
      const startY = contentY + Math.max(0, (contentH - courtH) / 2);
      const hostScales = createCourtScales({ half, height: courtH, margin: 1.5, width: courtW });
      const guestScales = createCourtScales({ half, height: courtH, margin: 1.5, width: courtW });
      const hostZones = computeZoneWinRates(matchCtx.enrichedShots.filter((s) => s.player === "host"), "host");
      const guestZones = computeZoneWinRates(matchCtx.enrichedShots.filter((s) => s.player === "guest"), "guest");
      const peakCount = Math.max(
        maxHexCount(matchCtx.enrichedShots, "host", half, gridsize),
        maxHexCount(matchCtx.enrichedShots, "guest", half, gridsize),
      );
      const extent = singlesExtent(half);
      let cursor = startX;

      const hostCourtX = cursor + chipW;
      cursor += chipW + courtW + gap;
      const guestCourtX = cursor + chipW;
      cursor += chipW + courtW + gap + chipW + gap;
      const legendX = cursor;

      return React.createElement(
        FigureFrame,
        {
          branding,
          format,
          subtitle: "Bigger = more shots · color = point win rate",
          theme,
          title: "Court Dominance",
        },
        React.createElement(
          "g",
          { transform: `translate(${startX}, ${startY})` },
          renderZoneChips(chipW, hostZones, getPlayerColor("host", theme), 48),
          renderPlayerCourt(hostCourtX, 0, courtW, courtH, "host", matchCtx.hostName, hostScales, valueDomain, gridsize, half, extent, surface),
          renderZoneChips(chipW, guestZones, getPlayerColor("guest", theme), 48, chipW + courtW + gap),
          renderPlayerCourt(guestCourtX, 0, courtW, courtH, "guest", matchCtx.guestName, guestScales, valueDomain, gridsize, half, extent, surface),
          React.createElement(
            "g",
            { transform: `translate(${legendX}, 48)` },
            renderVerticalLegend(legendW, peakCount),
          ),
        ),
        React.createElement(
          "g",
          { transform: `translate(${layout.content.x}, ${layout.content.y + layout.content.height - 108})` },
          renderCoachTakeaway(layout.content.width, 0, topInsight),
        ),
      );
    }

    const posterLayout = resolvePosterContentLayout(layout, {
      analyticsBand: 0,
      courtAspect: 0.75,
      insightBand: 112,
      legendBand: format === "story" ? 120 : format === "portrait" ? 110 : 100,
    });
    const { courtHeight, courtWidth, courtX, courtY, insightY, legendY } = posterLayout;
    const singleW = format === "story" ? courtWidth : Math.floor((courtWidth - 16) / 2);
    const singleH = format === "story" ? Math.floor(courtHeight / 2) - 8 : courtHeight;
    const peakCount = Math.max(
      maxHexCount(matchCtx.enrichedShots, "host", half, gridsize),
      maxHexCount(matchCtx.enrichedShots, "guest", half, gridsize),
    );
    const extent = singlesExtent(half);
    const hostDomain = dualEfficiencyDomain(["host", "guest"], half, gridsize);

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: `${matchCtx.hostName} vs ${matchCtx.guestName} · ${surface} court`,
        theme,
        title: "Court Dominance",
      },
      React.createElement(
        "g",
        { transform: `translate(${courtX}, ${courtY})` },
        format === "story"
          ? [
              renderStackedCourt(0, 0, singleW, singleH, "host", matchCtx.hostName, hostDomain, gridsize, half, extent, surface, "host"),
              renderStackedCourt(0, singleH + 16, singleW, singleH, "guest", matchCtx.guestName, hostDomain, gridsize, half, extent, surface, "guest"),
            ]
          : [
              renderStackedCourt(0, 0, singleW, singleH, "host", matchCtx.hostName, hostDomain, gridsize, half, extent, surface, "host"),
              renderStackedCourt(singleW + 16, 0, singleW, singleH, "guest", matchCtx.guestName, hostDomain, gridsize, half, extent, surface, "guest"),
            ],
        renderLegends(courtWidth, legendY - courtY, peakCount),
        renderCoachTakeaway(courtWidth, insightY - courtY, topInsight),
      ),
    );
  };
}

function renderZoneChips(width, zones, color, topPad, offsetX = 0) {
  const deuce = zoneRate(zones, "deuce");
  const ad = zoneRate(zones, "ad");
  return React.createElement(
    "g",
    { transform: `translate(${offsetX}, ${topPad})` },
    deuce != null &&
      React.createElement(StatCallout, {
        accentColor: color,
        label: "deuce win rate",
        theme,
        value: `${Math.round(deuce * 100)}%`,
        x: 0,
        y: 0,
      }),
    ad != null &&
      React.createElement(StatCallout, {
        accentColor: color,
        label: "ad win rate",
        theme,
        value: `${Math.round(ad * 100)}%`,
        x: 0,
        y: 52,
      }),
  );
}

function renderVerticalLegend(width, peakCount) {
  return React.createElement(
    "g",
    null,
    React.createElement(ColorBar, {
      height: 72,
      label: "Point win rate",
      max: "Wins more",
      min: "Wins less",
      theme,
      width: 14,
    }),
    React.createElement(HexSizeLegend, {
      counts: [4, 8, peakCount],
      label: "Bigger = more shots",
      maxCount: peakCount,
      maxRadius: 12,
      theme,
      x: 0,
      y: 96,
    }),
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: theme.fontSize.label,
        x: 0,
        y: 168,
      },
      `max ${peakCount}`,
    ),
  );
}

function renderPlayerCourt(x, y, width, height, player, name, scales, valueDomain, gridsize, half, extent, surface) {
  const shots = matchCtx.enrichedShots.filter((s) => s.player === player && s.stroke !== "Serve");
  return React.createElement(
    "g",
    { transform: `translate(${x}, ${y})` },
    React.createElement(
      "text",
      {
        fill: getPlayerColor(player, theme),
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.body,
        fontWeight: 700,
        x: 0,
        y: -8,
      },
      name,
    ),
    React.createElement(
      CourtSurface,
      { half, height, idPrefix: `dominance-${player}`, surface, theme, width },
      React.createElement(HexbinLayer, {
        colorScale: "efficiency",
        gridsize,
        half,
        labelMinCount: 6,
        minCount: HEX_MIN_COUNT,
        player,
        scales,
        shots,
        sizeRange: HEX_SIZE_RANGE,
        theme,
        useHalfCourtNormalization: true,
        valueDomain,
        extent,
      }),
    ),
  );
}

function renderStackedCourt(x, y, width, height, player, name, valueDomain, gridsize, half, extent, surface, key) {
  const scales = createCourtScales({ half, height, margin: 1.5, width });
  return React.createElement(
    "g",
    { key, transform: `translate(${x}, ${y})` },
    renderPlayerCourt(0, 0, width, height, player, name, scales, valueDomain, gridsize, half, extent, surface),
  );
}

function buildHexbinPoster(player, titleSuffix) {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const surface = BRAND_SURFACE;
    const half = format === "story" ? "full" : "near";
    const gridsize = format === "story" ? 12 : 9;
    const valueDomain = sharedEfficiencyDomain(player, half, gridsize);
    const posterLayout = resolvePosterContentLayout(layout, {
      analyticsBand: 88,
      courtAspect: half === "full" ? 0.75 : 1,
      insightBand: 88,
      legendBand: format === "story" ? 160 : 150,
    });
    const { analyticsY, courtHeight, courtWidth, courtX, courtY, insightY, legendY } = posterLayout;
    const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
    const shots = matchCtx.enrichedShots.filter((s) => s.player === player && s.stroke !== "Serve");
    const zoneRates = computeZoneWinRates(shots, player);
    const topZone = zoneRates[0];
    const secondZone = zoneRates[1];
    const peakCount = maxHexCount(matchCtx.enrichedShots, player, half, gridsize);
    const extent = singlesExtent(half);
    const playerName = player === "host" ? matchCtx.hostName : matchCtx.guestName;
    const insightText = primaryCoachInsight({
      enrichedShots: matchCtx.enrichedShots,
      guestName: matchCtx.guestName,
      hostName: matchCtx.hostName,
      points: matchCtx.points,
    });

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: `${matchCtx.hostName} vs ${matchCtx.guestName} · ${surface} court`,
        theme,
        title: `${playerName} — ${titleSuffix}`,
      },
      React.createElement(
        "g",
        { transform: `translate(${courtX}, ${courtY})` },
        React.createElement(
          CourtSurface,
          { half, height: courtHeight, idPrefix: `hexbin-${player}`, surface, theme, width: courtWidth },
          React.createElement(HexbinLayer, {
            colorScale: "efficiency",
            gridsize,
            half,
            labelMinCount: 6,
            minCount: HEX_MIN_COUNT,
            player,
            scales,
            shots,
            sizeRange: HEX_SIZE_RANGE,
            theme,
            useHalfCourtNormalization: true,
        valueDomain,
            extent,
          }),
        ),
        React.createElement(
          "g",
          { transform: `translate(0, ${analyticsY - courtY})` },
          topZone &&
            React.createElement(StatCallout, {
              label: `${topZone.zone} zone win rate`,
              theme,
              value: `${Math.round(topZone.winRate * 100)}%`,
              x: 0,
              y: 0,
            }),
          secondZone &&
            React.createElement(StatCallout, {
              label: `${secondZone.zone} zone win rate`,
              theme,
              value: `${Math.round(secondZone.winRate * 100)}%`,
              x: courtWidth - 220,
              y: 0,
            }),
        ),
        renderLegends(courtWidth, legendY - courtY, peakCount),
        renderInsight(courtWidth, insightY - courtY, insightText),
      ),
    );
  };
}

function buildDotDensityPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const surface = BRAND_SURFACE;
    const half = "full";
    const posterLayout = resolvePosterContentLayout(layout, {
      courtAspect: 0.75,
      insightBand: 88,
      legendBand: format === "landscape" ? 0 : 120,
    });
    const { courtHeight, courtWidth, courtX, courtY, insightY, legendY } = posterLayout;
    const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
    const inShots = matchCtx.enrichedShots.filter((s) => s.result === "In" && s.bounceX != null);
    const counts = strokeCounts(inShots);
    const legendItems = STROKE_LEGEND.filter((item) => counts[item.label] > 0);

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: "Each dot = one bounce · color = stroke type",
        theme,
        title: "Shot Bounce Locations",
      },
      React.createElement(
        "g",
        { transform: `translate(${courtX}, ${courtY})` },
        React.createElement(
          CourtSurface,
          { half, height: courtHeight, idPrefix: "dotdensity", surface, theme, width: courtWidth },
          React.createElement(DotLayer, {
            alpha: 0.85,
            colorBy: "stroke",
            highContrast: true,
            scales,
            shots: matchCtx.enrichedShots,
            size: 5.5,
            theme,
          }),
        ),
        legendItems.length > 0 &&
          React.createElement(
            "g",
            { transform: `translate(0, ${legendY - courtY})` },
            React.createElement(Legend, {
              items: legendItems.map((item) => ({
                ...item,
                label: `${item.label} (${counts[item.label]})`,
              })),
              orientation: format === "story" ? "vertical" : "horizontal",
              swatchSize: 14,
              theme,
              x: 0,
              y: 0,
            }),
          ),
        renderInsight(
          courtWidth,
          insightY - courtY,
          "Use bounce clusters to spot predictable targets — attack repeated landing zones on return.",
        ),
      ),
    );
  };
}

function serveCounts(shots, player) {
  const serves = shots.filter((s) => s.player === player && s.stroke === "Serve");
  const first = serves.filter((s) => s.type !== "second_serve").length;
  const second = serves.filter((s) => s.type === "second_serve").length;
  const faults = serves.filter((s) => s.result !== "In").length;
  return { first, second, faults };
}

function buildServePoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const surface = BRAND_SURFACE;
    const half = "near";
    const posterLayout = resolvePosterContentLayout(layout, {
      analyticsBand: format === "story" ? 220 : 0,
      courtAspect: 1,
      insightBand: 112,
      legendBand: 0,
    });
    const { analyticsY, courtHeight, courtWidth, courtX, courtY, insightY } = posterLayout;
    const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
    const hostZones = computeServeZones(matchCtx.enrichedShots, "host");
    const counts = serveCounts(matchCtx.enrichedShots, "host");
    const topZones = hostZones.slice(0, 3);
    const zoneBarData = hostZones.slice(0, 5).map((zone) => ({
      color: getPlayerColor("host", theme),
      playerLabel: matchCtx.hostName,
      total: zone.count,
      winRate: zone.inRate,
      zone: `${zone.side} ${zone.zone}`,
    }));
    const coachInsights = generateCoachInsights({
      enrichedShots: matchCtx.enrichedShots,
      guestName: matchCtx.guestName,
      hostName: matchCtx.hostName,
      points: matchCtx.points,
    });
    const serveInsight =
      coachInsights.find((insight) => insight.category === "serve") ??
      coachInsightFromText(
        `Target ${topZones[0] ? `${topZones[0].side} ${topZones[0].zone}` : "body serves"} — highest-volume placement this match.`,
      );
    const calloutY = 8;
    const calloutSpan = courtWidth / 3;

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: `${counts.first} first · ${counts.second} second · ${counts.faults} faults`,
        theme,
        title: `${matchCtx.hostName} — Serve Placement`,
      },
      React.createElement(
        "g",
        { transform: `translate(${courtX}, ${courtY})` },
        React.createElement(
          CourtSurface,
          { half, height: courtHeight, idPrefix: "serve-host", surface, theme, width: courtWidth },
          React.createElement(ServeLayer, {
            haloWidth: 1.5,
            highContrast: true,
            includeFaults: true,
            inBoxOnly: false,
            player: "host",
            scales,
            serveType: "both",
            shots: matchCtx.enrichedShots,
            size: 8,
            theme,
          }),
          format !== "story" &&
            React.createElement(ServeAnnotations, {
              scales,
              theme,
              zones: hostZones,
            }),
        ),
        posterLayout.bands.analyticsBand > 0 &&
          React.createElement(
            "g",
            { transform: `translate(0, ${analyticsY - courtY})` },
            React.createElement(StatCallout, {
              label: "first serves",
              theme,
              value: String(counts.first),
              x: 0,
              y: calloutY,
            }),
            React.createElement(StatCallout, {
              label: "second serves",
              theme,
              value: String(counts.second),
              x: calloutSpan,
              y: calloutY,
            }),
            React.createElement(StatCallout, {
              label: "faults",
              theme,
              value: String(counts.faults),
              x: calloutSpan * 2,
              y: calloutY,
            }),
            React.createElement(
              "g",
              { transform: `translate(0, ${calloutY + 48})` },
              React.createElement(ZoneBarChart, {
                data: zoneBarData,
                height: 120,
                maxBars: 5,
                theme,
                width: courtWidth,
              }),
            ),
          ),
        renderCoachTakeaway(courtWidth, insightY - courtY, serveInsight),
      ),
    );
  };
}

function buildRaysPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const surface = BRAND_SURFACE;
    const half = "full";
    const posterLayout = resolvePosterContentLayout(layout, {
      courtAspect: 0.75,
      insightBand: 88,
      legendBand: 100,
    });
    const { courtHeight, courtWidth, courtX, courtY, insightY, legendY } = posterLayout;
    const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
    const shots = matchCtx.enrichedShots.filter((s) => s.player === "host" && s.stroke !== "Serve");
    const clipBounds = singlesClipBounds(scales, half);
    const topFlow = computeShotFlows(shots, { minCount: 3, player: "host" })
      .sort((a, b) => b.count - a.count)[0];
    const counts = strokeCounts(shots.filter((s) => s.result === "In"));
    const legendItems = STROKE_LEGEND.filter((item) => counts[item.label] > 0);

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: "Arrow = ball path · color = point win rate",
        theme,
        title: `${matchCtx.hostName} — Shot Trajectories`,
      },
      React.createElement(
        "g",
        { transform: `translate(${courtX}, ${courtY})` },
        React.createElement(
          CourtSurface,
          { half, height: courtHeight, idPrefix: "rays-host", surface, theme, width: courtWidth },
          React.createElement(RayLayer, {
            alpha: 0.58,
            clip: true,
            clipBounds,
            curved: true,
            curvature: 0.04,
            highContrast: true,
            player: "host",
            scales,
            showHitDots: false,
            shots,
            strokeWidth: 1.15,
            theme,
          }),
          React.createElement(RayLayer, {
            alpha: 0.42,
            clip: true,
            clipBounds,
            curved: true,
            curvature: 0.03,
            flowMaxWidth: 6,
            flowMinCount: 3,
            flowMode: true,
            player: "host",
            scales,
            shots,
            theme,
          }),
        ),
        legendItems.length > 0 &&
          React.createElement(
            "g",
            { transform: `translate(0, ${legendY - courtY})` },
            React.createElement(Legend, {
              items: legendItems.map((item) => ({
                ...item,
                label: `${item.label} (${counts[item.label]})`,
              })),
              orientation: format === "story" ? "vertical" : "horizontal",
              swatchSize: 14,
              theme,
              x: 0,
              y: 0,
            }),
            topFlow &&
              React.createElement(StatCallout, {
                label: "top pattern win rate",
                theme,
                value: `${Math.round(topFlow.winRate * 100)}%`,
                x: courtWidth - 220,
                y: 0,
              }),
          ),
        renderInsight(
          courtWidth,
          insightY - courtY,
          topFlow
            ? `Most repeated pattern wins ${Math.round(topFlow.winRate * 100)}% — drill this lane in practice.`
            : "Review shot direction patterns in the full analytics dashboard.",
        ),
      ),
    );
  };
}

function buildMomentumPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const posterLayout = resolvePosterContentLayout(layout, {
      analyticsBand: 72,
      courtAspect: 2.2,
      insightBand: 88,
      legendBand: 0,
    });
    const chartWidth = posterLayout.courtWidth;
    const chartHeight = posterLayout.courtHeight;
    const hostWin = computePointsWonRate(matchCtx.momentumPoints, "host");
    const guestWin = computePointsWonRate(matchCtx.momentumPoints, "guest");
    const series = computeMomentum(matchCtx.momentumPoints, "host");
    const maxLead = series.reduce((max, point) => Math.max(max, Math.abs(point.cumulativeDiff)), 0);
    const finalDiff = series[series.length - 1]?.cumulativeDiff ?? 0;

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: "Quick momentum snapshot — see stats posters for coaching detail",
        theme,
        title: `Momentum — ${matchCtx.hostName} vs ${matchCtx.guestName}`,
      },
      React.createElement(
        "g",
        { transform: `translate(${posterLayout.courtX}, ${posterLayout.courtY})` },
        React.createElement(MomentumChart, {
          height: chartHeight,
          hostPlayer: "host",
          points: matchCtx.momentumPoints,
          theme,
          width: chartWidth,
        }),
        React.createElement(
          "g",
          { transform: `translate(0, ${posterLayout.analyticsY - posterLayout.courtY})` },
          React.createElement(StatCallout, {
            label: `${matchCtx.hostName} points won`,
            theme,
            value: `${Math.round(hostWin * 100)}%`,
            x: 0,
            y: 0,
          }),
          React.createElement(StatCallout, {
            label: `${matchCtx.guestName} points won`,
            theme,
            value: `${Math.round(guestWin * 100)}%`,
            x: chartWidth / 2 - 110,
            y: 0,
          }),
          React.createElement(StatCallout, {
            label: "max point swing",
            theme,
            value: `±${maxLead}`,
            x: chartWidth - 220,
            y: 0,
          }),
        ),
        renderInsight(
          chartWidth,
          posterLayout.insightY - posterLayout.courtY,
          finalDiff === 0
            ? "Match stayed tight — focus on serve and return patterns for the rematch."
            : `${finalDiff > 0 ? matchCtx.hostName : matchCtx.guestName} finished +${Math.abs(finalDiff)} — momentum shifted on return games.`,
        ),
      ),
    );
  };
}

function buildCoachInsightsPoster() {
  return (format) => {
    const layout = resolveFrameLayout(format);
    const insights = generateCoachInsights({
      enrichedShots: matchCtx.enrichedShots,
      guestName: matchCtx.guestName,
      hostName: matchCtx.hostName,
      points: matchCtx.points,
    });

    return React.createElement(
      FigureFrame,
      {
        branding,
        format,
        subtitle: "Practical takeaways for coaches",
        theme,
        title: `Coach Report — ${matchCtx.hostName} vs ${matchCtx.guestName}`,
      },
      renderCoachCards(matchCtx, theme, layout, insights),
    );
  };
}

function createPosterBuilders() {
  return {
    "coach-insights": buildCoachInsightsPoster(),
    "court-dominance": buildCourtDominancePoster(),
    dotdensity: buildDotDensityPoster(),
    "hexbin-host": buildHexbinPoster("host", "Shot Frequency & Efficiency"),
    momentum: buildMomentumPoster(),
    "rays-host": buildRaysPoster(),
    "serve-host": buildServePoster(),
  };
}

async function exportPoster(name, format, svgOnly, posterBuilders) {
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
  matchCtx = await loadMatchContext();
  const posterBuilders = createPosterBuilders();

  console.log(`\n🎨 PPD social export — ${matchCtx.hostName} vs ${matchCtx.guestName}`);
  console.log(`   ${names.length} poster(s) × ${formats.length} format(s)\n`);

  for (const format of formats) {
    for (const name of names) {
      await exportPoster(name, format, svgOnly, posterBuilders);
    }
  }

  console.log(`\n✅ Exported to ${outRoot}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
