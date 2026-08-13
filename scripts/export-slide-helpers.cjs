/**
 * Shared SVG slide helpers for carousel and poster exports.
 */

const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

function formatPct(rate) {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

const React = require("react");
const {
  CourtSurface,
  DensityLayer,
  DotLayer,
  HexbinLayer,
  ServeLayer,
  RayLayer,
  ZoneBarChart,
  StatCallout,
  ColorBar,
  MomentumChart,
} = require("@courtviz/react");
const {
  createCourtScales,
  resolvePosterContentLayout,
  layoutBands,
  computeServeZones,
  computeRallyBucketStats,
  computeShotFlows,
  computeHexbins,
  computePointsWonRate,
  computeFirstServeInRate,
  computeBreakPointConversion,
  computeServePlacements,
  computeZoneWinRates,
  computeZoneWinRatesByPoint,
  aggregateSideWinRatesByPoint,
  fitSvgText,
  pointKeyFromShot,
  shotPlayerWonPoint,
  SINGLES_HALF,
  SLIDE_BANDS,
  measureSvgText,
  truncateText,
  wrapText,
} = require("@courtviz/core");
const { getPlayerColor } = require("@courtviz/themes");
const { colorPrimitives } = require("@ppd/tokens");
const { BRAND_SURFACE } = require("./brand-surface.cjs");

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

const CATEGORY_COLORS = {
  pattern: colorPrimitives.accent,
  rally: colorPrimitives.violet,
  serve: colorPrimitives.amber,
  zone: colorPrimitives.primaryBright,
};

function wrapSvgText({
  fill,
  fontFamily,
  fontSize,
  fontWeight = 400,
  lineHeight = 1.35,
  maxLines = 2,
  maxWidth,
  text,
  x,
  y,
}) {
  const allLines = wrapText(text, { fontFamily, fontSize, fontWeight, maxWidth });
  const clipped = allLines.slice(0, maxLines);
  if (allLines.length > maxLines && clipped.length > 0) {
    const last = clipped[clipped.length - 1];
    const ellipsisWidth = measureSvgText("…", { fontFamily, fontSize, fontWeight });
    clipped[clipped.length - 1] = truncateText(last, {
      fontFamily,
      fontSize,
      fontWeight,
      maxWidth: maxWidth - ellipsisWidth,
    });
  }

  return React.createElement(
    "text",
    { fill, fontFamily, fontSize, fontWeight, x, y },
    clipped.map((line, index) =>
      React.createElement("tspan", { key: index, dy: index === 0 ? 0 : fontSize * lineHeight, x }, line),
    ),
  );
}

function insightAccent(theme, category, index = 0) {
  return CATEGORY_COLORS[category] ?? getPlayerColor(index % 2 === 0 ? "host" : "guest", theme);
}

function computeLongRallyWins(ctx) {
  const { pointKeyFromShot } = require("@courtviz/core");
  let hostWon = 0;
  let guestWon = 0;

  for (const point of ctx.points) {
    if (!point.pointWinner) continue;
    const key = `${point.setNumber}-${point.gameNumber}-${point.pointNumber}`;
    const pointShots = ctx.enrichedShots.filter((s) => pointKeyFromShot(s) === key);
    const rallyLen = Math.max(...pointShots.map((s) => s.shotNumber ?? 0), 0);
    if (rallyLen < 7) continue;
    if (point.pointWinner === "host") hostWon++;
    else guestWon++;
  }

  return { guestWon, hostWon };
}

function extractHeroStat(headline) {
  const pct = headline.match(/(\d+)%/);
  if (pct) return `${pct[1]}%`;
  const num = headline.match(/(\d+)/);
  return num ? num[1] : headline.split(" ")[0] ?? "—";
}

function serveCounts(shots, player) {
  const serves = shots.filter((s) => s.player === player && s.stroke === "Serve");
  const byPoint = new Map();
  for (const serve of serves) {
    const key = `${serve.setNumber}-${serve.gameNumber}-${serve.pointNumber}`;
    const entry = byPoint.get(key) ?? { first: 0, second: 0, faults: 0, hasSecond: false };
    if (serve.type === "second_serve") {
      entry.second++;
      entry.hasSecond = true;
    } else {
      entry.first++;
    }
    if (serve.result !== "In") entry.faults++;
    byPoint.set(key, entry);
  }
  let first = 0;
  let second = 0;
  let faults = 0;
  for (const entry of byPoint.values()) {
    // Each point has at most one first serve attempt and optionally a second.
    first += entry.hasSecond ? 1 : Math.min(entry.first, 1);
    second += entry.hasSecond ? 1 : 0;
    // Faults = missed first serves (each point can have at most 1 first-serve fault).
    if (entry.hasSecond) faults++;
  }
  return { first, second, faults, total: byPoint.size };
}

function setScore(sets) {
  return sets
    .map((s) => {
      if (s.hostTiebreakScore != null && s.guestTiebreakScore != null) {
        return `${s.hostScore}-${s.guestScore} (${s.hostTiebreakScore}-${s.guestTiebreakScore})`;
      }
      return `${s.hostScore}-${s.guestScore}`;
    })
    .join(" · ");
}

function sharedEfficiencyDomain(shots, player, half, gridsize, theme) {
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
  if (hexbins.length === 0) return { vmin: 0, vmax: 1 };
  const values = hexbins.map((h) => h.value);
  return { vmin: Math.min(...values), vmax: Math.max(...values) };
}

function dualEfficiencyDomain(shots, players, half, gridsize) {
  const domains = players.map((p) => sharedEfficiencyDomain(shots, p, half, gridsize));
  return {
    vmin: Math.min(...domains.map((d) => d.vmin)),
    vmax: Math.max(...domains.map((d) => d.vmax)),
  };
}

function renderMiniDualCourt(ctx, theme, x, y, width, height) {
  const half = "near";
  const gridsize = 5;
  const gap = SLIDE_BANDS.dualCourtGap;
  const courtW = Math.floor((width - gap) / 2);
  const courtH = height;
  const valueDomain = dualEfficiencyDomain(ctx.enrichedShots, ["host", "guest"], half, gridsize);
  const extent = singlesExtent(half);
  const surface = BRAND_SURFACE;
  const miniHexMin = 2;
  const miniHexSize = [0.25, 0.55];

  return React.createElement(
    "g",
    { transform: `translate(${x}, ${y})` },
    ["host", "guest"].map((player, index) => {
      const innerH = courtH - 24;
      const shots = ctx.enrichedShots.filter((s) => s.player === player && s.stroke !== "Serve");
      const name = player === "host" ? ctx.hostName : ctx.guestName;
      return React.createElement(
        "g",
        { key: player, transform: `translate(${index * (courtW + gap)}, 0)` },
        React.createElement(
          "text",
          {
            fill: getPlayerColor(player, theme),
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.body,
            fontWeight: 700,
            textAnchor: "middle",
            x: courtW / 2,
            y: 18,
          },
          name.split(" ").pop(),
        ),
        React.createElement(
          "g",
          { transform: "translate(0, 24)" },
          React.createElement(
            CourtSurface,
            { half, height: innerH, idPrefix: `slide-mini-${player}`, surface, theme, width: courtW },
            React.createElement(HexbinLayer, {
              colorScale: "efficiency",
              gridsize,
              half,
              labelMinCount: 4,
              minCount: miniHexMin,
              player,
              scales: createCourtScales({ half, height: innerH, margin: 1.5, width: courtW }),
              shots,
              sizeRange: miniHexSize,
              theme,
              useHalfCourtNormalization: true,
              valueDomain,
              extent,
            }),
          ),
        ),
      );
    }),
  );
}

function aggregateSideWinRates(shots, player) {
  return aggregateSideWinRatesByPoint(shots, player)
    .filter((entry) => entry.side !== "center" && entry.total >= 3)
    .map((entry) => ({
      side: entry.side.charAt(0).toUpperCase() + entry.side.slice(1),
      total: entry.total,
      winRate: entry.winRate,
      won: entry.won,
    }));
}

function renderSpeedHistogram(ctx, theme, width, height) {
  const allSpeeds = ctx.enrichedShots
    .filter((s) => s.stroke === "Serve" && s.speedKmh != null)
    .map((s) => ({ player: s.player, speed: s.speedKmh }));

  if (allSpeeds.length === 0) return null;

  const minSpeed = Math.floor(Math.min(...allSpeeds.map((s) => s.speed)) / 10) * 10;
  const maxSpeed = Math.ceil(Math.max(...allSpeeds.map((s) => s.speed)) / 10) * 10;
  const binSize = 10;
  const binCount = Math.max(1, Math.ceil((maxSpeed - minSpeed) / binSize));
  const bins = Array.from({ length: binCount }, (_, i) => ({
    host: 0,
    guest: 0,
    label: `${minSpeed + i * binSize}`,
  }));

  for (const s of allSpeeds) {
    const idx = Math.min(binCount - 1, Math.floor((s.speed - minSpeed) / binSize));
    if (s.player === "host") bins[idx].host++;
    else bins[idx].guest++;
  }

  const maxCount = Math.max(...bins.map((b) => b.host + b.guest), 1);
  const barW = width / binCount;
  const chartH = height - 24;
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);

  return React.createElement(
    "g",
    null,
    React.createElement("text", {
      fill: theme.inkMuted,
      fontFamily: theme.fonts.bodyFont,
      fontSize: theme.fontSize.label,
      fontWeight: 600,
      letterSpacing: 1,
      x: 0,
      y: 0,
    }, "SERVE SPEED (km/h)"),
    bins.map((bin, i) => {
      const hRatio = (bin.host + bin.guest) / maxCount;
      const barH = Math.max(2, hRatio * chartH);
      const hostH = maxCount > 0 ? (bin.host / maxCount) * chartH : 0;
      const guestH = maxCount > 0 ? (bin.guest / maxCount) * chartH : 0;
      return React.createElement(
        "g",
        { key: i },
        React.createElement("rect", {
          fill: `${guestColor}55`,
          height: Math.max(2, guestH),
          width: barW * 0.8,
          x: i * barW + barW * 0.1,
          y: chartH - Math.max(2, guestH) + 16,
        }),
        React.createElement("rect", {
          fill: hostColor,
          height: Math.max(2, hostH),
          width: barW * 0.8,
          x: i * barW + barW * 0.1,
          y: chartH - Math.max(2, hostH) - Math.max(2, guestH) + 16,
        }),
        i % 2 === 0
          ? React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: 10,
              textAnchor: "middle",
              x: i * barW + barW / 2,
              y: height + 8,
            }, bin.label)
          : null,
      );
    }),
  );
}

