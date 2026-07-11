/**
 * Shared SVG slide helpers for carousel and poster exports.
 */

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
} = require("@courtviz/react");
const {
  createCourtScales,
  resolvePosterContentLayout,
  computeServeZones,
  computeRallyBucketStats,
  computeShotFlows,
  computeHexbins,
  computePointsWonRate,
  computeFirstServeInRate,
  computeBreakPointConversion,
  computeServePlacements,
  computeZoneWinRates,
  aggregateSideWinRatesByPoint,
  pointKeyFromShot,
  shotPlayerWonPoint,
  SINGLES_HALF,
} = require("@courtviz/core");
const { getPlayerColor } = require("@courtviz/themes");

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
  pattern: "#38BDF8",
  rally: "#38BDF8",
  serve: "#38BDF8",
  zone: "#38BDF8",
};

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
  const first = serves.filter((s) => s.type !== "second_serve").length;
  const second = serves.filter((s) => s.type === "second_serve").length;
  const faults = serves.filter((s) => s.result !== "In").length;
  return { first, second, faults, total: serves.length };
}

function setScore(sets) {
  return sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(" · ");
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
  const gridsize = 6;
  const gap = 8;
  const courtW = Math.floor((width - gap) / 2);
  const courtH = height;
  const valueDomain = dualEfficiencyDomain(ctx.enrichedShots, ["host", "guest"], half, gridsize);
  const extent = singlesExtent(half);
  const surface = ctx.surface;

  return React.createElement(
    "g",
    { transform: `translate(${x}, ${y})` },
    ["host", "guest"].map((player, index) => {
      const scales = createCourtScales({ half, height: courtH, margin: 1.5, width: courtW });
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
            fontSize: theme.fontSize.label,
            fontWeight: 700,
            x: 0,
            y: -6,
          },
          name.split(" ").pop(),
        ),
        React.createElement(
          CourtSurface,
          { half, height: courtH, idPrefix: `slide-mini-${player}`, surface, theme, width: courtW },
          React.createElement(HexbinLayer, {
            colorScale: "efficiency",
            gridsize,
            half,
            labelMinCount: 4,
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

function renderServeSlide(ctx, theme, layout, insight) {
  const hasInsight = Boolean(insight);
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 220,
    courtAspect: 1,
    insightBand: hasInsight ? 112 : 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY, insightY } = posterLayout;
  const half = "near";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const hostZones = computeServeZones(ctx.enrichedShots, "host");
  const guestZones = computeServeZones(ctx.enrichedShots, "guest");
  const counts = serveCounts(ctx.enrichedShots, "host");
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
  const calloutSpan = courtWidth / 3;

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-serve", surface: ctx.surface, theme, width: courtWidth },
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
          data: hostZoneBarData,
          height: 72,
          maxBars: 3,
          theme,
          width: courtWidth,
        }),
        React.createElement(ZoneBarChart, {
          data: guestZoneBarData,
          height: 72,
          maxBars: 3,
          theme,
          width: courtWidth,
        }),
      ),
    ),
    hasInsight &&
      React.createElement(
        "g",
        { transform: `translate(0, ${insightY - courtY})` },
        renderCompactCoachCard(insight, theme, courtWidth, 100),
      ),
  );
}

function renderRaysSlide(ctx, theme, layout) {
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 56,
    courtAspect: 0.85,
    insightBand: 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY } = posterLayout;
  const half = "full";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const shots = ctx.enrichedShots.filter((s) => s.player === "host" && s.stroke !== "Serve");
  const clipBounds = singlesClipBounds(scales, half);
  const topFlow = computeShotFlows(shots, { minCount: 2, player: "host" })
    .sort((a, b) => b.count - a.count)[0];

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-rays", surface: ctx.surface, theme, width: courtWidth },
      React.createElement(RayLayer, {
        alpha: 0.65,
        clip: true,
        clipBounds,
        curved: true,
        curvature: 0.04,
        highContrast: true,
        player: "host",
        scales,
        shots,
        strokeWidth: 1.2,
        theme,
        useHalfCourtNormalization: true,
      }),
      React.createElement(RayLayer, {
        alpha: 0.42,
        clip: true,
        clipBounds,
        curved: true,
        curvature: 0.03,
        flowMaxWidth: 6,
        flowMinCount: 2,
        flowMode: true,
        player: "host",
        scales,
        shots,
        theme,
        useHalfCourtNormalization: true,
      }),
    ),
    topFlow &&
      React.createElement(
        "g",
        { transform: `translate(0, ${analyticsY - courtY})` },
        React.createElement(StatCallout, {
          accentColor: getPlayerColor("host", theme),
          label: "top pattern win rate",
          theme,
          value: `${Math.round(topFlow.winRate * 100)}%`,
          x: 0,
          y: 0,
        }),
      ),
  );
}