function renderServeZoneHeatGrid(zones, theme, width, height, playerColor) {
  const ZONE_ORDER = [
    { side: "deuce", zone: "T" },
    { side: "deuce", zone: "body" },
    { side: "deuce", zone: "wide" },
    { side: "ad", zone: "wide" },
    { side: "ad", zone: "body" },
    { side: "ad", zone: "T" },
  ];

  const zoneMap = new Map(zones.map((z) => [`${z.side}-${z.zone}`, z]));
  const cellW = width / 3;
  const cellH = height / 2;
  const cellGap = 4;

  function heatColor(inRate) {
    if (inRate >= 0.8) return `${playerColor}cc`;
    if (inRate >= 0.6) return `${playerColor}88`;
    if (inRate >= 0.4) return `${playerColor}44`;
    return `${theme.inkMuted}22`;
  }

  return React.createElement(
    "g",
    null,
    ZONE_ORDER.map((key, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const z = zoneMap.get(`${key.side}-${key.zone}`);
      const inRate = z ? z.inRate : 0;
      const count = z ? z.count : 0;
      const inCount = z ? z.inCount : 0;
      const pct = count > 0 ? Math.round(inRate * 100) : 0;
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2;

      return React.createElement(
        "g",
        { key: `${key.side}-${key.zone}` },
        React.createElement("rect", {
          fill: heatColor(inRate),
          height: cellH - cellGap,
          rx: 8,
          stroke: count > 0 ? `${playerColor}33` : `${theme.inkMuted}11`,
          strokeWidth: 1,
          width: cellW - cellGap,
          x: col * cellW + cellGap / 2,
          y: row * cellH + cellGap / 2,
        }),
        count > 0
          ? React.createElement("text", {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 22,
              fontWeight: 700,
              textAnchor: "middle",
              x: cx,
              y: cy - 4,
            }, `${pct}%`)
          : null,
        count > 0
          ? React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: 10,
              textAnchor: "middle",
              x: cx,
              y: cy + 14,
            }, `${key.side[0].toUpperCase()}${key.zone[0].toUpperCase()} · n=${count}`)
          : React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: 10,
              textAnchor: "middle",
              x: cx,
              y: cy + 4,
            }, `${key.side[0].toUpperCase()}${key.zone[0].toUpperCase()}`),
      );
    }),
  );
}

function renderServeSlide(ctx, theme, layout, insight) {
  const hasInsight = Boolean(insight);
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 720,
    courtAspect: 1,
    insightBand: hasInsight ? 100 : 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY, insightY } = posterLayout;
  const half = "near";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const hostZones = computeServeZones(ctx.enrichedShots, "host");
  const guestZones = computeServeZones(ctx.enrichedShots, "guest");
  const counts = serveCounts(ctx.enrichedShots, "host");
  const hostAces = officialValue(ctx, "host", "Aces") ?? 0;
  const guestAces = officialValue(ctx, "guest", "Aces") ?? 0;
  const hostDf = countDoubleFaults(ctx.enrichedShots, "host");
  const guestDf = countDoubleFaults(ctx.enrichedShots, "guest");
  const speedStats = buildServeSpeedStats(ctx);
  const hostZoneBarData = hostZones.slice(0, 3).map((zone) => ({
    color: getPlayerColor("host", theme),
    playerLabel: ctx.hostName,
    total: zone.inCount,
    winRate: zone.winRate,
    zone: `${zone.side} ${zone.zone}`,
  }));
  const guestZoneBarData = guestZones.slice(0, 3).map((zone) => ({
    color: getPlayerColor("guest", theme),
    playerLabel: ctx.guestName,
    total: zone.inCount,
    winRate: zone.winRate,
    zone: `${zone.side} ${zone.zone}`,
  }));
  const calloutY = 8;
  const calloutSpan = courtWidth / 2;
  const calloutRowGap = 80;
  const zoneBarH = Math.max(120, SLIDE_BANDS.zoneBarH * 2);
  const hostLast = ctx.hostName.split(" ").pop();
  const guestLast = ctx.guestName.split(" ").pop();
  const zoneSectionY = calloutY + calloutRowGap * 2 + 16;

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      "text",
      {
        fill: getPlayerColor("host", theme),
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.label,
        fontWeight: 700,
        x: 0,
        y: -4,
      },
      `${ctx.hostName.split(" ").pop()} serve court`,
    ),
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-serve", surface: BRAND_SURFACE, theme, width: courtWidth },
      React.createElement(ServeLayer, {
        haloWidth: 1.5,
        highContrast: true,
        includeFaults: true,
        inBoxOnly: false,
        player: "host",
        scales,
        serveType: "both",
        shots: ctx.enrichedShots,
        size: 8,
        theme,
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${analyticsY - courtY})` },
      React.createElement(StatCallout, {
        label: `${hostLast} 1st serves`,
        theme,
        value: String(counts.first),
        x: 0,
        y: calloutY,
      }),
      React.createElement(StatCallout, {
        label: `${hostLast} 2nd serves`,
        theme,
        value: String(counts.second),
        x: calloutSpan,
        y: calloutY,
      }),
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("host", theme),
        label: "aces (H / G)",
        theme,
        value: `${hostAces} / ${guestAces}`,
        x: 0,
        y: calloutY + calloutRowGap,
      }),
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("guest", theme),
        label: hostDf + guestDf > 0 ? "double faults (H / G)" : "1st serve in",
        theme,
        value: hostDf + guestDf > 0 ? `${hostDf} / ${guestDf}` : `${Math.round((counts.first / Math.max(counts.first + counts.second, 1)) * 100)}%`,
        x: calloutSpan,
        y: calloutY + calloutRowGap,
      }),
      React.createElement(
        "text",
        {
          fill: getPlayerColor("host", theme),
          fontFamily: theme.fonts.condensedFont,
          fontSize: theme.fontSize.label,
          fontWeight: 700,
          x: 0,
          y: zoneSectionY - 8,
        },
        hostLast,
      ),
      React.createElement(
        "g",
        { transform: `translate(0, ${zoneSectionY})` },
        React.createElement(ZoneBarChart, {
          data: hostZoneBarData,
          height: zoneBarH,
          maxBars: 3,
          theme,
          width: courtWidth,
        }),
      ),
      React.createElement(
        "text",
        {
          fill: getPlayerColor("guest", theme),
          fontFamily: theme.fonts.condensedFont,
          fontSize: theme.fontSize.label,
          fontWeight: 700,
          x: 0,
          y: zoneSectionY + zoneBarH + 28,
        },
        guestLast,
      ),
      React.createElement(
        "g",
        { transform: `translate(0, ${zoneSectionY + zoneBarH + 36})` },
        React.createElement(ZoneBarChart, {
          data: guestZoneBarData,
          height: zoneBarH,
          maxBars: 3,
          theme,
          width: courtWidth,
        }),
      ),
      React.createElement(
        "g",
        { transform: `translate(0, ${zoneSectionY + zoneBarH * 2 + 48})` },
        renderSpeedHistogram(ctx, theme, courtWidth, 80),
      ),
    ),
    hasInsight &&
      React.createElement(
        "g",
        { transform: `translate(0, ${insightY - courtY})` },
        renderCompactCoachCard(insight, theme, courtWidth, 92),
      ),
  );
}

function renderRaysSlide(ctx, theme, layout) {
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const gap = 12;
  const colGap = 12;
  const playerH = Math.floor((contentH - gap) / 2);
  const miniCourtH = Math.floor(playerH - 40);
  const miniCourtW = Math.floor((contentW - colGap * 2) / 3);
  const half = "near";

  function renderFlowMiniCourt(flow, player, index, playerColor) {
    if (!flow) return null;
    const scales = createCourtScales({ half, height: miniCourtH, margin: 1.5, width: miniCourtW });
    const fromX = scales.x(flow.fromX);
    const fromY = scales.y(flow.fromY);
    const toX = scales.x(flow.toX);
    const toY = scales.y(flow.toY);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 20;
    const pct = flow.winRate == null ? null : Math.round(flow.winRate * 100);
    const label = `${flow.fromZone.replace(/_/g, " ")} → ${flow.toZone.replace(/_/g, " ")}`;
    const clipId = `flow-clip-${player}-${index}`;

    return React.createElement(
      "g",
      { key: `${player}-${index}`, transform: `translate(${index * (miniCourtW + colGap)}, 0)` },
      React.createElement(
        "defs",
        null,
        React.createElement("clipPath", { id: clipId },
          React.createElement("rect", { height: miniCourtH, width: miniCourtW, x: 0, y: 0 }),
        ),
      ),
      React.createElement(CourtSurface, {
        half,
        height: miniCourtH,
        idPrefix: `slide-rays-${player}-${index}`,
        surface: BRAND_SURFACE,
        theme,
        width: miniCourtW,
      }),
      React.createElement(
        "g",
        { clipPath: `url(#${clipId})` },
        React.createElement("path", {
          d: `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`,
          fill: "none",
          stroke: playerColor,
          strokeWidth: Math.max(2, Math.min(6, flow.count / 3)),
          strokeLinecap: "round",
          opacity: 0.7,
        }),
        React.createElement("circle", { cx: fromX, cy: fromY, fill: playerColor, r: 3 }),
        React.createElement("circle", { cx: toX, cy: toY, fill: playerColor, opacity: 0.5, r: 3 }),
      ),
      React.createElement("text", {
        fill: theme.ink,
        fontFamily: theme.fonts.bodyFont,
        fontSize: 12,
        fontWeight: 600,
        textAnchor: "middle",
        x: miniCourtW / 2,
        y: miniCourtH + 14,
      }, label),
      React.createElement("text", {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: 12,
        textAnchor: "middle",
        x: miniCourtW / 2,
        y: miniCourtH + 28,
      }, `${pct != null ? pct + "%" : "—"} win · n=${flow.count}`),
    );
  }

  function renderPlayerFlows(player, name, yOffset) {
    const playerColor = getPlayerColor(player, theme);
    const shots = ctx.enrichedShots.filter((s) => s.player === player && s.stroke !== "Serve");
    const flows = computeShotFlows(shots, { minCount: 3, player })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return React.createElement(
      "g",
      { transform: `translate(0, ${yOffset})` },
      React.createElement("text", {
        fill: playerColor,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.subtitle,
        fontWeight: 700,
        x: 0,
        y: 16,
      }, name.toUpperCase()),
      React.createElement(
        "g",
        { transform: `translate(0, 28)` },
        flows.map((flow, i) => renderFlowMiniCourt(flow, player, i, playerColor)),
        flows.length === 0
          ? React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.body,
              x: 0,
              y: miniCourtH / 2,
            }, "Not enough shot data")
          : null,
      ),
    );
  }

  return React.createElement(
    "g",
    null,
    renderPlayerFlows("host", ctx.hostName, 0),
    renderPlayerFlows("guest", ctx.guestName, playerH + gap),
  );
}

function renderRallyBars(ctx, theme, layout) {
  const hostBuckets = computeRallyBucketStats(ctx.enrichedShots, "host");
  const guestBuckets = computeRallyBucketStats(ctx.enrichedShots, "guest");
  const highlights = buildRallyHighlightStats(ctx);
  const totalRows = hostBuckets.length + guestBuckets.length;
  const footerH = SLIDE_BANDS.rallyFooterH;
  const sectionGap = SLIDE_BANDS.rallySectionGap;
  const rowH = Math.max(SLIDE_BANDS.rallyMinRowH, Math.min(SLIDE_BANDS.rallyMaxRowH, Math.floor((layout.content.height * 0.55) / Math.max(totalRows, 1))));
  const barsBlockH = 16 + hostBuckets.length * rowH + sectionGap + guestBuckets.length * rowH;
  const barW = layout.content.width;

  const [barsBand, highlightBand] = layoutBands(layout.content.height, [
    { id: "bars", height: barsBlockH },
    { id: "highlight", height: footerH },
  ], SLIDE_BANDS.rallyHighlightOffset);
  const highlightY = highlightBand.y;

  return React.createElement(
    "g",
    { transform: `translate(0, ${barsBand.y})` },
    React.createElement(
      "text",
      {
        fill: getPlayerColor("host", theme),
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.title,
        fontWeight: 700,
        x: 0,
        y: 0,
      },
      ctx.hostName,
    ),
    hostBuckets.map((bucket, index) =>
      renderRallyBarRow(bucket, getPlayerColor("host", theme), barW, 24 + index * rowH, theme),
    ),
    React.createElement(
      "text",
      {
        fill: getPlayerColor("guest", theme),
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.title,
        fontWeight: 700,
        x: 0,
        y: 24 + hostBuckets.length * rowH + sectionGap - 16,
      },
      ctx.guestName,
    ),
    guestBuckets.map((bucket, index) =>
      renderRallyBarRow(
        bucket,
        getPlayerColor("guest", theme),
        barW,
        24 + hostBuckets.length * rowH + sectionGap + 8 + index * rowH,
        theme,
      ),
    ),
    React.createElement("line", {
      stroke: `${theme.inkMuted}44`,
      strokeWidth: 1,
      x1: 0,
      x2: barW,
      y1: highlightY - 8,
      y2: highlightY - 8,
    }),
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.label,
        fontWeight: 600,
        x: 0,
        y: highlightY + 8,
      },
      "MATCH RALLY PROFILE",
    ),
    React.createElement(
      "text",
      {
        fill: theme.ink,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.title,
        fontWeight: 600,
        x: 0,
        y: highlightY + 44,
      },
      `${highlights[0].title}: ${highlights[0].hostValue}`,
    ),
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: theme.fontSize.body,
        x: 0,
        y: highlightY + 76,
      },
      `${highlights[1].title}: ${highlights[1].hostValue} shots per point (match avg)`,
    ),
  );
}

function renderRallyBarRow(bucket, color, width, y, theme) {
  const labelW = 150;
  const barW = width - labelW - 110;
  const fillW = barW * (Number.isFinite(bucket.winRate) ? bucket.winRate : 0);
  return React.createElement(
    "g",
    { key: bucket.bucket, transform: `translate(0, ${y})` },
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.body,
        fontWeight: 600,
        x: 0,
        y: 20,
      },
      `${bucket.bucket} shots`,
    ),
    React.createElement("rect", {
      fill: `${theme.inkMuted}33`,
      height: 20,
      rx: 10,
      width: barW,
      x: labelW,
      y: 4,
    }),
    React.createElement("rect", {
      fill: color,
      height: 20,
      rx: 10,
      width: fillW,
      x: labelW,
      y: 4,
    }),
    React.createElement(
      "text",
      {
        fill: color,
        fontFamily: theme.fonts.condensedFont,
        fontSize: 28,
        fontWeight: 700,
        x: labelW + barW + 16,
        y: 24,
      },
      formatPct(bucket.winRate),
    ),
  );
}

function renderDuelStats(ctx, theme, layout, stats) {
  const SECTION_H = SLIDE_BANDS.duelSectionH;
  const MIN_ROW_H = SLIDE_BANDS.duelMinRowH;
  const MAX_ROW_BONUS = SLIDE_BANDS.duelMaxRowBonus;
  const contentH = layout.content.height - 8;
  const sectionCount = stats.filter((s) => s.section).length;
  const rowCount = stats.filter((s) => !s.section).length;
  const fixedH = sectionCount * SECTION_H + rowCount * MIN_ROW_H;
  const bonus =
    rowCount > 0 ? Math.max(0, Math.min(MAX_ROW_BONUS, Math.floor((contentH - fixedH) / rowCount))) : 0;
  const rowH = MIN_ROW_H + bonus;
  const blockH = sectionCount * SECTION_H + rowCount * rowH;

  const [duelBand] = layoutBands(layout.content.height, [
    { id: "duel", grow: true },
  ]);

  let y = duelBand.y;
  const elements = [];

  for (const stat of stats) {
    if (stat.section) {
      elements.push(
        React.createElement(
          "g",
          { key: stat.title, transform: `translate(0, ${y})` },
          React.createElement("rect", {
            fill: `${theme.inkMuted}18`,
            height: SECTION_H - 6,
            rx: 6,
            width: layout.content.width,
            x: 0,
            y: 0,
          }),
          React.createElement(
            "text",
            {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.label,
              fontWeight: 700,
              x: 12,
              y: 18,
            },
            stat.title.toUpperCase(),
          ),
        ),
      );
      y += SECTION_H;
      continue;
    }

    const total = Math.max((stat.hostShare ?? 0) + (stat.guestShare ?? 0), 0.001);
    const hostPct = (stat.hostShare ?? 0) / total;
    const guestPct = 1 - hostPct;
    const barW = layout.content.width - 40;
    const centerX = barW / 2;
    const hostWins = stat.hostShare >= stat.guestShare;
    const hasNumericBar = stat.hostShare > 0 || stat.guestShare > 0;

    elements.push(
      React.createElement(
        "g",
        { key: stat.title, transform: `translate(0, ${y})` },
        React.createElement(
          "text",
          {
            fill: theme.inkMuted,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.label,
            fontWeight: 600,
            textAnchor: "middle",
            x: barW / 2,
            y: 14,
          },
          stat.title.toUpperCase(),
        ),
        React.createElement(
          "text",
          {
            fill: hostWins ? getPlayerColor("host", theme) : `${getPlayerColor("host", theme)}88`,
            fontFamily: theme.fonts.condensedFont,
            fontSize: hostWins ? 28 : 22,
            fontWeight: 700,
            x: 0,
            y: 44,
          },
          stat.hostValue,
        ),
        React.createElement(
          "text",
          {
            fill: !hostWins ? getPlayerColor("guest", theme) : `${getPlayerColor("guest", theme)}88`,
            fontFamily: theme.fonts.condensedFont,
            fontSize: !hostWins ? 28 : 22,
            fontWeight: 700,
            textAnchor: "end",
            x: barW,
            y: 44,
          },
          stat.guestValue,
        ),
        hasNumericBar &&
          React.createElement("rect", {
            fill: `${theme.inkMuted}33`,
            height: 10,
            rx: 5,
            width: barW,
            x: 0,
            y: 52,
          }),
        hasNumericBar &&
          React.createElement("rect", {
            fill: getPlayerColor("host", theme),
            height: 10,
            rx: 5,
            width: centerX * hostPct,
            x: centerX - centerX * hostPct,
            y: 52,
          }),
        hasNumericBar &&
          React.createElement("rect", {
            fill: getPlayerColor("guest", theme),
            height: 10,
            rx: 5,
            width: centerX * guestPct,
            x: centerX,
            y: 52,
          }),
      ),
    );
    y += rowH;
  }

  return React.createElement("g", null, ...elements);
}

function renderInsightMiniViz(viz, theme, width, y) {
  if (!viz) return null;
  const vizW = Math.min(160, width * 0.4);
  const vizX = width - vizW - 12;

  if (viz.kind === "bp-gauge") {
    const r = 28;
    const cx = vizX + vizW / 2;
    const cy = y + r + 4;
    const circ = 2 * Math.PI * r;
    const arc = circ * viz.rate;
    return React.createElement(
      "g",
      { transform: `translate(${vizX}, 0)` },
      renderRingGauge(cx, cy, r, viz.rate, theme.ink, "BP", `${viz.won}/${viz.total}`, theme),
    );
  }

  if (viz.kind === "rally-buckets") {
    const barH = 10;
    const barGap = 4;
    const maxTotal = Math.max(...viz.buckets.map((b) => b.total), 1);
    return React.createElement(
      "g",
      { transform: `translate(${vizX}, ${y})` },
      viz.buckets.slice(0, 4).map((b, i) =>
        React.createElement(
          "g",
          { key: b.bucket },
          React.createElement("text", {
            fill: theme.inkMuted,
            fontFamily: theme.fonts.bodyFont,
            fontSize: 8,
            x: 0,
            y: i * (barH + barGap) + 8,
          }, b.bucket),
          React.createElement("rect", {
            fill: `${theme.inkMuted}33`,
            height: barH - 2,
            width: vizW - 30,
            x: 24,
            y: i * (barH + barGap),
          }),
          React.createElement("rect", {
            fill: theme.ink,
            height: barH - 2,
            width: Math.max(2, ((vizW - 30) * b.total) / maxTotal),
            x: 24,
            y: i * (barH + barGap),
          }),
        ),
      ),
    );
  }

  if (viz.kind === "serve-zones" && viz.zones.length > 0) {
    const top3 = viz.zones.slice(0, 3);
    const barH = 10;
    const barGap = 4;
    const maxCount = Math.max(...top3.map((z) => z.inCount), 1);
    return React.createElement(
      "g",
      { transform: `translate(${vizX}, ${y})` },
      top3.map((z, i) =>
        React.createElement(
          "g",
          { key: `${z.side}-${z.zone}` },
          React.createElement("text", {
            fill: theme.inkMuted,
            fontFamily: theme.fonts.bodyFont,
            fontSize: 8,
            x: 0,
            y: i * (barH + barGap) + 8,
          }, `${z.side[0].toUpperCase()}${z.zone[0].toUpperCase()}`),
          React.createElement("rect", {
            fill: `${theme.inkMuted}33`,
            height: barH - 2,
            width: vizW - 40,
            x: 20,
            y: i * (barH + barGap),
          }),
          React.createElement("rect", {
            fill: theme.ink,
            height: barH - 2,
            width: Math.max(2, ((vizW - 40) * z.inCount) / maxCount),
            x: 20,
            y: i * (barH + barGap),
          }),
          React.createElement("text", {
            fill: theme.inkMuted,
            fontFamily: theme.fonts.bodyFont,
            fontSize: 8,
            x: vizW - 16,
            y: i * (barH + barGap) + 8,
          }, formatPct(z.winRate)),
        ),
      ),
    );
  }

  if (viz.kind === "flow" && viz.flows.length > 0) {
    const top3 = viz.flows.slice(0, 3);
    return React.createElement(
      "g",
      { transform: `translate(${vizX}, ${y})` },
      top3.map((f, i) =>
        React.createElement("text", {
          fill: theme.inkMuted,
          fontFamily: theme.fonts.bodyFont,
          fontSize: 8,
          key: i,
          x: 0,
          y: i * 14 + 10,
        }, `${f.fromZone.replace(/_/g, " ")} → ${f.toZone.replace(/_/g, " ")} ${formatPct(f.winRate)}`),
      ),
    );
  }

  if (viz.kind === "zone-heat" && viz.zones.length > 0) {
    const top3 = viz.zones.slice(0, 3);
    return React.createElement(
      "g",
      { transform: `translate(${vizX}, ${y})` },
      top3.map((z, i) =>
        React.createElement("text", {
          fill: theme.inkMuted,
          fontFamily: theme.fonts.bodyFont,
          fontSize: 8,
          key: z.zone,
          x: 0,
          y: i * 14 + 10,
        }, `${z.zone.replace(/_/g, " ")} ${formatPct(z.winRate)} (n=${z.total})`),
      ),
    );
  }

  return null;
}