function renderRallyBars(ctx, theme, layout) {
  const hostBuckets = computeRallyBucketStats(ctx.enrichedShots, "host");
  const guestBuckets = computeRallyBucketStats(ctx.enrichedShots, "guest");
  const totalRows = hostBuckets.length + guestBuckets.length + 2;
  const rowH = Math.max(32, Math.floor((layout.content.height - 48) / totalRows));
  const startY = 16;
  const barW = layout.content.width;

  return React.createElement(
    "g",
    { transform: `translate(0, ${startY})` },
    React.createElement(
      "text",
      {
        fill: getPlayerColor("host", theme),
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.body,
        fontWeight: 700,
        x: 0,
        y: 0,
      },
      ctx.hostName,
    ),
    hostBuckets.map((bucket, index) =>
      renderRallyBarRow(bucket, getPlayerColor("host", theme), barW, 16 + index * rowH, theme),
    ),
    React.createElement(
      "text",
      {
        fill: getPlayerColor("guest", theme),
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.body,
        fontWeight: 700,
        x: 0,
        y: 16 + hostBuckets.length * rowH + 20,
      },
      ctx.guestName,
    ),
    guestBuckets.map((bucket, index) =>
      renderRallyBarRow(
        bucket,
        getPlayerColor("guest", theme),
        barW,
        16 + hostBuckets.length * rowH + 36 + index * rowH,
        theme,
      ),
    ),
  );
}

function renderRallyBarRow(bucket, color, width, y, theme) {
  const barW = width - 120;
  const fillW = barW * (Number.isFinite(bucket.winRate) ? bucket.winRate : 0);
  return React.createElement(
    "g",
    { key: bucket.bucket, transform: `translate(0, ${y})` },
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.label,
        x: 0,
        y: 12,
      },
      `${bucket.bucket} shots`,
    ),
    React.createElement("rect", {
      fill: `${theme.inkMuted}33`,
      height: 10,
      rx: 5,
      width: barW,
      x: 110,
      y: 2,
    }),
    React.createElement("rect", {
      fill: color,
      height: 10,
      rx: 5,
      width: fillW,
      x: 110,
      y: 2,
    }),
    React.createElement(
      "text",
      {
        fill: color,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.body,
        fontWeight: 700,
        x: width - 48,
        y: 12,
      },
      `${Math.round(bucket.winRate * 100)}%`,
    ),
  );
}

function renderDuelStats(ctx, theme, layout, stats) {
  const startY = 8;
  const rowH = Math.floor((layout.content.height - 16) / stats.length);

  return React.createElement(
    "g",
    { transform: `translate(0, ${startY})` },
    stats.map((stat, index) => {
      const total = Math.max((stat.hostShare ?? 0) + (stat.guestShare ?? 0), 0.001);
      const hostPct = (stat.hostShare ?? 0) / total;
      const guestPct = 1 - hostPct;
      const barW = layout.content.width - 40;
      const centerX = barW / 2;
      const hostWins = stat.hostShare >= stat.guestShare;

      return React.createElement(
        "g",
        { key: stat.title, transform: `translate(0, ${index * rowH})` },
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
            fontSize: hostWins ? 32 : 24,
            fontWeight: 700,
            x: 0,
            y: 48,
          },
          stat.hostValue,
        ),
        React.createElement(
          "text",
          {
            fill: !hostWins ? getPlayerColor("guest", theme) : `${getPlayerColor("guest", theme)}88`,
            fontFamily: theme.fonts.condensedFont,
            fontSize: !hostWins ? 32 : 24,
            fontWeight: 700,
            textAnchor: "end",
            x: barW,
            y: 48,
          },
          stat.guestValue,
        ),
        React.createElement("rect", {
          fill: `${theme.inkMuted}33`,
          height: 12,
          rx: 6,
          width: barW,
          x: 0,
          y: 58,
        }),
        React.createElement("rect", {
          fill: getPlayerColor("host", theme),
          height: 12,
          rx: 6,
          width: centerX * hostPct,
          x: centerX - centerX * hostPct,
          y: 58,
        }),
        React.createElement("rect", {
          fill: getPlayerColor("guest", theme),
          height: 12,
          rx: 6,
          width: centerX * guestPct,
          x: centerX,
          y: 58,
        }),
      );
    }),
  );
}