function renderCompactCoachCard(insight, theme, width, height = 100) {
  if (!insight) return null;
  const accent = insightAccent(theme, insight.category);
  const categoryLabel = insight.category ? insight.category.toUpperCase() : "INSIGHT";
  const padding = 16;
  const hasViz = Boolean(insight.viz);
  const maxTextWidth = hasViz ? width - padding * 2 - 170 : width - padding * 2;
  const pillWidth = Math.min(120, categoryLabel.length * 8 + 24);
  const takeawayX = padding + pillWidth + 12;
  const headlineLines = fitSvgText(insight.headline, {
    fontFamily: theme.fonts.condensedFont,
    fontSize: theme.fontSize.subtitle,
    fontWeight: 600,
    maxLines: 2,
    maxWidth: maxTextWidth,
    mode: "wrap",
  }).lines;
  const actionLines = fitSvgText(insight.action, {
    fontFamily: theme.fonts.bodyFont,
    fontSize: theme.fontSize.label,
    maxLines: 2,
    maxWidth: maxTextWidth,
    mode: "wrap",
  }).lines;
  const headlineStartY = 58;
  const headlineLineH = theme.fontSize.subtitle + 4;
  const actionStartY = headlineStartY + headlineLines.length * headlineLineH + 8;
  const actionLineH = theme.fontSize.label + 4;
  const contentBottom = actionStartY + actionLines.length * actionLineH + 12;
  const cardHeight = Math.max(height, contentBottom);

  return React.createElement(
    "g",
    null,
    React.createElement("rect", {
      fill: `${accent}18`,
      height: cardHeight,
      rx: 10,
      stroke: `${accent}55`,
      strokeWidth: 1,
      width,
      x: 0,
      y: 0,
    }),
    React.createElement("rect", {
      fill: accent,
      height: cardHeight,
      rx: 2,
      width: 5,
      x: 0,
      y: 0,
    }),
    React.createElement("rect", {
      fill: `${accent}33`,
      height: 22,
      rx: 11,
      width: pillWidth,
      x: 16,
      y: 14,
    }),
    React.createElement(
      "text",
      {
        fill: accent,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.label,
        fontWeight: 700,
        x: 28,
        y: 30,
      },
      categoryLabel,
    ),
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.label,
        fontWeight: 600,
        x: takeawayX,
        y: 30,
      },
      "COACH TAKEAWAY",
    ),
    headlineLines.map((line, i) =>
      React.createElement(
        "text",
        {
          key: `headline-${i}`,
          fill: theme.ink,
          fontFamily: theme.fonts.condensedFont,
          fontSize: theme.fontSize.subtitle,
          fontWeight: 600,
          x: padding,
          y: headlineStartY + i * headlineLineH,
        },
        line,
      ),
    ),
    actionLines.map((line, i) =>
      React.createElement(
        "text",
        {
          key: `action-${i}`,
          fill: theme.inkMuted,
          fontFamily: theme.fonts.bodyFont,
          fontSize: theme.fontSize.label,
          x: padding,
          y: actionStartY + i * actionLineH,
        },
        line,
      ),
    ),
    hasViz && renderInsightMiniViz(insight.viz, theme, width, headlineStartY),
  );
}

function topPointZones(shots, player, limit = 4) {
  return computeZoneWinRatesByPoint(shots, player)
    .filter((zone) => zone.total >= 8)
    .sort((a, b) => b.winRate * Math.log(b.total) - a.winRate * Math.log(a.total))
    .slice(0, limit)
    .map((zone) => ({
      label: zone.zone.replace(/_/g, " "),
      total: zone.total,
      winRate: zone.winRate,
      won: zone.won,
    }));
}

function buildServeInsight(ctx) {
  const hostZones = computeServeZones(ctx.enrichedShots, "host")
    .filter((zone) => zone.inCount >= 3)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
  const top = hostZones[0];
  if (!top) return null;
  const firstServe = computeFirstServeInRate(ctx.enrichedShots, "host");
  return {
    action:
      (top.winRate ?? 0) >= 0.6
        ? `Keep targeting ${top.side} ${top.zone} under pressure.`
        : `Mix serve locations — ${top.side} ${top.zone} is underperforming.`,
    category: "serve",
    detail: `${formatPct(firstServe.rate)} first serves in (${firstServe.won}/${firstServe.total})`,
    headline: `${ctx.hostName}: ${formatPct(top.winRate)} win rate serving ${top.side} ${top.zone}`,
    id: "serve-slide-insight",
  };
}

function renderZonesSlide(ctx, theme, layout) {
  const barW = layout.content.width;
  const gap = SLIDE_BANDS.zoneColumnGap;
  const hostZones = topPointZones(ctx.enrichedShots, "host");
  const guestZones = topPointZones(ctx.enrichedShots, "guest");
  const maxRows = Math.max(hostZones.length, guestZones.length, 1);
  const rowH = Math.min(150, Math.max(88, Math.floor((layout.content.height - 72) / maxRows)));
  const blockH = 48 + maxRows * rowH;
  const columnW = (barW - gap) / 2;

  const [contentBand] = layoutBands(layout.content.height, [
    { id: "zones", grow: true },
  ]);

  function renderZoneColumn(zones, player, x, title) {
    return React.createElement(
      "g",
      { transform: `translate(${x}, 0)` },
      React.createElement(
        "text",
        {
          fill: getPlayerColor(player, theme),
          fontFamily: theme.fonts.condensedFont,
          fontSize: theme.fontSize.title,
          fontWeight: 700,
          x: 0,
          y: 28,
        },
        title,
      ),
      zones.map((entry, index) => {
        const winRate = Number.isFinite(entry.winRate) ? entry.winRate : 0;
        const pct = Math.round(winRate * 100);
        const trackW = columnW - 80;
        const barWidth = Math.max(10, trackW * winRate);
        const pctX = trackW + 10;
        return React.createElement(
          "g",
          { key: `${player}-${entry.label}`, transform: `translate(0, ${48 + index * rowH})` },
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.body,
              fontWeight: 600,
              x: 0,
              y: 20,
            },
            entry.label,
          ),
          React.createElement("rect", {
            fill: `${theme.inkMuted}33`,
            height: 22,
            rx: 11,
            width: trackW,
            x: 0,
            y: 30,
          }),
          React.createElement("rect", {
            fill: getPlayerColor(player, theme),
            height: 22,
            rx: 11,
            width: barWidth,
            x: 0,
            y: 30,
          }),
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 24,
              fontWeight: 700,
              x: pctX,
              y: 48,
            },
            `${pct}%`,
          ),
          React.createElement(
            "text",
            {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.label,
              x: trackW + 10,
              y: 48,
            },
            `${entry.won}/${entry.total} pts`,
          ),
        );
      }),
    );
  }

  return React.createElement(
    "g",
    { transform: `translate(0, ${contentBand.y})` },
    renderZoneColumn(hostZones, "host", 0, ctx.hostName),
    renderZoneColumn(guestZones, "guest", columnW + gap, ctx.guestName),
  );
}

function renderCoachCards(ctx, theme, layout, insights) {
  const cards = insights.slice(0, 3);
  const gap = SLIDE_BANDS.coachCardGap;
  const cardW = layout.content.width;
  const cardH = Math.min(
    SLIDE_BANDS.coachCardMaxH,
    Math.max(SLIDE_BANDS.coachCardMinH, Math.floor((layout.content.height - gap * (cards.length - 1)) / cards.length)),
  );

  const [cardsBand] = layoutBands(layout.content.height, [
    { id: "cards", grow: true },
  ]);

  return React.createElement(
    "g",
    { transform: `translate(0, ${cardsBand.y})` },
    cards.map((insight, index) => {
      const accent = insightAccent(theme, insight.category, index);
      const hero = extractHeroStat(insight.headline);
      const detail = insight.detail ?? "";
      return React.createElement(
        "g",
        { key: insight.id, transform: `translate(0, ${index * (cardH + gap)})` },
        React.createElement("rect", {
          fill: `${accent}14`,
          height: cardH,
          rx: 12,
          stroke: `${accent}44`,
          strokeWidth: 1,
          width: cardW,
          x: 0,
          y: 0,
        }),
        React.createElement("rect", {
          fill: accent,
          height: cardH,
          rx: 3,
          width: 6,
          x: 0,
          y: 0,
        }),
        React.createElement("rect", {
          fill: `${accent}28`,
          height: 26,
          rx: 13,
          width: Math.min(120, insight.category.length * 9 + 30),
          x: 18,
          y: 16,
        }),
        React.createElement(
          "text",
          {
            fill: accent,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.label,
            fontWeight: 700,
            x: 31,
            y: 34,
          },
          insight.category.toUpperCase(),
        ),
        React.createElement(
          "text",
          {
            fill: accent,
            fontFamily: theme.fonts.condensedFont,
            fontSize: 44,
            fontWeight: 700,
            textAnchor: "end",
            x: cardW - 20,
            y: 50,
          },
          hero,
        ),
        wrapSvgText({
          fill: theme.ink,
          fontFamily: theme.fonts.condensedFont,
          fontSize: theme.fontSize.title,
          fontWeight: 600,
          maxLines: 2,
          maxWidth: cardW - 140,
          text: insight.headline,
          x: 18,
          y: 78,
        }),
        detail &&
          wrapSvgText({
            fill: theme.inkMuted,
            fontFamily: theme.fonts.bodyFont,
            fontSize: theme.fontSize.body,
            maxLines: 2,
            maxWidth: cardW - 40,
            text: detail,
            x: 18,
            y: 130,
          }),
        wrapSvgText({
          fill: theme.ink,
          fontFamily: theme.fonts.bodyFont,
          fontSize: theme.fontSize.body,
          fontWeight: 600,
          maxLines: 2,
          maxWidth: cardW - 40,
          text: insight.action,
          x: 18,
          y: cardH - 44,
        }),
      );
    }),
  );
}

function buildKeyStats(ctx) {
  const {
    computeFirstServeInFromOfficial,
    computeBreakPointConversionFromOfficial,
    computePointsWonFromOfficial,
  } = require("@courtviz/data");

  const hostWin =
    computePointsWonFromOfficial(ctx.stats, "host") ??
    computePointsWonRate(ctx.momentumPoints, "host");
  const guestWin =
    computePointsWonFromOfficial(ctx.stats, "guest") ??
    computePointsWonRate(ctx.momentumPoints, "guest");
  const hostFS =
    computeFirstServeInFromOfficial(ctx.stats, "host") ??
    computeFirstServeInRate(ctx.enrichedShots, "host");
  const guestFS =
    computeFirstServeInFromOfficial(ctx.stats, "guest") ??
    computeFirstServeInRate(ctx.enrichedShots, "guest");
  const hostBP =
    computeBreakPointConversionFromOfficial(ctx.stats, "host") ??
    computeBreakPointConversion(ctx.enrichedShots, "host");
  const guestBP =
    computeBreakPointConversionFromOfficial(ctx.stats, "guest") ??
    computeBreakPointConversion(ctx.enrichedShots, "guest");
  const longRally = computeLongRallyWins(ctx);
  const longTotal = Math.max(longRally.hostWon + longRally.guestWon, 1);
  const hostLongRate = longRally.hostWon / longTotal;
  const guestLongRate = longRally.guestWon / longTotal;

  return [
    {
      guestShare: guestWin.rate ?? 0,
      guestValue: formatPct(guestWin.rate),
      hostShare: hostWin.rate ?? 0,
      hostValue: formatPct(hostWin.rate),
      title: "Points Won",
    },
    {
      guestShare: guestFS.rate ?? 0,
      guestValue: formatPct(guestFS.rate),
      hostShare: hostFS.rate ?? 0,
      hostValue: formatPct(hostFS.rate),
      title: "First Serve In",
    },
    {
      guestShare: guestLongRate,
      guestValue: `${Math.round(guestLongRate * 100)}%`,
      hostShare: hostLongRate,
      hostValue: `${Math.round(hostLongRate * 100)}%`,
      title: "Long Rallies Won (7+)",
    },
    {
      guestShare: guestBP.rate ?? 0,
      guestValue: formatPct(guestBP.rate),
      hostShare: hostBP.rate ?? 0,
      hostValue: formatPct(hostBP.rate),
      title: "Break Points Converted (Return)",
    },
  ];
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[index] ?? 0;
}

function officialValue(ctx, player, statName, setNumber = 0) {
  const { getOfficialStatValue } = require("@courtviz/data");
  return getOfficialStatValue(ctx.stats, player, statName, setNumber);
}

function buildBreakPointBattleStats(ctx) {
  return [
    {
      guestShare: officialValue(ctx, "guest", "Break Point Opportunities") ?? 0,
      guestValue: String(officialValue(ctx, "guest", "Break Point Opportunities") ?? "—"),
      hostShare: officialValue(ctx, "host", "Break Point Opportunities") ?? 0,
      hostValue: String(officialValue(ctx, "host", "Break Point Opportunities") ?? "—"),
      title: "Break Point Chances",
    },
    {
      guestShare: officialValue(ctx, "guest", "Break Points Won") ?? 0,
      guestValue: String(officialValue(ctx, "guest", "Break Points Won") ?? "—"),
      hostShare: officialValue(ctx, "host", "Break Points Won") ?? 0,
      hostValue: String(officialValue(ctx, "host", "Break Points Won") ?? "—"),
      title: "Break Points Converted",
    },
    {
      guestShare: officialValue(ctx, "guest", "Break Points Saved") ?? 0,
      guestValue: String(officialValue(ctx, "guest", "Break Points Saved") ?? "—"),
      hostShare: officialValue(ctx, "host", "Break Points Saved") ?? 0,
      hostValue: String(officialValue(ctx, "host", "Break Points Saved") ?? "—"),
      title: "Break Points Saved",
    },
  ];
}

function buildWinnersErrorStats(ctx) {
  function row(title, stat) {
    const host = officialValue(ctx, "host", stat) ?? 0;
    const guest = officialValue(ctx, "guest", stat) ?? 0;
    const total = Math.max(host + guest, 1);
    return {
      guestShare: guest / total,
      guestValue: String(guest),
      hostShare: host / total,
      hostValue: String(host),
      title,
    };
  }

  return [
    row("Forehand Winners", "Forehand Winners"),
    row("Backhand Winners", "Backhand Winners"),
    row("Forehand Unforced Errors", "Forehand Unforced Errors"),
    row("Backhand Unforced Errors", "Backhand Unforced Errors"),
  ];
}

function buildAcesStats(ctx) {
  const hostAces = officialValue(ctx, "host", "Aces") ?? 0;
  const guestAces = officialValue(ctx, "guest", "Aces") ?? 0;
  const hostDf = countDoubleFaults(ctx.enrichedShots, "host");
  const guestDf = countDoubleFaults(ctx.enrichedShots, "guest");

  return [
    {
      guestShare: guestAces,
      guestValue: String(guestAces),
      hostShare: hostAces,
      hostValue: String(hostAces),
      title: "Aces",
    },
    {
      guestShare: guestDf,
      guestValue: String(guestDf),
      hostShare: hostDf,
      hostValue: String(hostDf),
      title: "Double Faults (inferred)",
    },
  ];
}

function countDoubleFaults(shots, player) {
  const serves = shots.filter((s) => s.player === player && s.stroke === "Serve");
  const byPoint = new Map();
  for (const serve of serves) {
    const key = pointKeyFromShot(serve);
    const entry = byPoint.get(key) ?? { faults: 0, hasSecond: false };
    if (serve.type === "second_serve") entry.hasSecond = true;
    if (serve.result !== "In") entry.faults++;
    byPoint.set(key, entry);
  }
  let dfs = 0;
  for (const entry of byPoint.values()) {
    if (entry.hasSecond && entry.faults >= 2) dfs++;
  }
  return dfs;
}

function buildServeSpeedStats(ctx) {
  function speeds(player) {
    return ctx.enrichedShots
      .filter((s) => s.player === player && s.stroke === "Serve" && s.speedKmh != null)
      .map((s) => s.speedKmh);
  }

  const hostSpeeds = speeds("host");
  const guestSpeeds = speeds("guest");

  return [
    {
      guestShare: percentile(guestSpeeds, 0.5),
      guestValue: guestSpeeds.length ? `${Math.round(percentile(guestSpeeds, 0.5))} km/h` : "—",
      hostShare: percentile(hostSpeeds, 0.5),
      hostValue: hostSpeeds.length ? `${Math.round(percentile(hostSpeeds, 0.5))} km/h` : "—",
      title: "Serve Speed P50",
    },
    {
      guestShare: percentile(guestSpeeds, 0.9),
      guestValue: guestSpeeds.length ? `${Math.round(percentile(guestSpeeds, 0.9))} km/h` : "—",
      hostShare: percentile(hostSpeeds, 0.9),
      hostValue: hostSpeeds.length ? `${Math.round(percentile(hostSpeeds, 0.9))} km/h` : "—",
      title: "Serve Speed P90",
    },
    {
      guestShare: guestSpeeds.length ? Math.max(...guestSpeeds) : 0,
      guestValue: guestSpeeds.length ? `${Math.round(Math.max(...guestSpeeds))} km/h` : "—",
      hostShare: hostSpeeds.length ? Math.max(...hostSpeeds) : 0,
      hostValue: hostSpeeds.length ? `${Math.round(Math.max(...hostSpeeds))} km/h` : "—",
      title: "Max Serve Speed",
    },
  ];
}

function buildSetBySetStats(ctx) {
  return ctx.sets.map((set, index) => {
    const setNumber = set.setNumber ?? index + 1;
    const hostPts = officialValue(ctx, "host", "Total Points Won", setNumber) ?? set.hostScore;
    const guestPts = officialValue(ctx, "guest", "Total Points Won", setNumber) ?? set.guestScore;
    const total = Math.max(hostPts + guestPts, 1);
    return {
      guestShare: guestPts / total,
      guestValue: `${set.guestScore}`,
      hostShare: hostPts / total,
      hostValue: `${set.hostScore}`,
      title: `Set ${index + 1}`,
    };
  });
}

function buildRallyHighlightStats(ctx) {
  let longest = 0;
  let totalShots = 0;
  let pointCount = 0;

  for (const point of ctx.points) {
    const key = `${point.setNumber}-${point.gameNumber}-${point.pointNumber}`;
    const pointShots = ctx.enrichedShots.filter((s) => pointKeyFromShot(s) === key);
    const rallyLen = Math.max(...pointShots.map((s) => s.shotNumber ?? 0), 0);
    longest = Math.max(longest, rallyLen);
    if (rallyLen > 0) {
      totalShots += rallyLen;
      pointCount++;
    }
  }

  const avg = pointCount > 0 ? totalShots / pointCount : 0;
  return [
    {
      guestShare: 0.5,
      guestValue: `${longest} shots`,
      hostShare: 0.5,
      hostValue: `${longest} shots`,
      title: "Longest Rally",
    },
    {
      guestShare: 0.5,
      guestValue: avg.toFixed(1),
      hostShare: 0.5,
      hostValue: avg.toFixed(1),
      title: "Avg Rally Length",
    },
  ];
}

function buildReturnGameStats(ctx) {
  function returnRate(player) {
    const returns = officialValue(ctx, player, "1st Returns") ?? 0;
    const won = officialValue(ctx, player, "1st Returns Won") ?? 0;
    const returns2 = officialValue(ctx, player, "2nd Returns") ?? 0;
    const won2 = officialValue(ctx, player, "2nd Returns Won") ?? 0;
    const total = returns + returns2;
    const totalWon = won + won2;
    return total > 0 ? { rate: totalWon / total, total, won: totalWon } : null;
  }

  const host = returnRate("host");
  const guest = returnRate("guest");
  const hostDepth = returnDepthShare(ctx.enrichedShots, "host");
  const guestDepth = returnDepthShare(ctx.enrichedShots, "guest");

  return [
    {
      guestShare: guest?.rate ?? 0,
      guestValue: guest ? formatPct(guest.rate) : "—",
      hostShare: host?.rate ?? 0,
      hostValue: host ? formatPct(host.rate) : "—",
      title: "Return Points Won",
    },
    {
      guestShare: guestDepth.deep,
      guestValue: `${Math.round(guestDepth.deep * 100)}% deep`,
      hostShare: hostDepth.deep,
      hostValue: `${Math.round(hostDepth.deep * 100)}% deep`,
      title: "Deep Returns",
    },
  ];
}

function returnDepthShare(shots, player) {
  const returns = shots.filter(
    (s) => s.player === player && s.stroke !== "Serve" && s.bounceDepth && s.bounceDepth !== "out",
  );
  if (!returns.length) return { deep: 0, short: 0 };
  const deep = returns.filter((s) => s.bounceDepth === "deep").length;
  return { deep: deep / returns.length, short: 1 - deep / returns.length };
}

function buildSpinDirectionStats(ctx) {
  function spinRates(player) {
    const groups = new Map();
    for (const shot of ctx.enrichedShots) {
      if (shot.player !== player || shot.stroke === "Serve" || !shot.spin) continue;
      const key = shot.spin;
      const entry = groups.get(key) ?? { total: 0, won: 0 };
      entry.total++;
      if (shotPlayerWonPoint(shot)) entry.won++;
      groups.set(key, entry);
    }
    return [...groups.entries()]
      .map(([spin, data]) => ({ spin, winRate: data.total ? data.won / data.total : 0 }))
      .sort((a, b) => b.winRate - a.winRate)[0];
  }

  function directionRates(player) {
    const groups = new Map();
    for (const shot of ctx.enrichedShots) {
      if (shot.player !== player || !shot.direction) continue;
      const key = shot.direction;
      const entry = groups.get(key) ?? { total: 0, won: 0 };
      entry.total++;
      if (shotPlayerWonPoint(shot)) entry.won++;
      groups.set(key, entry);
    }
    return [...groups.entries()]
      .map(([direction, data]) => ({ direction, winRate: data.total ? data.won / data.total : 0 }))
      .sort((a, b) => b.winRate - a.winRate)[0];
  }

  const hostSpin = spinRates("host");
  const guestSpin = spinRates("guest");
  const hostDir = directionRates("host");
  const guestDir = directionRates("guest");

  return [
    {
      guestShare: guestSpin?.winRate ?? 0,
      guestValue: guestSpin ? `${guestSpin.spin} ${formatPct(guestSpin.winRate)}` : "—",
      hostShare: hostSpin?.winRate ?? 0,
      hostValue: hostSpin ? `${hostSpin.spin} ${formatPct(hostSpin.winRate)}` : "—",
      title: "Best Spin Win Rate",
    },
    {
      guestShare: guestDir?.winRate ?? 0,
      guestValue: guestDir ? `${guestDir.direction} ${formatPct(guestDir.winRate)}` : "—",
      hostShare: hostDir?.winRate ?? 0,
      hostValue: hostDir ? `${hostDir.direction} ${formatPct(hostDir.winRate)}` : "—",
      title: "Best Direction Win Rate",
    },
  ];
}