function renderCompactCoachCard(insight, theme, width, height = 100) {
  if (!insight) return null;
  const accent = insightAccent(theme, insight.category);
  const categoryLabel = insight.category ? insight.category.toUpperCase() : "INSIGHT";

  return React.createElement(
    "g",
    null,
    React.createElement("rect", {
      fill: `${accent}18`,
      height,
      rx: 10,
      stroke: `${accent}55`,
      strokeWidth: 1,
      width,
      x: 0,
      y: 0,
    }),
    React.createElement("rect", {
      fill: accent,
      height,
      rx: 2,
      width: 5,
      x: 0,
      y: 0,
    }),
    React.createElement("rect", {
      fill: `${accent}33`,
      height: 22,
      rx: 11,
      width: Math.min(120, categoryLabel.length * 8 + 24),
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
        x: 150,
        y: 30,
      },
      "COACH TAKEAWAY",
    ),
    React.createElement(
      "text",
      {
        fill: theme.ink,
        fontFamily: theme.fonts.condensedFont,
        fontSize: theme.fontSize.subtitle,
        fontWeight: 600,
        x: 16,
        y: 58,
      },
      insight.headline.length > 58 ? `${insight.headline.slice(0, 58)}…` : insight.headline,
    ),
    React.createElement(
      "text",
      {
        fill: theme.inkMuted,
        fontFamily: theme.fonts.bodyFont,
        fontSize: theme.fontSize.label,
        x: 16,
        y: 82,
      },
      insight.action.length > 72 ? `${insight.action.slice(0, 72)}…` : insight.action,
    ),
  );
}

function renderZonesSlide(ctx, theme, layout) {
  const barW = layout.content.width;
  const rowH = 96;
  const gap = 24;
  const startY = 16;
  const hostSides = aggregateSideWinRates(ctx.enrichedShots, "host");
  const guestSides = aggregateSideWinRates(ctx.enrichedShots, "guest");
  const columnW = (barW - gap) / 2;

  function renderSideColumn(sides, player, x, title) {
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
      sides.map((entry, index) => {
        const winRate = Number.isFinite(entry.winRate) ? entry.winRate : 0;
        const pct = Math.round(winRate * 100);
        const trackW = columnW - 16;
        const barWidth = Math.max(10, trackW * winRate);
        return React.createElement(
          "g",
          { key: `${player}-${entry.side}`, transform: `translate(0, ${48 + index * rowH})` },
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: theme.fontSize.body,
              fontWeight: 600,
              x: 0,
              y: 18,
            },
            `${entry.side} court`,
          ),
          React.createElement("rect", {
            fill: `${theme.inkMuted}33`,
            height: 18,
            rx: 9,
            width: trackW,
            x: 0,
            y: 28,
          }),
          React.createElement("rect", {
            fill: getPlayerColor(player, theme),
            height: 18,
            rx: 9,
            width: barWidth,
            x: 0,
            y: 28,
          }),
          React.createElement(
            "text",
            {
              fill: theme.ink,
              fontFamily: theme.fonts.condensedFont,
              fontSize: 28,
              fontWeight: 700,
              textAnchor: "end",
              x: trackW + 108,
              y: 44,
            },
            `${pct}%`,
          ),
          React.createElement(
            "text",
            {
              fill: theme.inkMuted,
              fontFamily: theme.fonts.bodyFont,
              fontSize: theme.fontSize.label,
              textAnchor: "end",
              x: trackW + 108,
              y: 62,
            },
            `${entry.won}/${entry.total} pts`,
          ),
        );
      }),
    );
  }

  return React.createElement(
    "g",
    { transform: `translate(0, ${startY})` },
    renderSideColumn(hostSides, "host", 0, ctx.hostName),
    renderSideColumn(guestSides, "guest", columnW + gap, ctx.guestName),
  );
}