function buildClutchStats(ctx) {
  function clutchRate(label, filter) {
    const clutchPoints = ctx.points.filter(filter);
    let hostWon = 0;
    let guestWon = 0;
    for (const point of clutchPoints) {
      if (point.pointWinner === "host") hostWon++;
      else if (point.pointWinner === "guest") guestWon++;
    }
    if (hostWon + guestWon === 0) return null;
    const total = hostWon + guestWon;
    return {
      guestShare: guestWon / total,
      guestValue: `${Math.round((guestWon / total) * 100)}%`,
      hostShare: hostWon / total,
      hostValue: `${Math.round((hostWon / total) * 100)}%`,
      title: label,
    };
  }

  return [
    clutchRate("Deuce Points Won", (point) => point.deuce),
    clutchRate("Set Points Won", (point) => point.setPoint),
  ].filter(Boolean);
}

function sectionHeader(title) {
  return { section: true, title };
}

function buildMatchNumbersStats(ctx) {
  return [
    sectionHeader("Match Overview"),
    ...buildKeyStats(ctx),
    sectionHeader("Break Points"),
    ...buildBreakPointBattleStats(ctx),
    sectionHeader("Clutch"),
    ...buildClutchStats(ctx),
    sectionHeader("Set by Set"),
    ...buildSetBySetStats(ctx),
  ];
}

function buildShotmakingStats(ctx) {
  const returnRows = buildReturnGameStats(ctx).filter(
    (row) => row.hostShare > 0 || row.guestShare > 0,
  );
  return [
    sectionHeader("Shot Quality"),
    ...buildWinnersErrorStats(ctx),
    sectionHeader("Return Game"),
    ...returnRows,
  ];
}

function renderMomentumSlide(ctx, theme, layout) {
  const footerH = SLIDE_BANDS.momentumFooterH;
  const chartW = layout.content.width;
  const chartH = Math.min(layout.content.height - footerH - 16, Math.floor(chartW * 1.1));
  const hostWin = computePointsWonRate(ctx.momentumPoints, "host");
  const guestWin = computePointsWonRate(ctx.momentumPoints, "guest");
  const bpCount = ctx.points.filter((point) => point.breakPoint).length;
  const points = ctx.momentumPoints.map((point) => ({
    gameNumber: point.gameNumber,
    isBreakPoint: Boolean(point.isBreakPoint ?? point.breakPoint),
    isMatchPoint: Boolean(point.isMatchPoint ?? point.matchPoint),
    isSetPoint: Boolean(point.isSetPoint ?? point.setPoint),
    pointWinner: point.pointWinner,
    setNumber: point.setNumber,
  }));

  const [chartBand, footerBand] = layoutBands(layout.content.height, [
    { id: "chart", height: chartH },
    { id: "footer", height: footerH },
  ]);

  return React.createElement(
    "g",
    { transform: `translate(0, ${chartBand.y})` },
    React.createElement(MomentumChart, {
      height: chartH,
      hostPlayer: "host",
      points,
      showBreakPoints: true,
      showSetBoundaries: true,
      theme,
      width: chartW,
    }),
    React.createElement(
      "g",
      { transform: `translate(0, ${chartH + 24})` },
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("host", theme),
        label: `${ctx.hostName.split(" ").pop()} points won`,
        theme,
        value: formatPct(hostWin.rate),
        x: 0,
        y: 0,
      }),
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("guest", theme),
        label: `${ctx.guestName.split(" ").pop()} points won`,
        theme,
        value: formatPct(guestWin.rate),
        x: chartW / 3,
        y: 0,
      }),
      React.createElement(StatCallout, {
        label: "break points played",
        theme,
        value: String(bpCount),
        x: (chartW / 3) * 2,
        y: 0,
      }),
    ),
  );
}

function buildErrorHeatmapStats(ctx) {
  const errors = errorShots(ctx.enrichedShots);
  const hostErrors = errors.filter((s) => s.player === "host").length;
  const guestErrors = errors.filter((s) => s.player === "guest").length;
  const total = Math.max(hostErrors + guestErrors, 1);

  return [
    {
      guestShare: guestErrors / total,
      guestValue: String(guestErrors),
      hostShare: hostErrors / total,
      hostValue: String(hostErrors),
      title: "Errors with Location (Out/Net/UE)",
    },
  ];
}

function errorShots(shots) {
  return shots.filter(
    (s) =>
      s.bounceX != null &&
      s.bounceY != null &&
      (s.result === "Out" || s.result === "Net" || s.endedBy === "unforced_error"),
  );
}

function renderDensitySlide(ctx, theme, layout) {
  const gap = SLIDE_BANDS.densityGap;
  const labelH = SLIDE_BANDS.densityLabelH;
  const chipH = 32;
  const courtW = Math.floor((layout.content.width - gap) / 2);
  const courtH = Math.min(Math.floor(layout.content.height - labelH - chipH - 16), Math.floor(courtW * 1.07));
  const half = "near";

  const [densityBand] = layoutBands(layout.content.height, [
    { id: "density", grow: true },
  ]);

  const groundstrokeShots = ctx.enrichedShots.filter(
    (s) => s.stroke !== "Serve" && s.stroke !== "Volley" && s.stroke !== "Overhead",
  );

  function renderPlayerDensity(player, x, name) {
    const scales = createCourtScales({ half, height: courtH, margin: 1.5, width: courtW });
    const playerColor = getPlayerColor(player, theme);
    const zoneWinRates = computeZoneWinRates(groundstrokeShots, player);
    const deuceRate = zoneWinRates.find((z) => z.zone === "deuce");
    const adRate = zoneWinRates.find((z) => z.zone === "ad");

    return React.createElement(
      "g",
      { key: player, transform: `translate(${x}, 0)` },
      React.createElement("text", {
        fill: playerColor,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.title,
        fontWeight: 700,
        textAnchor: "middle",
        x: courtW / 2,
        y: 28,
      }, name),
      React.createElement(
        "g",
        { transform: `translate(0, ${labelH})` },
        React.createElement(
          CourtSurface,
          { half, height: courtH, idPrefix: `slide-density-${player}`, surface: BRAND_SURFACE, theme, width: courtW },
          React.createElement(DensityLayer, {
            alpha: 0.45,
            bandwidth: 1.2,
            half,
            highColor: playerColor,
            lowColor: `${theme.inkMuted}44`,
            player,
            scales,
            shots: groundstrokeShots,
            showOutlines: false,
            theme,
            thresholds: 5,
          }),
        ),
      ),
      React.createElement(
        "g",
        { transform: `translate(0, ${labelH + courtH + 12})` },
        deuceRate
          ? React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.label,
              fontWeight: 500,
              textAnchor: "middle",
              x: courtW * 0.25,
              y: 16,
            }, `Deuce ${formatPct(deuceRate.winRate)}`)
          : null,
        adRate
          ? React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.label,
              fontWeight: 500,
              textAnchor: "middle",
              x: courtW * 0.75,
              y: 16,
            }, `Ad ${formatPct(adRate.winRate)}`)
          : null,
      ),
    );
  }

  return React.createElement(
    "g",
    { transform: `translate(0, ${densityBand.y})` },
    renderPlayerDensity("host", 0, ctx.hostName),
    renderPlayerDensity("guest", courtW + gap, ctx.guestName),
  );
}

function renderErrorHeatmapSlide(ctx, theme, layout) {
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 200,
    courtAspect: 0.85,
    insightBand: 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY } = posterLayout;
  const half = "full";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const allErrors = errorShots(ctx.enrichedShots);
  const outErrors = allErrors.filter((s) => s.result === "Out" || s.endedBy === "unforced_error");
  const netErrors = allErrors.filter((s) => s.result === "Net");
  const hostOut = outErrors.filter((s) => s.player === "host").length;
  const guestOut = outErrors.filter((s) => s.player === "guest").length;
  const hostNet = netErrors.filter((s) => s.player === "host").length;
  const guestNet = netErrors.filter((s) => s.player === "guest").length;
  const hostLast = ctx.hostName.split(" ").pop();
  const guestLast = ctx.guestName.split(" ").pop();
  const colW = courtWidth / 2;

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-errors", surface: BRAND_SURFACE, theme, width: courtWidth },
      React.createElement(DotLayer, {
        alpha: 0.8,
        colorBy: "player",
        highContrast: true,
        player: "host",
        scales,
        shots: outErrors,
        size: 6,
        theme,
      }),
      React.createElement(DotLayer, {
        alpha: 0.8,
        colorBy: "player",
        highContrast: true,
        player: "guest",
        scales,
        shots: outErrors,
        size: 6,
        theme,
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${analyticsY - courtY})` },
      React.createElement("text", {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: theme.fontSize.label,
        fontWeight: 600,
        x: 0,
        y: -8,
      }, "OUT ERRORS (plotted above)"),
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("host", theme),
        label: `${hostLast} out`,
        theme,
        value: String(hostOut),
        x: 0,
        y: 8,
      }),
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("guest", theme),
        label: `${guestLast} out`,
        theme,
        value: String(guestOut),
        x: colW,
        y: 8,
      }),
      React.createElement("text", {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: theme.fontSize.label,
        fontWeight: 600,
        x: 0,
        y: 80,
      }, "NET ERRORS BY STROKE"),
      (() => {
        const strokes = ["Forehand", "Backhand", "Volley"];
        const hostColor = getPlayerColor("host", theme);
        const guestColor = getPlayerColor("guest", theme);
        const maxNet = Math.max(
          ...strokes.map((st) =>
            netErrors.filter((s) => s.player === "host" && s.stroke === st).length +
            netErrors.filter((s) => s.player === "guest" && s.stroke === st).length,
          ),
          1,
        );
        const barH = 16;
        const barGap = 8;
        const trackW = colW - 60;
        return strokes.map((st, i) => {
          const hostCount = netErrors.filter((s) => s.player === "host" && s.stroke === st).length;
          const guestCount = netErrors.filter((s) => s.player === "guest" && s.stroke === st).length;
          const y = 96 + i * (barH + barGap);
          return React.createElement(
            "g",
            { key: st },
            React.createElement("text", {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: 10,
              x: 0,
              y: y + 12,
            }, st[0] + st.slice(1).toLowerCase()),
            React.createElement("rect", {
              fill: hostColor,
              height: barH / 2 - 1,
              width: Math.max(2, (hostCount / maxNet) * trackW),
              x: 50,
              y: y,
            }),
            React.createElement("rect", {
              fill: guestColor,
              height: barH / 2 - 1,
              width: Math.max(2, (guestCount / maxNet) * trackW),
              x: 50,
              y: y + barH / 2 + 1,
            }),
            React.createElement("text", {
              fill: theme.ink,
              fontFamily: theme.fonts.bodyFont,
              fontSize: 10,
              fontWeight: 600,
              x: 50 + trackW + 6,
              y: y + 12,
            }, `H: ${hostCount} · G: ${guestCount}`),
          );
        });
      })(),
    ),
  );
}

function renderServePlacementSlide(ctx, theme, layout) {
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 200,
    courtAspect: 1,
    insightBand: 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY } = posterLayout;
  const half = "near";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const hostZones = computeServeZones(ctx.enrichedShots, "host");
  const hostColor = getPlayerColor("host", theme);
  const heatGridH = analyticsY - courtY - courtHeight - 16;

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      "text",
      {
        fill: hostColor,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.label,
        fontWeight: 700,
        x: 0,
        y: -4,
      },
      `${ctx.hostName.split(" ").pop()} serves`,
    ),
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-placement", surface: BRAND_SURFACE, theme, width: courtWidth },
      React.createElement(ServeLayer, {
        haloWidth: 1.5,
        highContrast: true,
        includeFaults: false,
        player: "host",
        scales,
        serveType: "first",
        shapeEncode: false,
        shots: ctx.enrichedShots,
        size: 7,
        theme,
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${analyticsY - courtY})` },
      React.createElement("text", {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: theme.fontSize.label,
        fontWeight: 600,
        letterSpacing: 1,
        x: 0,
        y: 0,
      }, "SERVICE BOX HEAT — IN-RATE %"),
      React.createElement(
        "g",
        { transform: `translate(0, 12)` },
        renderServeZoneHeatGrid(hostZones, theme, courtWidth, Math.max(120, heatGridH), hostColor),
      ),
    ),
  );
}

function renderGenericDuelSlide(ctx, theme, layout, stats) {
  return renderDuelStats(ctx, theme, layout, stats);
}

function buildKeyStatsSlideStats(ctx) {
  const {
    computeBreakPointConversionFromOfficial,
    computeFirstServeInFromOfficial,
    computePointsWonFromOfficial,
  } = require("@courtviz/data");

  const hostWin = computePointsWonFromOfficial(ctx.stats, "host") ?? computePointsWonRate(ctx.momentumPoints, "host");
  const guestWin = computePointsWonFromOfficial(ctx.stats, "guest") ?? computePointsWonRate(ctx.momentumPoints, "guest");
  const hostFS = computeFirstServeInFromOfficial(ctx.stats, "host") ?? computeFirstServeInRate(ctx.enrichedShots, "host");
  const guestFS = computeFirstServeInFromOfficial(ctx.stats, "guest") ?? computeFirstServeInRate(ctx.enrichedShots, "guest");
  const host1stWon = officialValue(ctx, "host", "1st Serve Points Won") ?? 0;
  const guest1stWon = officialValue(ctx, "guest", "1st Serve Points Won") ?? 0;
  const host2ndIn = officialValue(ctx, "host", "2nd Serves In") ?? 0;
  const guest2ndIn = officialValue(ctx, "guest", "2nd Serves In") ?? 0;
  const hostRetWon = officialValue(ctx, "host", "Return Points Won") ?? 0;
  const guestRetWon = officialValue(ctx, "guest", "Return Points Won") ?? 0;
  const hostBP = computeBreakPointConversionFromOfficial(ctx.stats, "host") ?? computeBreakPointConversion(ctx.enrichedShots, "host");
  const guestBP = computeBreakPointConversionFromOfficial(ctx.stats, "guest") ?? computeBreakPointConversion(ctx.enrichedShots, "guest");

  const stats = [
    {
      guestShare: guestWin.rate ?? 0,
      guestValue: formatPct(guestWin.rate),
      hostShare: hostWin.rate ?? 0,
      hostValue: formatPct(hostWin.rate),
      title: "Points Won",
    },
    {
      guestShare: guestFS.rate ?? 0,
      guestValue: formatPct(guestFS.rate),
      hostShare: hostFS.rate ?? 0,
      hostValue: formatPct(hostFS.rate),
      title: "1st Serve In",
    },
    {
      guestShare: guest1stWon,
      guestValue: String(guest1stWon),
      hostShare: host1stWon,
      hostValue: String(host1stWon),
      title: "1st Serve Points Won",
    },
    {
      guestShare: guest2ndIn,
      guestValue: String(guest2ndIn),
      hostShare: host2ndIn,
      hostValue: String(host2ndIn),
      title: "2nd Serves In",
    },
    {
      guestShare: guestRetWon,
      guestValue: String(guestRetWon),
      hostShare: hostRetWon,
      hostValue: String(hostRetWon),
      title: "Return Points Won",
    },
    {
      guestShare: guestBP.rate ?? 0,
      guestValue: formatPct(guestBP.rate),
      hostShare: hostBP.rate ?? 0,
      hostValue: formatPct(hostBP.rate),
      title: "Break Points Converted",
    },
  ];

  return stats.slice(0, 6);
}

function renderRingGauge(cx, cy, radius, rate, color, label, value, theme) {
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * rate;
  return React.createElement(
    "g",
    null,
    React.createElement("circle", {
      cx,
      cy,
      fill: "none",
      r: radius,
      stroke: `${theme.inkMuted}22`,
      strokeWidth: 6,
    }),
    React.createElement("circle", {
      cx,
      cy,
      fill: "none",
      r: radius,
      stroke: color,
      strokeDasharray: `${arcLength} ${circumference}`,
      strokeLinecap: "round",
      strokeWidth: 6,
      transform: `rotate(-90 ${cx} ${cy})`,
    }),
    React.createElement("text", {
      fill: theme.ink,
      fontFamily: theme.fonts.condensedFont,
      fontSize: 20,
      fontWeight: 700,
      textAnchor: "middle",
      x: cx,
      y: cy + 4,
    }, value),
    React.createElement("text", {
      fill: theme.inkMuted,
      fontFamily: theme.fonts.bodyFont,
      fontSize: 10,
      fontWeight: 500,
      textAnchor: "middle",
      x: cx,
      y: cy + radius + 18,
    }, label),
  );
}

function renderKeyStatsSlide(ctx, theme, layout) {
  const {
    computeBreakPointConversionFromOfficial,
    computeFirstServeInFromOfficial,
    computePointsWonFromOfficial,
  } = require("@courtviz/data");

  const hostWin = computePointsWonFromOfficial(ctx.stats, "host") ?? computePointsWonRate(ctx.momentumPoints, "host");
  const guestWin = computePointsWonFromOfficial(ctx.stats, "guest") ?? computePointsWonRate(ctx.momentumPoints, "guest");
  const hostFS = computeFirstServeInFromOfficial(ctx.stats, "host") ?? computeFirstServeInRate(ctx.enrichedShots, "host");
  const guestFS = computeFirstServeInFromOfficial(ctx.stats, "guest") ?? computeFirstServeInRate(ctx.enrichedShots, "guest");
  const host1stWon = officialValue(ctx, "host", "1st Serve Points Won") ?? 0;
  const guest1stWon = officialValue(ctx, "guest", "1st Serve Points Won") ?? 0;
  const hostRetWon = officialValue(ctx, "host", "Return Points Won") ?? 0;
  const guestRetWon = officialValue(ctx, "guest", "Return Points Won") ?? 0;
  const hostBP = computeBreakPointConversionFromOfficial(ctx.stats, "host") ?? computeBreakPointConversion(ctx.enrichedShots, "host");
  const guestBP = computeBreakPointConversionFromOfficial(ctx.stats, "guest") ?? computeBreakPointConversion(ctx.enrichedShots, "guest");

  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);

  const [ringsBand, chipsBand, barsBand] = layoutBands(contentH, [
    { id: "rings", height: 140 },
    { id: "chips", height: 36 },
    { id: "bars", grow: true, minHeight: 120 },
  ], 12);

  const ringR = 42;
  const ringCx1 = contentW * 0.28;
  const ringCx2 = contentW * 0.72;
  const ringCy = ringsBand.y + ringR + 8;

  const barStats = [
    { guestShare: guestFS.rate ?? 0, guestValue: formatPct(guestFS.rate), hostShare: hostFS.rate ?? 0, hostValue: formatPct(hostFS.rate), title: "1st Serve In" },
    { guestShare: guest1stWon, guestValue: String(guest1stWon), hostShare: host1stWon, hostValue: String(host1stWon), title: "1st Serve Points Won" },
    { guestShare: guestRetWon, guestValue: String(guestRetWon), hostShare: hostRetWon, hostValue: String(hostRetWon), title: "Return Points Won" },
    { guestShare: guestBP.rate ?? 0, guestValue: formatPct(guestBP.rate), hostShare: hostBP.rate ?? 0, hostValue: formatPct(hostBP.rate), title: "Break Points Converted" },
  ];

  const barH = Math.max(24, Math.min(40, Math.floor((barsBand.height - barStats.length * 12) / barStats.length)));
  const barW = contentW - 40;
  const barTitleH = 20;
  const barStride = barTitleH + barH + 12;

  return React.createElement(
    "g",
    null,
    React.createElement("text", {
      fill: theme.inkMuted,
      fontFamily: theme.fonts.bodyFont,
      fontSize: theme.fontSize.label,
      fontWeight: 600,
      letterSpacing: 1,
      textAnchor: "middle",
      x: contentW / 2,
      y: ringsBand.y,
    }, "POINTS WON"),
    renderRingGauge(ringCx1, ringCy, ringR, hostWin.rate ?? 0, hostColor, ctx.hostName.split(" ").pop(), formatPct(hostWin.rate), theme),
    renderRingGauge(ringCx2, ringCy, ringR, guestWin.rate ?? 0, guestColor, ctx.guestName.split(" ").pop(), formatPct(guestWin.rate), theme),
    React.createElement(
      "g",
      { transform: `translate(${contentW / 2}, ${chipsBand.y})` },
      ctx.sets.map((set, i) =>
        React.createElement(
          "g",
          { key: i, transform: `translate(${(i - (ctx.sets.length - 1) / 2) * 64}, 0)` },
          React.createElement("rect", {
            fill: `${theme.inkMuted}18`,
            height: 24,
            rx: 12,
            width: 52,
            x: -26,
            y: 0,
          }),
          React.createElement("text", {
            fill: theme.ink,
            fontFamily: theme.fonts.bodyFont,
            fontSize: theme.fontSize.body,
            fontWeight: 600,
            textAnchor: "middle",
            x: 0,
            y: 17,
          }, `${set.hostGames ?? "-"}-${set.guestGames ?? "-"}`),
        ),
      ),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${barsBand.y})` },
      barStats.map((stat, i) => {
        const total = Math.max((stat.hostShare ?? 0) + (stat.guestShare ?? 0), 0.001);
        const hostPct = (stat.hostShare ?? 0) / total;
        const guestPct = 1 - hostPct;
        const y = i * barStride;
        const barY = barTitleH;
        const valueY = barY + barH * 0.75;
        return React.createElement(
          "g",
          { key: stat.title, transform: `translate(0, ${y})` },
          React.createElement("text", {
            fill: theme.inkMuted,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.label,
            fontWeight: 600,
            textAnchor: "middle",
            x: barW / 2,
            y: 14,
          }, stat.title.toUpperCase()),
          React.createElement("text", {
            fill: hostColor,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.subtitle,
            fontWeight: 700,
            textAnchor: "end",
            x: barW / 2 - 8,
            y: valueY,
          }, stat.hostValue),
          React.createElement("text", {
            fill: guestColor,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.subtitle,
            fontWeight: 700,
            textAnchor: "start",
            x: barW / 2 + 8,
            y: valueY,
          }, stat.guestValue),
          React.createElement("rect", {
            fill: hostColor,
            height: barH,
            rx: 2,
            width: Math.max(4, (barW / 2) * hostPct),
            x: barW / 2 - Math.max(4, (barW / 2) * hostPct),
            y: barY,
          }),
          React.createElement("rect", {
            fill: guestColor,
            height: barH,
            rx: 2,
            width: Math.max(4, (barW / 2) * guestPct),
            x: barW / 2,
            y: barY,
          }),
        );
      }),
    ),
  );
}

function renderMomentumClutchSlide(ctx, theme, layout) {
  const footerH = SLIDE_BANDS.momentumFooterH;
  const chartW = layout.content.width;
  const clutchStats = buildClutchStats(ctx);
  const clutchH = 120;
  const calloutH = 80;
  const chartH = Math.min(
    Math.floor(layout.content.height - footerH - clutchH - calloutH - 32),
    Math.floor(chartW * 0.85),
  );
  const hostWin = computePointsWonRate(ctx.momentumPoints, "host");
  const guestWin = computePointsWonRate(ctx.momentumPoints, "guest");
  const bpCount = ctx.points.filter((point) => point.breakPoint).length;
  const points = ctx.momentumPoints.map((point) => ({
    gameNumber: point.gameNumber,
    isBreakPoint: Boolean(point.isBreakPoint ?? point.breakPoint),
    isMatchPoint: Boolean(point.isMatchPoint ?? point.matchPoint),
    isSetPoint: Boolean(point.isSetPoint ?? point.setPoint),
    pointWinner: point.pointWinner,
    setNumber: point.setNumber,
  }));

  const [chartBand, calloutBand, clutchBand, footerBand] = layoutBands(layout.content.height, [
    { id: "chart", height: chartH },
    { id: "callout", height: calloutH },
    { id: "clutch", height: clutchH + 16 },
    { id: "footer", height: footerH },
  ]);

  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);
  const clutchR = 32;
  const clutchSpacing = chartW / Math.max(clutchStats.length, 1);

  return React.createElement(
    "g",
    { transform: `translate(0, ${chartBand.y})` },
    React.createElement(MomentumChart, {
      height: chartH,
      hostPlayer: "host",
      points,
      showBreakPoints: true,
      showSetBoundaries: true,
      theme,
      width: chartW,
    }),
    React.createElement(
      "g",
      { transform: `translate(0, ${calloutBand.y - chartBand.y})` },
      React.createElement(StatCallout, {
        accentColor: hostColor,
        label: `${ctx.hostName.split(" ").pop()} points won`,
        theme,
        value: formatPct(hostWin.rate),
        x: 0,
        y: 0,
      }),
      React.createElement(StatCallout, {
        accentColor: guestColor,
        label: `${ctx.guestName.split(" ").pop()} points won`,
        theme,
        value: formatPct(guestWin.rate),
        x: chartW / 3,
        y: 0,
      }),
      React.createElement(StatCallout, {
        label: "break points played",
        theme,
        value: String(bpCount),
        x: (chartW / 3) * 2,
        y: 0,
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${clutchBand.y - chartBand.y})` },
      clutchStats.map((stat, index) => {
        const cx = clutchSpacing * index + clutchSpacing / 2;
        const cy = clutchR + 16;
        const rate = parseFloat(stat.hostValue) / 100 || 0;
        return React.createElement(
          "g",
          { key: stat.title },
          renderRingGauge(cx, cy, clutchR, rate, hostColor, stat.title, stat.hostValue, theme),
        );
      }),
    ),
  );
}