function renderCoachCards(ctx, theme, layout, insights) {
  const cards = insights.slice(0, 3);
  const cardH = Math.floor((layout.content.height - 16) / cards.length) - 8;
  const cardW = layout.content.width;

  return React.createElement(
    "g",
    { transform: "translate(0, 8)" },
    cards.map((insight, index) => {
      const accent = insightAccent(theme, insight.category, index);
      return React.createElement(
        "g",
        { key: insight.id, transform: `translate(0, ${index * (cardH + 8)})` },
        React.createElement("rect", {
          fill: `${accent}18`,
          height: cardH,
          rx: 10,
          stroke: `${accent}55`,
          strokeWidth: 1,
          width: cardW,
          x: 0,
          y: 0,
        }),
        React.createElement("rect", {
          fill: accent,
          height: cardH,
          rx: 2,
          width: 5,
          x: 0,
          y: 0,
        }),
        React.createElement(
          "text",
          {
            fill: accent,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.label,
            fontWeight: 700,
            x: 16,
            y: 22,
          },
          insight.category.toUpperCase(),
        ),
        React.createElement(
          "text",
          {
            fill: theme.ink,
            fontFamily: theme.fonts.condensedFont,
            fontSize: theme.fontSize.subtitle,
            fontWeight: 600,
            x: 16,
            y: 52,
          },
          insight.headline.length > 64 ? `${insight.headline.slice(0, 64)}…` : insight.headline,
        ),
        React.createElement(
          "text",
          {
            fill: theme.inkMuted,
            fontFamily: theme.fonts.bodyFont,
            fontSize: theme.fontSize.label,
            x: 16,
            y: cardH - 16,
          },
          insight.action.length > 90 ? `${insight.action.slice(0, 90)}…` : insight.action,
        ),
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
      guestShare: guestWin.rate,
      guestValue: `${Math.round(guestWin.rate * 100)}%`,
      hostShare: hostWin.rate,
      hostValue: `${Math.round(hostWin.rate * 100)}%`,
      title: "Points Won",
    },
    {
      guestShare: guestFS.rate,
      guestValue: `${Math.round(guestFS.rate * 100)}%`,
      hostShare: hostFS.rate,
      hostValue: `${Math.round(hostFS.rate * 100)}%`,
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
      guestShare: guestBP.rate,
      guestValue: `${Math.round(guestBP.rate * 100)}%`,
      hostShare: hostBP.rate,
      hostValue: `${Math.round(hostBP.rate * 100)}%`,
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
      guestValue: guest ? `${Math.round(guest.rate * 100)}%` : "—",
      hostShare: host?.rate ?? 0,
      hostValue: host ? `${Math.round(host.rate * 100)}%` : "—",
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
      guestValue: guestSpin ? `${guestSpin.spin} ${Math.round(guestSpin.winRate * 100)}%` : "—",
      hostShare: hostSpin?.winRate ?? 0,
      hostValue: hostSpin ? `${hostSpin.spin} ${Math.round(hostSpin.winRate * 100)}%` : "—",
      title: "Best Spin Win Rate",
    },
    {
      guestShare: guestDir?.winRate ?? 0,
      guestValue: guestDir ? `${guestDir.direction} ${Math.round(guestDir.winRate * 100)}%` : "—",
      hostShare: hostDir?.winRate ?? 0,
      hostValue: hostDir ? `${hostDir.direction} ${Math.round(hostDir.winRate * 100)}%` : "—",
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
    const total = Math.max(hostWon + guestWon, 1);
    return {
      guestShare: guestWon / total,
      guestValue: `${Math.round((guestWon / total) * 100)}%`,
      hostShare: hostWon / total,
      hostValue: `${Math.round((hostWon / total) * 100)}%`,
      title: label,
    };
  }

  return [
    clutchRate("Break Points Won", (point) => point.breakPoint),
    clutchRate("Deuce Points Won", (point) => point.deuce),
    clutchRate("Set Points Won", (point) => point.setPoint),
  ];
}

function buildErrorHeatmapStats(ctx) {
  function errorCount(player) {
    return ctx.enrichedShots.filter(
      (s) => s.player === player && (s.result === "Out" || s.result === "Net" || s.endedBy === "unforced_error"),
    ).length;
  }

  const hostErrors = errorCount("host");
  const guestErrors = errorCount("guest");
  const total = Math.max(hostErrors + guestErrors, 1);

  return [
    {
      guestShare: guestErrors / total,
      guestValue: String(guestErrors),
      hostShare: hostErrors / total,
      hostValue: String(hostErrors),
      title: "Errors (Out/Net/UE)",
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
  const gap = 16;
  const labelH = 28;
  const courtW = Math.floor((layout.content.width - gap) / 2);
  const courtH = Math.floor(layout.content.height - labelH - 12);
  const half = "near";

  function renderPlayerDensity(player, x, name) {
    const scales = createCourtScales({ half, height: courtH, margin: 1.5, width: courtW });
    return React.createElement(
      "g",
      { key: player, transform: `translate(${x}, ${labelH})` },
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
        { half, height: courtH, idPrefix: `slide-density-${player}`, surface: ctx.surface, theme, width: courtW },
        React.createElement(DensityLayer, {
          alpha: 0.45,
          bandwidth: 1.2,
          half,
          highColor: getPlayerColor(player, theme),
          lowColor: `${theme.inkMuted}44`,
          player,
          scales,
          shots: ctx.enrichedShots,
          showOutlines: false,
          theme,
          thresholds: 5,
        }),
      ),
    );
  }

  return React.createElement(
    "g",
    { transform: "translate(0, 8)" },
    renderPlayerDensity("host", 0, ctx.hostName),
    renderPlayerDensity("guest", courtW + gap, ctx.guestName),
  );
}

function renderErrorHeatmapSlide(ctx, theme, layout) {
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 56,
    courtAspect: 0.85,
    insightBand: 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY } = posterLayout;
  const half = "near";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const errors = errorShots(ctx.enrichedShots);
  const hostErrors = errors.filter((s) => s.player === "host").length;
  const guestErrors = errors.filter((s) => s.player === "guest").length;

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-errors", surface: ctx.surface, theme, width: courtWidth },
      React.createElement(DotLayer, {
        alpha: 0.75,
        colorBy: "player",
        highContrast: true,
        player: "host",
        scales,
        shots: errors,
        size: 6,
        theme,
        useHalfCourtNormalization: true,
      }),
      React.createElement(DotLayer, {
        alpha: 0.75,
        colorBy: "player",
        highContrast: true,
        player: "guest",
        scales,
        shots: errors,
        size: 6,
        theme,
        useHalfCourtNormalization: true,
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${analyticsY - courtY})` },
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("host", theme),
        label: "host errors",
        theme,
        value: String(hostErrors),
        x: 0,
        y: 0,
      }),
      React.createElement(StatCallout, {
        accentColor: getPlayerColor("guest", theme),
        label: "guest errors",
        theme,
        value: String(guestErrors),
        x: courtWidth / 2,
        y: 0,
      }),
    ),
  );
}

function renderServePlacementSlide(ctx, theme, layout) {
  const posterLayout = resolvePosterContentLayout(layout, {
    analyticsBand: 180,
    courtAspect: 1,
    insightBand: 0,
    legendBand: 0,
  });
  const { analyticsY, courtHeight, courtWidth, courtX, courtY } = posterLayout;
  const half = "near";
  const scales = createCourtScales({ half, height: courtHeight, margin: 1.5, width: courtWidth });
  const hostPlacements = computeServePlacements(ctx.enrichedShots, "host").slice(0, 4);

  return React.createElement(
    "g",
    { transform: `translate(${courtX}, ${courtY})` },
    React.createElement(
      CourtSurface,
      { half, height: courtHeight, idPrefix: "slide-placement", surface: ctx.surface, theme, width: courtWidth },
      React.createElement(ServeLayer, {
        haloWidth: 1.5,
        highContrast: true,
        includeFaults: false,
        inBoxOnly: true,
        player: "host",
        scales,
        serveType: "first_serve",
        shots: ctx.enrichedShots,
        size: 7,
        theme,
      }),
    ),
    React.createElement(
      "g",
      { transform: `translate(0, ${analyticsY - courtY})` },
      hostPlacements.map((placement, index) =>
        React.createElement(StatCallout, {
          key: placement.zone,
          label: `${placement.side} ${placement.zone}`,
          theme,
          value: `${Math.round(placement.inRate * 100)}% in`,
          x: (index % 2) * (courtWidth / 2),
          y: Math.floor(index / 2) * 52,
        }),
      ),
    ),
  );
}

function renderGenericDuelSlide(ctx, theme, layout, stats) {
  return renderDuelStats(ctx, theme, layout, stats);
}

module.exports = {
  HEX_MIN_COUNT,
  HEX_SIZE_RANGE,
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
  extractHeroStat,
  renderCoachCards,
  renderCompactCoachCard,
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
  serveCounts,
  setScore,
  singlesExtent,
};