function buildServePowerStats(ctx) {
  const {
    computeFirstStrikeStats,
    computeReturnInPlayRate,
    computeServePlusOneStats,
  } = require("@courtviz/core");

  const hostFS = computeFirstStrikeStats(ctx.enrichedShots, "host");
  const guestFS = computeFirstStrikeStats(ctx.enrichedShots, "guest");
  const hostRIP = computeReturnInPlayRate(ctx.enrichedShots, "host");
  const guestRIP = computeReturnInPlayRate(ctx.enrichedShots, "guest");
  const hostS1 = computeServePlusOneStats(ctx.enrichedShots, "host");
  const guestS1 = computeServePlusOneStats(ctx.enrichedShots, "guest");

  const servePlusOneRows = [];
  const allStrokes = new Set([...hostS1.map((s) => s.stroke), ...guestS1.map((s) => s.stroke)]);
  for (const stroke of allStrokes) {
    const hostStat = hostS1.find((s) => s.stroke === stroke);
    const guestStat = guestS1.find((s) => s.stroke === stroke);
    if (!hostStat && !guestStat) continue;
    const hostTotal = hostStat?.total ?? 0;
    const guestTotal = guestStat?.total ?? 0;
    if (hostTotal < 3 && guestTotal < 3) continue;
    servePlusOneRows.push({
      guestShare: guestStat?.winRate ?? 0,
      guestValue: guestStat ? `${formatPct(guestStat.winRate)} (${guestStat.won}/${guestStat.total})` : "—",
      hostShare: hostStat?.winRate ?? 0,
      hostValue: hostStat ? `${formatPct(hostStat.winRate)} (${hostStat.won}/${hostStat.total})` : "—",
      title: `Serve+1 ${stroke}`,
    });
  }

  return [
    sectionHeader("Serve Speed"),
    ...buildServeSpeedStats(ctx),
    sectionHeader("First Strike (≤4 shots)"),
    {
      guestShare: guestFS.rate ?? 0,
      guestValue: `${formatPct(guestFS.rate)} (${guestFS.won}/${guestFS.total})`,
      hostShare: hostFS.rate ?? 0,
      hostValue: `${formatPct(hostFS.rate)} (${hostFS.won}/${hostFS.total})`,
      title: "First-Strike Win Rate",
    },
    ...(servePlusOneRows.length > 0
      ? [sectionHeader("Serve + 1"), ...servePlusOneRows.slice(0, 3)]
      : []),
    sectionHeader("Return In-Play"),
    {
      guestShare: guestRIP.rate ?? 0,
      guestValue: `${formatPct(guestRIP.rate)} (${guestRIP.won}/${guestRIP.total})`,
      hostShare: hostRIP.rate ?? 0,
      hostValue: `${formatPct(hostRIP.rate)} (${hostRIP.won}/${hostRIP.total})`,
      title: "Return In-Play Rate",
    },
  ];
}

function renderServePowerSlide(ctx, theme, layout) {
  return renderDuelStats(ctx, theme, layout, buildServePowerStats(ctx));
}

function renderCoachCtaSlide(ctx, theme, layout, insights, branding) {
  const cards = insights.slice(0, 2);
  const gap = SLIDE_BANDS.coachCardGap;
  const cardW = layout.content.width;
  const ctaH = 200;
  const availableH = layout.content.height - ctaH - gap;
  const cardH = Math.min(
    SLIDE_BANDS.coachCardMaxH,
    Math.max(SLIDE_BANDS.coachCardMinH, Math.floor((availableH - gap * (cards.length - 1)) / cards.length)),
  );
  const cardsBlockH = cards.length * (cardH + gap);  const centerX = cardW / 2;

  const [cardsBand, ctaBand] = layoutBands(layout.content.height, [
    { id: "cards", height: cardsBlockH },
    { id: "cta", height: ctaH },
  ]);
  const ctaY = ctaBand.y;
  const score = setScore(ctx.sets);

  return React.createElement(
    "g",
    null,
    React.createElement(
      "g",
      { transform: `translate(0, ${cardsBand.y})` },
      cards.map((insight, index) => {
        const card = renderCompactCoachCard(insight, theme, cardW, cardH);
        if (!card) return null;
        return React.createElement(
          "g",
          { key: insight.id, transform: `translate(0, ${index * (cardH + gap)})` },
          card,
        );
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${ctaY})` },
      React.createElement("rect", {
        fill: `${theme.inkMuted}18`,
        height: 44,
        rx: 8,
        width: cardW,
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
        `${ctx.hostName.split(" ").pop()} vs ${ctx.guestName.split(" ").pop()} · ${score}`,
      ),
      branding.logoHref
        ? React.createElement("image", {
            height: 80,
            href: branding.logoHref,
            preserveAspectRatio: "xMidYMid meet",
            width: 80,
            x: centerX - 40,
            y: 56,
          })
        : null,
      React.createElement(
        "text",
        {
          fill: theme.ink,
          fontFamily: theme.fonts.condensedFont,
          fontSize: 28,
          fontWeight: 700,
          textAnchor: "middle",
          x: centerX,
          y: 152,
        },
        branding.handle,
      ),
      React.createElement(
        "text",
        {
          fill: theme.inkMuted,
          fontFamily: theme.fonts.bodyFont,
          fontSize: theme.fontSize.label,
          textAnchor: "middle",
          x: centerX,
          y: 180,
        },
        branding.tagline,
      ),
    ),
  );
}

function buildCoverHookStat(ctx) {
  const {
    computeFirstServeInFromOfficial,
    computePointsWonFromOfficial,
  } = require("@courtviz/data");

  const totalShots = ctx.enrichedShots.length;
  if (totalShots > 0) {
    return { label: "Tracked shots", value: String(totalShots) };
  }

  const hostWin = computePointsWonFromOfficial(ctx.stats, "host");
  if (hostWin) {
    return { label: "Points won", value: formatPct(hostWin.rate) };
  }

  return null;
}

function buildCoverHookStats(ctx) {
  const {
    computeFirstServeInFromOfficial,
    computePointsWonFromOfficial,
  } = require("@courtviz/data");

  const totalShots = ctx.enrichedShots.length;
  const hostWin = computePointsWonFromOfficial(ctx.stats, "host");
  const guestWin = computePointsWonFromOfficial(ctx.stats, "guest");
  const hostFS = computeFirstServeInFromOfficial(ctx.stats, "host");

  const stats = [];

  if (hostWin && guestWin) {
    const hostPct = hostWin.rate != null ? Math.round(hostWin.rate * 100) : null;
    const guestPct = guestWin.rate != null ? Math.round(guestWin.rate * 100) : null;
    stats.push({
      label: "Points Won",
      value: hostPct != null && guestPct != null ? `${hostPct}%–${guestPct}%` : "—",
    });
  }

  if (hostFS) {
    stats.push({
      label: "1st Serve In",
      value: formatPct(hostFS.rate),
    });
  }

  if (totalShots > 0) {
    stats.push({
      label: "Tracked Shots",
      value: String(totalShots),
    });
  }

  return stats.slice(0, 3);
}

module.exports = {
  HEX_MIN_COUNT,
  HEX_SIZE_RANGE,
  buildAcesStats,
  buildBreakPointBattleStats,
  buildClutchStats,
  buildCoverHookStat,
  buildCoverHookStats,
  buildErrorHeatmapStats,
  buildKeyStats,
  buildKeyStatsSlideStats,
  buildMatchNumbersStats,
  buildReturnGameStats,
  buildRallyHighlightStats,
  buildServeInsight,
  buildServePowerStats,
  buildServeSpeedStats,
  buildSetBySetStats,
  buildShotmakingStats,
  buildSpinDirectionStats,
  buildWinnersErrorStats,
  extractHeroStat,
  renderCoachCards,
  renderCoachCtaSlide,
  renderCompactCoachCard,
  renderDensitySlide,
  renderDuelStats,
  renderErrorHeatmapSlide,
  renderGenericDuelSlide,
  renderKeyStatsSlide,
  renderMiniDualCourt,
  renderMomentumClutchSlide,
  renderMomentumSlide,
  renderRallyBars,
  renderRaysSlide,
  renderServePlacementSlide,
  renderServePowerSlide,
  renderServeSlide,
  renderZonesSlide,
  serveCounts,
  setScore,
  singlesExtent,
};
