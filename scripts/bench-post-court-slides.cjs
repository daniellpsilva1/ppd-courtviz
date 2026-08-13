/**
 * Court-first Match report slide renderers (50-slide deck).
 * Uses shared shell from bench-post-helpers.cjs — no duel bars / histograms.
 */

const path = require("path");
const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const React = require("react");
const {
  DotLayer,
  FigureFrame,
  HexbinLayer,
  InsightPanel,
  insightPanelHeight,
  RayLayer,
  ServeLayer,
  ZoneWinRateLayer,
} = require("@courtviz/react");
const {
  BOUNCE_ZONE_GRID_3X2,
  COURT_LENGTH,
  DEPTH_DEEP_MIN_M,
  DEPTH_SHORT_MAX_M,
  DOUBLES_HALF,
  classifyDepthFromNet,
  classifyOutBounce,
  computeFirstServeInRate,
  computeHexbins,
  createCourtScales,
  computeServePlusOneChains,
  computeServePointsWonRate,
  computeServeZones,
  computeZoneWinRates,
  computeZoneWinRatesByPoint,
  computePatternStats,
  distanceFromNetY,
  fitSvgText,
  hasValidSpatialCoords,
  layoutBands,
  NET_Y,
  normalizeShot,
  shouldPlotOutError,
  truncateText,
} = require("@courtviz/core");
const { computeServePointsWonFromOfficial } = require("@courtviz/data");
const { generateCoachInsights } = require("@ppd/brand");

const {
  BENCH_BG_MID,
  BENCH_BLUE,
  BENCH_DOT_DENSITY,
  BENCH_DOT_ERRORS,
  BENCH_DOT_SNAPSHOT,
  BENCH_DOT_STROKE,
  BENCH_DOT_VOLLEYS,
  BENCH_GAP,
  BENCH_HEX_DENSITY,
  BENCH_LEGEND_H,
  BENCH_PANEL_PAD,
  BENCH_STATS_ROW_H,
  COURT_NEAR_ASPECT,
  COURT_PLOT_ASPECT,
  GUEST_COLOR,
  HOST_COLOR,
  SURFACE_CLAY,
  SURFACE_GRASS,
  SURFACE_HARD,
  benchBackground,
  benchCourt,
  benchFrameLayoutProps,
  benchLayout,
  benchTheme,
  courtBox,
  g,
  legendRow,
  renderCourtSlideShell,
  statCard,
  text,
  toEnrichedShots,
} = require("./bench-post-helpers.cjs");

/** Matches DotLayer highContrast stroke palette (bench dots use highContrast: true). */
const DOT_HC_STROKE = {
  backhand: "#22D3EE",
  forehand: "#FB923C",
  serve: "#C084FC",
  volley: "#4ADE80",
};

function strokeLegendItems(keys = ["forehand", "backhand"]) {
  return keys.map((key) => ({
    color: DOT_HC_STROKE[key],
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }));
}

function lastName(name) {
  return (name || "Player").split(" ").pop();
}

function surfaceOf(fixture) {
  return fixture.featured?.surface || fixture.aggregates?.dominantSurface || "clay";
}

function surfaceColor(surface) {
  if (surface === "clay") return SURFACE_CLAY;
  if (surface === "grass") return SURFACE_GRASS;
  return SURFACE_HARD;
}

function playerColor(player) {
  return player === "guest" ? GUEST_COLOR : HOST_COLOR;
}

function playerName(fixture, player) {
  return player === "guest" ? fixture.featured.guestName : fixture.featured.hostName;
}

function featuredShots(fixture) {
  return fixture.featured?.shotPreview || fixture.pooledShots || [];
}

function enrichedFromFixture(fixture) {
  return toEnrichedShots(featuredShots(fixture));
}

function pct(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${Math.round(rate * 1000) / 10}%`;
}

/** Look up a featured.duelStats row by key (e.g. break_conv). */
function duelStatByKey(fixture, key) {
  return (fixture.featured?.duelStats || []).find((d) => d.key === key) || null;
}

/** Format duelStats percentage values (already 0–100, not 0–1 rates). */
function formatDuelPct(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${value}%`;
}

function formatWonTotal(won, total) {
  if (total == null || total === 0) return "—";
  return `${won ?? 0}/${total}`;
}

/** Official winners : unforced-errors ratio from fixture.winnersErrors. */
function wUeRatio(sideStats) {
  if (!sideStats || sideStats.ratio == null || Number.isNaN(sideStats.ratio)) return "—";
  return String(sideStats.ratio);
}

function winnersKpis(fixture, player, endings, accent) {
  const we = fixture.winnersErrors?.[player];
  const name = lastName(playerName(fixture, player));
  return [
    { accent, label: `${name} endings`, value: String(endings.length) },
    { accent: BENCH_BLUE, label: "Official W", value: we?.winners != null ? String(we.winners) : "—" },
    { accent: BENCH_BLUE, label: "Official UE", value: we?.unforced != null ? String(we.unforced) : "—" },
    { accent, label: "W:UE", value: wUeRatio(we) },
  ];
}

/** Last shot of each point (proxy when endedBy is null). */
function lastShotsOfPoints(enriched) {
  const byPoint = new Map();
  for (const shot of enriched) {
    const key = `${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}`;
    const prev = byPoint.get(key);
    if (!prev || (shot.shotNumber ?? 0) > (prev.shotNumber ?? 0)) byPoint.set(key, shot);
  }
  return [...byPoint.values()];
}

function pointEndingWinners(enriched, player) {
  return lastShotsOfPoints(enriched).filter(
    (s) => s.player === player && s.result === "In" && s.pointWinner === player,
  );
}

function pointEndingErrors(enriched, result) {
  return lastShotsOfPoints(enriched).filter((s) => s.result === result);
}

/** Point-ending Outs that are geometrically outside singles (drop false in-court labels). */
function plottableOutErrors(enriched) {
  return pointEndingErrors(enriched, "Out").filter((s) =>
    shouldPlotOutError(s.bounceX, s.bounceY),
  );
}

function splitAlleyOutErrors(outs) {
  const alley = [];
  const trueOut = [];
  for (const s of outs) {
    if (classifyOutBounce(s.bounceX, s.bounceY) === "alley") alley.push(s);
    else trueOut.push(s);
  }
  return { alley, trueOut };
}

/** Slightly south of the tape so markers aren't half-clipped at the net edge. */
const NET_PIN_Y = NET_Y - 0.22;

function pinNetErrors(enriched) {
  return lastShotsOfPoints(enriched)
    .filter((s) => s.result === "Net")
    .map((s) => {
      const bounceX = s.bounceX ?? s.hitX;
      if (bounceX == null) return null;
      return { ...s, bounceX, bounceY: NET_PIN_Y };
    })
    .filter(Boolean);
}

/** Plot volley contact; pin Net results just inside the tape. */
function pinVolleyContacts(volleys) {
  return volleys
    .map((s) => {
      if (s.result === "Net") {
        const x = s.hitX ?? s.bounceX;
        if (x == null) return null;
        return { ...s, bounceX: x, bounceY: NET_PIN_Y };
      }
      if (s.hitX != null && s.hitY != null) {
        return { ...s, bounceX: s.hitX, bounceY: s.hitY };
      }
      if (s.bounceX == null || s.bounceY == null) return null;
      return s;
    })
    .filter(Boolean);
}

/**
 * Approach & net: plot contact (hit), not bounce. Net results pin inside the tape.
 * Full-court only — half-norm would fold far-end contacts off-story.
 */
function pinApproachNetContacts(shots) {
  return shots
    .map((s) => {
      if (s.result === "Net") {
        const x = s.hitX ?? s.bounceX;
        if (x == null) return null;
        return { ...s, bounceX: x, bounceY: NET_PIN_Y };
      }
      if (s.hitX != null && s.hitY != null) {
        return { ...s, bounceX: s.hitX, bounceY: s.hitY };
      }
      if (s.bounceX == null || s.bounceY == null) return null;
      return s;
    })
    .filter(Boolean);
}

function officialReturnPointsWon(fixture, player) {
  const r1 = officialStatValue(fixture, player, "1st Returns") ?? 0;
  const r2 = officialStatValue(fixture, player, "2nd Returns") ?? 0;
  const w1 = officialStatValue(fixture, player, "1st Returns Won") ?? 0;
  const w2 = officialStatValue(fixture, player, "2nd Returns Won") ?? 0;
  const total = r1 + r2;
  if (!total) return null;
  return { rate: (w1 + w2) / total, total, won: w1 + w2 };
}

function deepShare(shots) {
  const ins = shots.filter((s) => s.result === "In" && depthBand(s));
  if (!ins.length) return null;
  const deep = ins.filter((s) => depthBand(s) === "deep").length;
  return deep / ins.length;
}

function filterBySet(enriched, setNumber) {
  return enriched.filter((s) => s.setNumber === setNumber);
}

/** Max hexbin count for In shots — used to share color scales across set slides. */
function maxHexCount(shots, hexOpts = {}) {
  const ins = shots.filter((s) => s.result === "In" && s.bounceX != null && s.bounceY != null);
  if (!ins.length) return 1;
  const bins = computeHexbins(
    { x: ins.map((s) => s.bounceX), y: ins.map((s) => s.bounceY) },
    {
      gridsize: hexOpts.gridsize ?? BENCH_HEX_DENSITY.gridsize ?? 9,
      half: hexOpts.half ?? "full",
      minCount: hexOpts.minCount ?? BENCH_HEX_DENSITY.minCount ?? 1,
      sizeRange: hexOpts.sizeRange ?? BENCH_HEX_DENSITY.sizeRange,
    },
  );
  return Math.max(1, ...bins.map((b) => b.count), 1);
}

function filterRallyBucket(enriched, minLen, maxLen) {
  return lastShotsOfPoints(enriched).filter((s) => {
    const len = s.rallyLength ?? s.shotNumber ?? 0;
    return len >= minLen && (maxLen == null || len <= maxLen);
  });
}

/** Remap shot.player → pointWinner so DotLayer colorBy:"player" = who won the point. */
function asPointWinnerDots(shots) {
  return shots.map((s) => ({
    ...s,
    player: s.pointWinner === "guest" ? "guest" : s.pointWinner === "host" ? "host" : s.player,
  }));
}

function depthBand(shot) {
  if (shot.bounceY == null) return null;
  const band = classifyDepthFromNet(distanceFromNetY(shot.bounceY));
  return band === "out" ? null : band;
}

function depthBandRects(scales) {
  const x0 = scales.x(-DOUBLES_HALF);
  const x1 = scales.x(DOUBLES_HALF);
  const w = Math.abs(x1 - x0);
  const bands = [];
  const gradId = `depth-band-grad-${Math.random().toString(36).slice(2, 8)}`;
  const gradStops = [
    { color: "#93C5FD", key: "short", opacity: 0.70 },
    { color: "#3B82F6", key: "mid", opacity: 0.65 },
    { color: "#0047FF", key: "deep", opacity: 0.60 },
  ];
  const bandLabels = { deep: "DEEP", mid: "MID", short: "SHORT" };
  const defs = gradStops.map((s) => {
    const sideGrad = [-1, 1].map((side) => {
      return React.createElement("linearGradient", {
        id: `${gradId}-${s.key}-${side}`,
        key: `${s.key}-${side}`,
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 1,
      },
        React.createElement("stop", { offset: "0%", stopColor: s.color, stopOpacity: s.opacity * 0.75 }),
        React.createElement("stop", { offset: "20%", stopColor: s.color, stopOpacity: s.opacity }),
        React.createElement("stop", { offset: "80%", stopColor: s.color, stopOpacity: s.opacity }),
        React.createElement("stop", { offset: "100%", stopColor: s.color, stopOpacity: s.opacity * 0.75 }),
      );
    });
    return sideGrad;
  });
  bands.push(React.createElement("defs", { key: "depth-grad-defs" }, defs));

  for (const side of [-1, 1]) {
    const shortY0 = NET_Y;
    const shortY1 = NET_Y + side * DEPTH_SHORT_MAX_M;
    const midY1 = NET_Y + side * DEPTH_DEEP_MIN_M;
    const deepY1 = side > 0 ? COURT_LENGTH : 0;
    const pair = [
      { key: "short", y0: shortY0, y1: shortY1 },
      { key: "mid", y0: shortY1, y1: midY1 },
      { key: "deep", y0: midY1, y1: deepY1 },
    ];
    for (const b of pair) {
      const ya = scales.y(b.y0);
      const yb = scales.y(b.y1);
      const topY = Math.min(ya, yb);
      const h = Math.abs(yb - ya);
      bands.push(React.createElement("rect", {
        fill: `url(#${gradId}-${b.key}-${side})`,
        height: h,
        key: `${b.key}-${side}`,
        width: w,
        x: Math.min(x0, x1),
        y: topY,
      }));
      // Boundary line at the top of each band (except the first which is the net)
      if (b.key !== "short") {
        bands.push(React.createElement("line", {
          key: `border-${b.key}-${side}`,
          stroke: "#ffffff",
          strokeOpacity: 0.9,
          strokeWidth: 2,
          x1: Math.min(x0, x1),
          x2: Math.max(x0, x1),
          y1: topY,
          y2: topY,
        }));
      }
      // Band label centered in the band
      const labelY = topY + h / 2;
      const labelX = Math.min(x0, x1) + w / 2;
      bands.push(React.createElement("text", {
        dominantBaseline: "middle",
        fill: "#ffffff",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 13,
        fontWeight: 800,
        key: `label-${b.key}-${side}`,
        letterSpacing: "0.2em",
        opacity: 0.95,
        paintOrder: "stroke",
        stroke: "rgba(0,0,0,0.5)",
        strokeWidth: 3.5,
        textAnchor: "middle",
        x: labelX,
        y: labelY,
      }, bandLabels[b.key]));
    }
  }
  return bands;
}

function depthCounts(enriched, player) {
  const counts = { deep: 0, mid: 0, short: 0 };
  for (const s of enriched) {
    if (player && s.player !== player) continue;
    if (s.result !== "In" || s.bounceY == null) continue;
    const band = depthBand(s);
    if (band) counts[band]++;
  }
  return counts;
}

function serveSpeedStats(enriched, player) {
  const speeds = enriched
    .filter((s) => s.player === player && s.stroke === "Serve" && s.speedKmh != null)
    .map((s) => s.speedKmh)
    .sort((a, b) => a - b);
  if (!speeds.length) return { avg: 0, max: 0, n: 0 };
  const avg = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);
  return { avg, max: Math.round(speeds[speeds.length - 1]), n: speeds.length };
}

/** Normalize fixture.stats (snake_case) for @courtviz/data official helpers. */
function officialStatsFromFixture(fixture) {
  return (fixture.stats || []).map((row) => ({
    player: row.player,
    setNumber: row.set_number ?? row.setNumber ?? 0,
    statName: row.stat_name ?? row.statName,
    statValue: row.stat_value ?? row.statValue,
  }));
}

function officialStatValue(fixture, player, statName) {
  const row = officialStatsFromFixture(fixture).find(
    (s) => s.player === player && s.setNumber === 0 && s.statName === statName,
  );
  return row?.statValue ?? null;
}

function servePointsWon(fixture, enriched, player, serve) {
  const official = computeServePointsWonFromOfficial(
    officialStatsFromFixture(fixture),
    player,
    serve === "first" ? "1st" : "2nd",
  );
  if (official) return official;
  return computeServePointsWonRate(enriched, player, serve);
}

function isServeTypeShot(type, serve) {
  const t = String(type || "").toLowerCase().replace(/\s+/g, "_");
  return serve === "first" ? t === "first_serve" : t === "second_serve";
}

/** Amber 2nd-serve token — matches ServeLayer; never guest orange on clay. */
function secondServeLegendColor(surface) {
  return surface === "clay" ? "#FACC15" : "#FBBF24";
}

function renderServe1stVs2nd(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const hostLast = lastName(fixture.featured.hostName);
  const guestLast = lastName(fixture.featured.guestName);
  const secondCol = secondServeLegendColor(surface);

  function sideStats(player) {
    const tracked = enriched.filter((s) => s.stroke === "Serve" && s.player === player);
    const firstTracked = tracked.filter((s) => isServeTypeShot(s.type, "first")).length;
    const secondTracked = tracked.filter((s) => isServeTypeShot(s.type, "second")).length;
    return {
      firstCount: officialStatValue(fixture, player, "1st Serves") ?? firstTracked,
      firstWon: servePointsWon(fixture, enriched, player, "first"),
      secondCount: officialStatValue(fixture, player, "2nd Serves") ?? secondTracked,
      secondWon: servePointsWon(fixture, enriched, player, "second"),
    };
  }
  const host = sideStats("host");
  const guest = sideStats("guest");

  return renderMultiCourtShell({
    branding,
    cells: [
      {
        id: "host-1-2",
        label: hostLast,
        render: ({ scales }) => React.createElement(ServeLayer, {
          alpha: 0.55,
          courtSurface: surface,
          highContrast: true,
          includeFaults: false,
          player: "host",
          scales,
          serveType: "both",
          shapeEncode: true,
          shots: enriched,
          size: 4,
          theme: benchTheme,
        }),
        surface,
      },
      {
        id: "guest-1-2",
        label: guestLast,
        render: ({ scales }) => React.createElement(ServeLayer, {
          alpha: 0.55,
          courtSurface: surface,
          highContrast: true,
          includeFaults: false,
          player: "guest",
          scales,
          serveType: "both",
          shapeEncode: true,
          shots: enriched,
          size: 4,
          theme: benchTheme,
        }),
        surface,
      },
    ],
    cols: 2,
    half: "near",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: "1st · circle" },
      { color: secondCol, label: "2nd · triangle" },
      { color: GUEST_COLOR, label: "Guest 1st" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    slideCount,
    slideIndex,
    stats: [
      { accent: HOST_COLOR, label: `${hostLast} 1st won`, value: pct(host.firstWon.rate) },
      { accent: HOST_COLOR, label: `${hostLast} 2nd won`, value: pct(host.secondWon.rate) },
      { accent: GUEST_COLOR, label: `${guestLast} 1st won`, value: pct(guest.firstWon.rate) },
      { accent: GUEST_COLOR, label: `${guestLast} 2nd won`, value: pct(guest.secondWon.rate) },
    ],
    subtitle: "Circles = 1st · triangles = 2nd · official won% (tracked dots may undercount 2nds)",
    title: "1st vs 2nd serve",
  });
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function renderServeMapFor(player, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const name = lastName(playerName(fixture, player));
  const zones = computeServeZones(enriched, player);
  const top = zones[0];
  const speed = serveSpeedStats(enriched, player);
  const secondCol = secondServeLegendColor(surface);
  const accent = playerColor(player);
  const firstIn = duelStatByKey(fixture, "first_serve");
  const firstInVal = player === "guest" ? firstIn?.guest : firstIn?.host;

  return renderCourtSlideShell({
    branding,
    half: "near",
    legend: legendRow(0, 0, [
      { color: accent, label: "1st · circle" },
      { color: secondCol, label: "2nd · triangle" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "near", margin: 1.5 });
      return benchCourt(`bench-serve-${player}`, { half: "near", height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(ServeLayer, {
          alpha: 0.55,
          courtSurface: surface,
          haloWidth: 0.5,
          highContrast: true,
          includeFaults: false,
          player,
          scales,
          serveType: "both",
          shapeEncode: true,
          shots: enriched,
          size: 4.5,
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent, label: `${name} 1st in`, value: formatDuelPct(firstInVal) },
      { accent, label: "Max speed", value: `${speed.max} km/h` },
      {
        accent: BENCH_BLUE,
        label: top ? `Top ${String(top.side)} ${String(top.zone)}` : "Top zone",
        value: top?.winRate != null ? pct(top.winRate) : "—",
      },
      { accent: secondCol, label: "In serves", value: String(speed.n) },
    ],
    subtitle: `${name} · in-box landings · circles 1st · triangles 2nd`,
    title: "Serve placement",
  });
}

function renderServeSpeedCourt(player, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const name = lastName(playerName(fixture, player));
  const speed = serveSpeedStats(enriched, player);
  const accent = playerColor(player);

  return renderCourtSlideShell({
    branding,
    half: "near",
    legend: legendRow(0, 0, [
      { color: accent, label: "Larger = faster" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "near", margin: 1.5 });
      return benchCourt(`bench-serve-speed-${player}`, { half: "near", height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(ServeLayer, {
          alpha: 0.65,
          courtSurface: surface,
          haloWidth: 0.6,
          highContrast: true,
          includeFaults: false,
          player,
          scales,
          serveType: "both",
          shapeEncode: true,
          shots: enriched,
          size: 5.5,
          sizeBy: "speed",
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent, label: `${name} avg`, value: `${speed.avg} km/h` },
      { accent, label: "Max", value: `${speed.max} km/h` },
      { accent: BENCH_BLUE, label: "Serves", value: String(speed.n) },
    ],
    subtitle: `${name} · velocity on court`,
    title: "Serve speed",
  });
}

function renderTerritoryFor(player, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const name = lastName(playerName(fixture, player));
  const accent = playerColor(player);
  const n = enriched.filter((s) => s.player === player && s.result === "In").length;

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, [
      { color: accent, label: "Higher density" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      return benchCourt(`bench-territory-${player}`, { height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          player,
          scales,
          shots: enriched,
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent, label: `${name} In shots`, value: String(n) },
      { accent: BENCH_BLUE, label: "Share of match", value: pct(n / Math.max(enriched.filter((s) => s.result === "In").length, 1)) },
    ],
    subtitle: `Where ${name} hit most`,
    title: "Territory",
  });
}

function zoneShareLabel(zones, zoneName) {
  const total = zones.reduce((sum, z) => sum + (z.count || 0), 0) || 1;
  const target = String(zoneName).toLowerCase();
  const hit = zones
    .filter((z) => String(z.zone || "").toLowerCase() === target)
    .reduce((sum, z) => sum + (z.count || 0), 0);
  return pct(hit / total);
}

function renderServeZonesHeat(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const hostLast = lastName(fixture.featured.hostName);
  const guestLast = lastName(fixture.featured.guestName);
  const hostZones = computeServeZones(enriched, "host");
  const guestZones = computeServeZones(enriched, "guest");
  const hostTop = [...hostZones].filter((z) => z.winRate != null).sort((a, b) => b.winRate - a.winRate)[0];
  const guestTop = [...guestZones].filter((z) => z.winRate != null).sort((a, b) => b.winRate - a.winRate)[0];

  return renderMultiCourtShell({
    branding,
    cells: [
      {
        id: "host-zones",
        label: hostLast,
        render: ({ scales }) => React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          colorScale: "count",
          gridsize: 7,
          half: "near",
          player: "host",
          scales,
          shots: enriched.filter((s) => s.stroke === "Serve" && s.player === "host"),
          sizeRange: [0.3, 0.88],
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
      {
        id: "guest-zones",
        label: guestLast,
        render: ({ scales }) => React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          colorScale: "count",
          gridsize: 7,
          half: "near",
          player: "guest",
          scales,
          shots: enriched.filter((s) => s.stroke === "Serve" && s.player === "guest"),
          sizeRange: [0.3, 0.88],
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
    ],
    cols: 2,
    half: "near",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: `${hostLast} density` },
      { color: GUEST_COLOR, label: `${guestLast} density` },
      { color: surfaceColor(surface), label: "Wide · Body · T" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    slideCount,
    slideIndex,
    stats: [
      {
        accent: HOST_COLOR,
        label: hostTop ? `${hostLast} ${hostTop.side} ${hostTop.zone}` : `${hostLast} top`,
        value: hostTop?.winRate != null ? pct(hostTop.winRate) : "—",
      },
      { accent: HOST_COLOR, label: `${hostLast} T share`, value: zoneShareLabel(hostZones, "t") },
      {
        accent: GUEST_COLOR,
        label: guestTop ? `${guestLast} ${guestTop.side} ${guestTop.zone}` : `${guestLast} top`,
        value: guestTop?.winRate != null ? pct(guestTop.winRate) : "—",
      },
      { accent: GUEST_COLOR, label: `${guestLast} T share`, value: zoneShareLabel(guestZones, "t") },
    ],
    subtitle: "Wide · body · T heat · top zone win%",
    title: "Serve zones",
  });
}

function renderMultiCourtShell(opts) {
  const {
    branding,
    cells,
    cols = 2,
    half = "near",
    legend,
    slideCount,
    slideIndex,
    stats = [],
    subtitle,
    title,
  } = opts;
  const layout = benchLayout();
  const frameLayout = benchFrameLayoutProps();
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const kpiStats = stats.slice(0, 4);
  const LABEL_H = 30;
  const gap = 14;
  const legendH = legend ? 44 : 0;
  const statsH = kpiStats.length ? 72 : 0;
  const rows = Math.ceil(cells.length / cols);
  const cellW = (contentW - gap * (cols - 1)) / cols;
  const aspect = half === "full" ? COURT_PLOT_ASPECT : COURT_NEAR_ASPECT;
  // Courts are width-limited: size from cell width, then center the whole
  // courts+legend+stats stack vertically so slack never pools between bands.
  const courtHFromW = cellW / aspect;
  const extrasH = legendH + statsH + (legendH ? gap : 0) + (statsH ? gap : 0);
  const availCourtsH = contentH - extrasH;
  const maxSlotH = rows > 0
    ? (availCourtsH - gap * (rows - 1)) / rows
    : courtHFromW + LABEL_H;
  const slotH = Math.min(LABEL_H + courtHFromW, Math.max(LABEL_H + 120, maxSlotH));
  const courtHFit = Math.max(100, slotH - LABEL_H);
  const courtWFit = Math.min(cellW, courtHFit * aspect);
  const gridH = rows * slotH + gap * (rows - 1);
  const stackY = Math.max(0, (contentH - gridH - extrasH) / 2);
  const gridY = stackY;
  const legendY = gridY + gridH + gap;
  const statsY = (legend ? legendY + legendH : gridY + gridH) + gap;

  return React.createElement(
    FigureFrame,
    {
      background: BENCH_BG_MID,
      branding,
      ...frameLayout,
      showBaselineRule: true,
      showSlideIndex: false,
      slideCount,
      slideIndex,
      subtitle,
      theme: benchTheme,
      title,
    },
    React.createElement(
      "g",
      null,
      cells.map((cell, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x0 = col * (cellW + gap) + (cellW - courtWFit) / 2;
        const y0 = gridY + row * (slotH + gap);
        const box = courtBox(courtWFit, courtHFit, aspect);
        const scales = createCourtScales({ width: box.width, height: box.height, half, margin: 1.5 });
        return React.createElement(
          "g",
          { key: cell.id ?? `cell-${i}`, transform: `translate(${x0}, ${y0})` },
          React.createElement(
            "text",
            {
              dominantBaseline: "middle",
              fill: "#64748B",
              fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              textAnchor: "middle",
              x: courtWFit / 2,
              y: LABEL_H / 2,
            },
            cell.label,
          ),
          React.createElement(
            "g",
            { transform: `translate(${box.x}, ${LABEL_H + box.y})` },
            benchCourt(`bench-multi-${cell.id ?? i}`, {
              clipChildren: cell.clipChildren,
              half,
              height: box.height,
              surface: cell.surface,
              theme: benchTheme,
              width: box.width,
            }, cell.render({ courtH: box.height, courtW: box.width, scales })),
          ),
        );
      }),
      legend
        ? React.createElement("g", { transform: `translate(0, ${legendY})` }, legend)
        : null,
      kpiStats.length
        ? kpiStats.map((stat, i) => {
          const statW = (contentW - gap * (kpiStats.length - 1)) / kpiStats.length;
          const x = i * (statW + gap);
          return React.cloneElement(
            statCard(x, statsY + 4, statW, 64, stat.value, stat.label, stat.accent),
            { key: `kpi-${i}-${stat.label}` },
          );
        })
        : null,
    ),
  );
}

function renderHeadToHeadCourts(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const hostIn = enriched.filter((s) => s.player === "host" && s.result === "In");
  const guestIn = enriched.filter((s) => s.player === "guest" && s.result === "In");
  const hexOpts = { half: "near", gridsize: 9, minCount: 2, sizeRange: [0.4, 0.7] };
  const vmax = Math.max(
    maxHexCount(hostIn, hexOpts),
    maxHexCount(guestIn, hexOpts),
  );
  const pointsWon = duelStatByKey(fixture, "points_won");

  return renderMultiCourtShell({
    branding,
    cells: [
      {
        id: "host",
        label: lastName(fixture.featured.hostName),
        render: ({ scales }) => React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          haloWidth: 0,
          minCount: 2,
          player: "host",
          scales,
          shots: enriched,
          sizeRange: [0.4, 0.7],
          theme: benchTheme,
          useHalfCourtNormalization: true,
          valueDomain: { vmax, vmin: 0 },
        }),
        surface,
      },
      {
        id: "guest",
        label: lastName(fixture.featured.guestName),
        render: ({ scales }) => React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          haloWidth: 0,
          minCount: 2,
          player: "guest",
          scales,
          shots: enriched,
          sizeRange: [0.4, 0.7],
          theme: benchTheme,
          useHalfCourtNormalization: true,
          valueDomain: { vmax, vmin: 0 },
        }),
        surface,
      },
    ],
    cols: 2,
    half: "near",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} · denser` },
      { color: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} · denser` },
    ], { orientation: "horizontal", swatchSize: 10 }),
    slideCount,
    slideIndex,
    stats: [
      { accent: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} pts`, value: formatDuelPct(pointsWon?.host) },
      { accent: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} pts`, value: formatDuelPct(pointsWon?.guest) },
      { accent: HOST_COLOR, label: "Host In", value: String(hostIn.length) },
      { accent: GUEST_COLOR, label: "Guest In", value: String(guestIn.length) },
    ],
    subtitle: "Side-by-side density · shared color scale",
    title: "Head to head",
  });
}

function renderMatchDna(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const serves = enriched.filter((s) => s.stroke === "Serve");
  const winners = [...pointEndingWinners(enriched, "host"), ...pointEndingWinners(enriched, "guest")];
  const errors = [...plottableOutErrors(enriched), ...pinNetErrors(enriched)];
  const deep = enriched.filter((s) => depthBand(s) === "deep");
  const pointsWon = duelStatByKey(fixture, "points_won");
  const accuracy = duelStatByKey(fixture, "shot_accuracy");
  const hostLast = lastName(fixture.featured.hostName);
  const guestLast = lastName(fixture.featured.guestName);

  return renderMultiCourtShell({
    branding,
    cells: [
      {
        id: "serve",
        label: "Serve",
        render: ({ scales }) => React.createElement(DotLayer, {
          ...BENCH_DOT_SNAPSHOT,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: serves,
          strokeFilter: ["Serve"],
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
      {
        id: "winners",
        label: "Point ends",
        render: ({ scales }) => React.createElement(DotLayer, {
          ...BENCH_DOT_ERRORS,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: winners,
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
      {
        clipChildren: false,
        id: "errors",
        label: "Errors",
        render: ({ scales }) => React.createElement(DotLayer, {
          ...BENCH_DOT_ERRORS,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: errors,
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
      {
        id: "depth",
        label: "Deep",
        render: ({ scales }) => React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          haloWidth: 0,
          scales,
          shots: deep,
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
    ],
    cols: 2,
    half: "near",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: hostLast },
      { color: GUEST_COLOR, label: guestLast },
    ], { orientation: "horizontal", swatchSize: 10 }),
    slideCount,
    slideIndex,
    stats: [
      { accent: HOST_COLOR, label: `${hostLast} pts`, value: formatDuelPct(pointsWon?.host) },
      { accent: GUEST_COLOR, label: `${guestLast} pts`, value: formatDuelPct(pointsWon?.guest) },
      { accent: HOST_COLOR, label: `${hostLast} acc`, value: formatDuelPct(accuracy?.host) },
      { accent: GUEST_COLOR, label: `${guestLast} acc`, value: formatDuelPct(accuracy?.guest) },
    ],
    subtitle: "Serve · point endings · errors · depth",
    title: "Match DNA",
  });
}

function renderStrokeDotsFor(player, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture).filter((s) => s.player === player);
  const name = lastName(playerName(fixture, player));
  const fh = enriched.filter((s) => s.stroke === "Forehand").length;
  const bh = enriched.filter((s) => s.stroke === "Backhand").length;
  const volleyN = enriched.filter((s) => (s.stroke || "").includes("Volley")).length;
  const accuracy = duelStatByKey(fixture, "shot_accuracy");
  const accuracyVal = player === "guest" ? accuracy?.guest : accuracy?.host;

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, strokeLegendItems(["forehand", "backhand", "volley"]), { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      return benchCourt(`bench-stroke-${player}`, { height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(DotLayer, {
          ...BENCH_DOT_STROKE,
          colorBy: "stroke",
          highContrast: true,
          player,
          scales,
          shots: enriched.filter((s) => s.stroke !== "Serve"),
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: DOT_HC_STROKE.forehand, label: "Forehand", value: String(fh) },
      { accent: DOT_HC_STROKE.backhand, label: "Backhand", value: String(bh) },
      { accent: DOT_HC_STROKE.volley, label: "Volley", value: String(volleyN) },
      { accent: playerColor(player), label: "Accuracy", value: formatDuelPct(accuracyVal) },
    ],
    subtitle: `${name}'s groundstrokes · serve maps live in Serve`,
    title: "Shot placement",
  });
}

const DIR_CC = "#0047FF";
/** Violet — distinct from guest orange and clay. */
const DIR_DTL = "#8B5CF6";
const DIR_INSIDE = "#10B981";
const DIR_OTHER = "#94A3B8";

function directionDotLayer(shots, scales, fill, { alpha = 0.72, haloWidth = 0.9, size = 5.25 } = {}) {
  return shots
    .filter((s) => hasValidSpatialCoords(s))
    .map((s, i) => {
      const [x, y] = normalizeShot(s.bounceX, s.bounceY, s.hitY);
      const cx = scales.x(x);
      const cy = scales.y(y);
      const kids = [];
      if (haloWidth > 0) {
        kids.push(React.createElement("circle", {
          cx, cy,
          fill: "none",
          key: "halo",
          opacity: alpha * 0.7,
          r: size + haloWidth + 0.5,
          stroke: "#FAF6EE",
          strokeWidth: haloWidth + 0.5,
        }));
      }
      kids.push(React.createElement("circle", {
        cx, cy,
        fill,
        key: "dot",
        opacity: alpha,
        r: size,
      }));
      return React.createElement("g", { key: `${fill}-${i}` }, ...kids);
    });
}

function renderStrokeMap(stroke, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture).filter(
    (s) => s.stroke === stroke && s.result === "In",
  );
  function cellFor(player) {
    const shots = enriched.filter((s) => s.player === player);
    const cc = shots.filter((s) => matchDirection(s, "crosscourt"));
    const dtl = shots.filter((s) => matchDirection(s, "dtl"));
    const inside = shots.filter((s) => matchDirection(s, "inside"));
    const other = shots.filter(
      (s) => !matchDirection(s, "crosscourt") && !matchDirection(s, "dtl") && !matchDirection(s, "inside"),
    );
    return {
      id: player,
      label: lastName(playerName(fixture, player)),
      render: ({ scales }) => React.createElement(
        React.Fragment,
        null,
        ...directionDotLayer(other, scales, DIR_OTHER, { alpha: 0.35, size: 3.5 }),
        ...directionDotLayer(inside, scales, DIR_INSIDE, { alpha: 0.7, size: 5 }),
        ...directionDotLayer(cc, scales, DIR_CC),
        ...directionDotLayer(dtl, scales, DIR_DTL),
      ),
      surface,
    };
  }

  function dirPct(player, kind) {
    const shots = enriched.filter((s) => s.player === player);
    if (!shots.length) return "—";
    const n = shots.filter((s) => matchDirection(s, kind)).length;
    return pct(n / shots.length);
  }

  const hostLast = lastName(fixture.featured.hostName);
  const guestLast = lastName(fixture.featured.guestName);

  return renderMultiCourtShell({
    branding,
    cells: [cellFor("host"), cellFor("guest")],
    half: "near",
    legend: legendRow(0, 0, [
      { color: DIR_CC, label: "Crosscourt" },
      { color: DIR_DTL, label: "Down the line" },
      { color: DIR_INSIDE, label: "Inside-out / in" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    slideCount,
    slideIndex,
    stats: [
      { accent: DIR_CC, label: `${hostLast} CC`, value: dirPct("host", "crosscourt") },
      { accent: DIR_DTL, label: `${hostLast} DTL`, value: dirPct("host", "dtl") },
      { accent: DIR_CC, label: `${guestLast} CC`, value: dirPct("guest", "crosscourt") },
      { accent: DIR_DTL, label: `${guestLast} DTL`, value: dirPct("guest", "dtl") },
    ],
    subtitle: `${enriched.length} ${stroke.toLowerCase()}s · color = direction`,
    title: `${stroke} map`,
  });
}

function matchDirection(shot, kind) {
  const d = (shot.direction || "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const compact = d.replace(/\s+/g, "");
  if (kind === "crosscourt") return compact.includes("cross");
  // Explicit DTL only — do not treat serve "down the T" as down-the-line.
  if (kind === "dtl") {
    return compact.includes("downtheline") || compact === "dtl" || d.includes("down the line");
  }
  if (kind === "inside") return compact.includes("inside");
  return false;
}

/** Legend swatches for RayLayer flowMode (stroke = efficiency / point win rate). */
function winRateFlowLegendItems() {
  const d = benchTheme.diverging;
  return [
    { color: d.low, label: "Low win %" },
    { color: d.midLight, label: "Mid" },
    { color: d.peak, label: "High win %" },
  ];
}

function renderFlow(directionLabel, kind, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const all = enrichedFromFixture(fixture);
  const shots = all.filter((s) => s.stroke !== "Serve" && matchDirection(s, kind));
  const hasFlows = shots.length > 0;

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, hasFlows
      ? winRateFlowLegendItems()
      : [{ color: BENCH_BLUE, label: "No labeled flows" }], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      return benchCourt(`bench-flow-${kind}`, { height: courtH, surface, theme: benchTheme, width: courtW },
        hasFlows
          ? React.createElement(RayLayer, {
            alpha: 0.55,
            curved: true,
            flowMaxWidth: 10,
            flowMinCount: shots.length >= 8 ? 2 : 1,
            flowMode: true,
            highContrast: true,
            scales,
            shots,
            showHitDots: false,
            theme: benchTheme,
          })
          : React.createElement(
            "text",
            {
              fill: "#64748B",
              fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              textAnchor: "middle",
              x: courtW / 2,
              y: courtH / 2,
            },
            `No ${directionLabel.toLowerCase()} labels in this match`,
          ),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: BENCH_BLUE, label: directionLabel, value: String(shots.length) },
      { accent: HOST_COLOR, label: lastName(fixture.featured.hostName), value: String(shots.filter((s) => s.player === "host").length) },
      { accent: GUEST_COLOR, label: lastName(fixture.featured.guestName), value: String(shots.filter((s) => s.player === "guest").length) },
    ],
    subtitle: hasFlows
      ? `${directionLabel} · color = point win rate · width ∝ count`
      : `${directionLabel} · no labeled shots to plot`,
    title: directionLabel,
  });
}

function renderDepthBandsSlide(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture).filter((s) => s.result === "In" && s.bounceY != null);
  const depthHost = depthCounts(enriched, "host");
  const depthGuest = depthCounts(enriched, "guest");
  const total = Math.max(enriched.length, 1);

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, [
      { color: "#93C5FD", label: "Short band" },
      { color: "#3B82F6", label: "Mid band" },
      { color: "#0047FF", label: "Deep band" },
      { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
      { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      return benchCourt("bench-depth-bands", { height: courtH, surface, theme: benchTheme, width: courtW },
        ...depthBandRects(scales),
        React.createElement(DotLayer, {
          ...BENCH_DOT_SNAPSHOT,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: enriched,
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: "#93C5FD", label: "Short", value: pct((depthHost.short + depthGuest.short) / total) },
      { accent: "#3B82F6", label: "Mid", value: pct((depthHost.mid + depthGuest.mid) / total) },
      { accent: "#0047FF", label: "Deep", value: pct((depthHost.deep + depthGuest.deep) / total) },
    ],
    subtitle: "Bands = depth · dots = player",
    title: "Depth bands",
  });
}

function renderDepthAngleSlide(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const deep = enriched.filter((s) => depthBand(s) === "deep");
  const io = enriched.filter((s) => matchDirection(s, "inside"));
  const depthHost = depthCounts(enriched, "host");
  const depthGuest = depthCounts(enriched, "guest");

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
      { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
      ...winRateFlowLegendItems(),
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      const deepOnlyRects = depthBandRects(scales).filter((el) => String(el.key || "").startsWith("deep-"));
      return benchCourt("bench-depth-angle", { height: courtH, surface, theme: benchTheme, width: courtW },
        ...deepOnlyRects,
        React.createElement(DotLayer, {
          ...BENCH_DOT_STROKE,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: deep,
          theme: benchTheme,
        }),
        io.length
          ? React.createElement(RayLayer, {
            alpha: 0.5,
            curved: true,
            flowMaxWidth: 10,
            flowMinCount: 1,
            flowMode: true,
            highContrast: true,
            scales,
            shots: io,
            showHitDots: false,
            theme: benchTheme,
          })
          : null,
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} deep`, value: String(depthHost.deep) },
      { accent: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} deep`, value: String(depthGuest.deep) },
      { accent: BENCH_BLUE, label: "IO / II rays", value: String(io.length) },
    ],
    subtitle: "Deep dots · IO/II rays = point win rate",
    title: "Depth & angle",
  });
}

function renderServePlusOneSlide(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const plusOneShots = enriched.filter((s) => {
    if (s.shotNumber !== 3 || s.stroke === "Serve" || s.result !== "In") return false;
    const key = `${s.setNumber}-${s.gameNumber}-${s.pointNumber}`;
    const serve = enriched.find((x) =>
      `${x.setNumber}-${x.gameNumber}-${x.pointNumber}` === key
      && x.stroke === "Serve"
      && ((x.type || "").toLowerCase().includes("first"))
      && x.result === "In"
      && x.player === "host",
    );
    return Boolean(serve);
  });
  const hostS1 = fixture.patternStats?.host?.servePlusOne || [];
  const fhStat = hostS1.find((r) => String(r.stroke || "").toLowerCase() === "forehand");
  const bhStat = hostS1.find((r) => String(r.stroke || "").toLowerCase() === "backhand");
  const fhCount = plusOneShots.filter((s) => s.stroke === "Forehand").length;
  const bhCount = plusOneShots.filter((s) => s.stroke === "Backhand").length;

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, winRateFlowLegendItems(), {
      orientation: "horizontal",
      swatchSize: 10,
    }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      return benchCourt("bench-serve-plus-one", { height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(RayLayer, {
          alpha: 0.6,
          curved: true,
          flowMaxWidth: 10,
          flowMinCount: plusOneShots.length >= 8 ? 2 : 1,
          flowMode: true,
          highContrast: true,
          player: "host",
          scales,
          shots: plusOneShots,
          showHitDots: false,
          theme: benchTheme,
        }),
        React.createElement(DotLayer, {
          ...BENCH_DOT_SNAPSHOT,
          alpha: 0.45,
          colorBy: "stroke",
          player: "host",
          scales,
          shots: plusOneShots,
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: DOT_HC_STROKE.forehand, label: "FH win%", value: fhStat?.winRate != null ? pct(fhStat.winRate) : "—" },
      { accent: DOT_HC_STROKE.backhand, label: "BH win%", value: bhStat?.winRate != null ? pct(bhStat.winRate) : "—" },
      { accent: BENCH_BLUE, label: "3rd balls", value: String(plusOneShots.length) },
      { accent: HOST_COLOR, label: "FH · BH", value: `${fhCount} · ${bhCount}` },
    ],
    subtitle: "First-serve +1 · rays = win% · dots = landing",
    title: "Serve +1",
  });
}

function renderFastestServeSlide(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const record = (fixture.records || []).find((r) => r.labelKey === "fastestServe");
  const player = record?.playerSide || "guest";
  const serves = enriched.filter((s) => s.player === player && s.stroke === "Serve" && s.speedKmh != null);
  let maxShot = null;
  for (const s of serves) {
    if (!maxShot || s.speedKmh > maxShot.speedKmh) maxShot = s;
  }
  const maxKmh = Math.round(maxShot?.speedKmh ?? Number.parseFloat(record?.value) ?? 0);

  const serveKind = record?.serveType === "second" ? "2nd serve" : "1st serve";

  return renderCourtSlideShell({
    branding,
    half: "near",
    legend: legendRow(0, 0, [
      { color: playerColor(player), label: "Larger = faster" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "near", margin: 1.5 });
      return benchCourt("bench-fastest-serve", { half: "near", height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(ServeLayer, {
          alpha: 0.45,
          courtSurface: surface,
          highContrast: true,
          includeFaults: false,
          player,
          scales,
          shots: enriched,
          size: 4,
          sizeBy: "speed",
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: BENCH_BLUE, label: "Max speed", value: `${maxKmh} km/h` },
      { accent: playerColor(player), label: lastName(record?.playerName || playerName(fixture, player)), value: serveKind },
      { accent: surfaceColor(surface), label: "Tracked", value: String(serves.length) },
    ],
    subtitle: record ? `${record.playerName} · top tracked serve` : "Top tracked serve speed",
    title: "Fastest serve",
  });
}

function renderMomentumCourts(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const ends = lastShotsOfPoints(enriched);
  const set1 = ends.filter((s) => s.setNumber === 1);
  const set2 = ends.filter((s) => s.setNumber === 2);
  const hostSet1 = set1.filter((s) => s.pointWinner === "host").length;
  const hostSet2 = set2.filter((s) => s.pointWinner === "host").length;

  return renderMultiCourtShell({
    branding,
    cells: [
      {
        id: "set1",
        label: "Set 1 point endings",
        render: ({ scales }) => React.createElement(DotLayer, {
          ...BENCH_DOT_STROKE,
          alpha: 0.55,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: asPointWinnerDots(set1),
          size: 4,
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
      {
        id: "set2",
        label: "Set 2 point endings",
        render: ({ scales }) => React.createElement(DotLayer, {
          ...BENCH_DOT_STROKE,
          alpha: 0.55,
          colorBy: "player",
          highContrast: true,
          scales,
          shots: asPointWinnerDots(set2),
          size: 4,
          theme: benchTheme,
          useHalfCourtNormalization: true,
        }),
        surface,
      },
    ],
    cols: 2,
    half: "near",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} won` },
      { color: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} won` },
    ], { orientation: "horizontal", swatchSize: 10 }),
    slideCount,
    slideIndex,
    stats: [
      { accent: HOST_COLOR, label: "Set 1 host pts", value: String(hostSet1) },
      { accent: GUEST_COLOR, label: "Set 1 guest", value: String(set1.length - hostSet1) },
      { accent: HOST_COLOR, label: "Set 2 host pts", value: String(hostSet2) },
      { accent: GUEST_COLOR, label: "Set 2 guest", value: String(set2.length - hostSet2) },
    ],
    subtitle: "Point winners by set on court",
    title: "Momentum",
  });
}

function renderDotSubset(opts) {
  const {
    alleyShots,
    branding,
    clipChildren = true,
    colorBy = "player",
    dotProps = BENCH_DOT_STROKE,
    fixture,
    half = "full",
    legendItems,
    shots,
    slideCount,
    slideIndex,
    stats,
    subtitle,
    title,
    useHalfCourtNormalization = false,
  } = opts;
  const surface = surfaceOf(fixture);
  const hasAlley = Array.isArray(alleyShots) && alleyShots.length > 0;

  return renderCourtSlideShell({
    branding,
    half,
    legend: legendRow(0, 0, legendItems, { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half, margin: 1.5 });
      const layers = [];
      if (hasAlley) {
        layers.push(React.createElement(DotLayer, {
          ...BENCH_DOT_ERRORS,
          alpha: 0.35,
          colorBy,
          key: "alley",
          scales,
          shots: alleyShots,
          theme: benchTheme,
          useHalfCourtNormalization,
        }));
      }
      layers.push(React.createElement(DotLayer, {
        ...dotProps,
        colorBy,
        key: "main",
        scales,
        shots,
        theme: benchTheme,
        useHalfCourtNormalization,
      }));
      return benchCourt(`bench-${title.replace(/\s+/g, "-").toLowerCase()}`, {
        clipChildren,
        half,
        height: courtH,
        surface,
        theme: benchTheme,
        width: courtW,
      }, ...layers);
    },
    slideCount,
    slideIndex,
    stats,
    subtitle,
    title,
  });
}

function renderHexSubset(opts) {
  const {
    accent: accentOverride,
    branding,
    colorScale = "count",
    fixture,
    half = "full",
    hexProps = {},
    /** When omitted, bin all players (set density). Pass "host"|"guest" to scope. */
    player,
    shots,
    slideCount,
    slideIndex,
    stats,
    subtitle,
    title,
    valueDomain,
  } = opts;
  const surface = surfaceOf(fixture);
  // Unscoped density uses host blue so legend matches getCountColor peak (#3B82F6).
  const accent = accentOverride ?? (player ? playerColor(player) : HOST_COLOR);
  const scoped = player === "host" || player === "guest";

  return renderCourtSlideShell({
    branding,
    half,
    legend: legendRow(0, 0, [{ color: accent, label: colorScale === "speed" ? "Faster" : "Higher density" }], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half, margin: 1.5 });
      return benchCourt(`bench-hex-${title.replace(/\s+/g, "-").toLowerCase()}`, {
        half,
        height: courtH,
        surface,
        theme: benchTheme,
        width: courtW,
      },
      React.createElement(HexbinLayer, {
        ...BENCH_HEX_DENSITY,
        ...hexProps,
        colorScale,
        // Only pass player when scoped — undefined bins both sides.
        ...(scoped ? { player } : {}),
        scales,
        shots,
        theme: benchTheme,
        valueDomain,
      }),
      );
    },
    slideCount,
    slideIndex,
    stats,
    subtitle,
    title,
  });
}

const ZONE_LABELS = {
  ad: "Ad",
  ad_alley: "Ad alley",
  ad_deep: "Ad deep",
  ad_short: "Ad short",
  center_deep: "Center deep",
  center_line: "Middle",
  center_short: "Center short",
  deuce: "Deuce",
  deuce_alley: "Deuce alley",
  deuce_deep: "Deuce deep",
  deuce_out: "Deuce out",
  deuce_short: "Deuce short",
};

function zoneLabel(zoneId) {
  return ZONE_LABELS[zoneId] || String(zoneId || "").replace(/_/g, " ");
}

function renderZoneWinFor(player, fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const enriched = enrichedFromFixture(fixture);
  const zones = computeZoneWinRatesByPoint(enriched, player);
  const name = lastName(playerName(fixture, player));
  const plotted = [...zones].filter(
    (z) => z.winRate != null,
  );
  const ranked = [...plotted].sort((a, b) => b.winRate - a.winRate);
  const best = ranked[0];
  const weak = ranked[ranked.length - 1];

  return renderCourtSlideShell({
    branding,
    half: "near",
    legend: legendRow(0, 0, [
      { color: playerColor(player), label: "Darker = higher win %" },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "near", margin: 1.5 });
      return benchCourt(`bench-zone-${player}`, {
        clipChildren: false,
        half: "near",
        height: courtH,
        surface,
        theme: benchTheme,
        width: courtW,
      },
        React.createElement(ZoneWinRateLayer, {
          minSamples: 3,
          player,
          rects: BOUNCE_ZONE_GRID_3X2,
          scales,
          showLabels: true,
          theme: benchTheme,
          zones: plotted,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: playerColor(player), label: "Best", value: best ? `${zoneLabel(best.zone)} ${pct(best.winRate)}` : "—" },
      { accent: BENCH_BLUE, label: "Weak", value: weak ? `${zoneLabel(weak.zone)} ${pct(weak.winRate)}` : "—" },
      { accent: surfaceColor(surface), label: "Zones", value: String(plotted.length) },
    ],
    subtitle: `${name} — point win % by bounce zone`,
    title: "Zone win rate",
  });
}

function insightPlayer(insight) {
  const id = String(insight?.id || "");
  if (id.startsWith("guest-")) return "guest";
  if (id.startsWith("host-")) return "host";
  return "host";
}

function renderCoachInsight(index, fixture, branding, slideIndex, slideCount, matchCtx) {
  const enriched = matchCtx?.enrichedShots?.length
    ? matchCtx.enrichedShots
    : enrichedFromFixture(fixture);
  const points = matchCtx?.points || [];
  const insights = generateCoachInsights({
    enrichedShots: enriched,
    guestName: fixture.featured.guestName,
    hostName: fixture.featured.hostName,
    points,
  }, 6);
  const insight = insights[index] || insights[0];
  const surface = surfaceOf(fixture);
  const headline = insight?.headline || "Review the patterns";
  const player = insightPlayer(insight);
  const subjectName = lastName(playerName(fixture, player));
  const accent = playerColor(player);

  const vizKind = insight?.viz?.kind;
  const half = vizKind === "serve-zones" ? "near" : "full";

  const shortSub = headline.length > 80 ? headline.slice(0, 77) + "…" : headline;

  return renderCourtSlideShell({
    branding,
    half,
    legend: legendRow(0, 0, vizKind === "flow"
      ? [{ color: accent, label: subjectName }, ...winRateFlowLegendItems()]
      : [
        { color: accent, label: subjectName },
        { color: BENCH_BLUE, label: (insight?.category || "pattern").toUpperCase() },
      ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half, margin: 1.5 });
      const layers = [];
      if (vizKind === "serve-zones") {
        layers.push(React.createElement(ServeLayer, {
          alpha: 0.5,
          courtSurface: surface,
          highContrast: true,
          includeFaults: true,
          key: "serve",
          player,
          scales,
          shots: enriched,
          size: 4,
          theme: benchTheme,
        }));
      } else if (vizKind === "flow") {
        layers.push(React.createElement(RayLayer, {
          alpha: 0.55,
          curved: true,
          flowMaxWidth: 10,
          flowMinCount: 1,
          flowMode: true,
          highContrast: true,
          key: "flow",
          player,
          scales,
          shots: enriched.filter((s) => s.player === player && s.result === "In" && s.stroke !== "Serve"),
          showHitDots: false,
          theme: benchTheme,
        }));
      } else {
        layers.push(React.createElement(HexbinLayer, {
          ...BENCH_HEX_DENSITY,
          key: "hex",
          player,
          scales,
          shots: enriched,
          theme: benchTheme,
        }));
      }
      return React.createElement(
        "g",
        null,
        benchCourt(`bench-coach-${index}`, {
          half,
          height: courtH,
          surface,
          theme: benchTheme,
          width: courtW,
        }, ...layers),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent, label: "Player", value: subjectName },
      { accent: BENCH_BLUE, label: "Category", value: (insight?.category || "pattern").toUpperCase() },
      { accent, label: "Key metric", value: insight?.metric || "—" },
    ],
    subtitle: shortSub,
    title: "Coach insight",
  });
}

function renderLongestRallySlide(fixture, branding, slideIndex, slideCount) {
  const surface = surfaceOf(fixture);
  const record = (fixture.records || []).find((r) => r.labelKey === "longestRally");
  const shots = enrichedFromFixture(fixture).filter((s) =>
    record
    && s.setNumber === record.rallySet
    && s.gameNumber === record.rallyGame
    && (record.rallyPoint == null || s.pointNumber === record.rallyPoint),
  );
  const mapped = shots.length
    ? shots
    : enrichedFromFixture(fixture).filter((s) => (s.rallyLength ?? 0) >= Number(record?.value || 0));
  const value = record?.value != null ? String(record.value) : String(mapped[0]?.rallyLength ?? "—");

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend: legendRow(0, 0, [
      { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
      { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
    ], { orientation: "horizontal", swatchSize: 10 }),
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
      return benchCourt("bench-longest-rally", { height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(DotLayer, {
          ...BENCH_DOT_STROKE,
          colorBy: "player",
          scales,
          shots: mapped,
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: [
      { accent: BENCH_BLUE, label: "Shots", value },
      { accent: HOST_COLOR, label: "Set", value: record?.rallySet != null ? String(record.rallySet) : "—" },
      { accent: GUEST_COLOR, label: "Game", value: record?.rallyGame != null ? String(record.rallyGame) : "—" },
    ],
    subtitle: record
      ? `Set ${record.rallySet} · Game ${record.rallyGame}${record.rallyPoint != null ? ` · Point ${record.rallyPoint}` : ""}`
      : "Most shots in a single point",
    title: "Longest rally",
  });
}

// ---------------------------------------------------------------------------
// Public builders map
// ---------------------------------------------------------------------------

function createBuilders(ctx) {
  const { branding, fixture, matchCtx, slideCount, slideIndex } = ctx;
  const enriched = enrichedFromFixture(fixture);
  const surface = surfaceOf(fixture);
  const helpers = require("./bench-post-helpers.cjs");

  const winnersHost = pointEndingWinners(enriched, "host");
  const winnersGuest = pointEndingWinners(enriched, "guest");
  const errorsOut = plottableOutErrors(enriched);
  const { alley: errorsOutAlley, trueOut: errorsOutTrue } = splitAlleyOutErrors(errorsOut);
  const errorsNet = pinNetErrors(enriched);
  const depthHost = depthCounts(enriched, "host");
  const depthGuest = depthCounts(enriched, "guest");
  const ioShots = enriched.filter((s) => {
    const d = (s.direction || "").toLowerCase();
    return d.includes("inside");
  });
  // Approaches / at-net groundstrokes only — volleys belong on volley-map.
  const approach = enriched.filter((s) => {
    const stroke = (s.stroke || "").toLowerCase();
    if (stroke.includes("volley") || stroke === "serve") return false;
    return stroke.includes("approach")
      || (s.hitY != null && Math.abs(s.hitY - NET_Y) < 3 && s.stroke !== "Serve");
  });
  const volleys = pinVolleyContacts(
    enriched.filter((s) => (s.stroke || "").toLowerCase().includes("volley")),
  );
  const firstStrikeEnds = lastShotsOfPoints(enriched).filter((s) => (s.rallyLength ?? 99) <= 4);
  const bpShots = enriched.filter((s) => s.isBreakPoint);
  const clutch = enriched.filter((s) => s.isBreakPoint || s.isSetPoint || s.isMatchPoint);
  const hostPattern = fixture.patternStats?.host || computePatternStats(enriched, "host");
  const servePlusOne = enriched.filter((s) => s.shotNumber === 3 && s.stroke !== "Serve");
  const returns = enriched.filter((s) => s.shotNumber === 2);

  return {
    "approach-net": () => {
      const contacts = pinApproachNetContacts(approach);
      const inN = contacts.filter((s) => s.result === "In").length;
      const netN = contacts.filter((s) => s.result === "Net").length;
      const outN = contacts.filter((s) => s.result === "Out").length;
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "result",
        half: "full",
        legendItems: contacts.length
          ? [
            { color: "#10B981", label: "In" },
            { color: "#EF4444", label: "Out" },
            { color: "#F59E0B", label: "Net (tape)" },
          ]
          : [{ color: BENCH_BLUE, label: "No approach / at-net shots" }],
        shots: contacts,
        stats: [
          { accent: BENCH_BLUE, label: "Approaches", value: String(contacts.length) },
          { accent: "#10B981", label: "In / Net / Out", value: `${inN} · ${netN} · ${outN}` },
          { accent: DOT_HC_STROKE.volley, label: "Volleys (see map)", value: String(volleys.length) },
        ],
        subtitle: contacts.length
          ? "Approach / at-net contact · volleys on Volley map"
          : "No approach / at-net contacts in this match",
        title: "Approach & net",
      });
    },
    "backhand-map": () => renderStrokeMap("Backhand", fixture, branding, slideIndex, slideCount),
    "break-points-court": () => {
      const bpEnds = bpShots.length ? lastShotsOfPoints(bpShots) : [];
      const breakConv = duelStatByKey(fixture, "break_conv");
      const hostLast = lastName(fixture.featured.hostName);
      const guestLast = lastName(fixture.featured.guestName);
      // Color by point winner (who converted / saved), not shot result.
      const winnerDots = bpEnds.map((s) => ({
        ...s,
        player: s.pointWinner === "guest" ? "guest" : "host",
      }));
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        half: "full",
        legendItems: [
          { color: HOST_COLOR, label: `${hostLast} won` },
          { color: GUEST_COLOR, label: `${guestLast} won` },
        ],
        shots: winnerDots,
        stats: [
          { accent: HOST_COLOR, label: `${hostLast} BP conv`, value: formatDuelPct(breakConv?.host) },
          { accent: GUEST_COLOR, label: `${guestLast} BP conv`, value: formatDuelPct(breakConv?.guest) },
          { accent: HOST_COLOR, label: `${hostLast} converted`, value: formatWonTotal(breakConv?.hostWon, breakConv?.hostTotal) },
          { accent: GUEST_COLOR, label: `${guestLast} converted`, value: formatWonTotal(breakConv?.guestWon, breakConv?.guestTotal) },
        ],
        subtitle: "Return and finish locations under pressure",
        title: "Break points",
      });
    },
    "clutch-points": () => {
      const hostLast = lastName(fixture.featured.hostName);
      const guestLast = lastName(fixture.featured.guestName);
      const hostBpSaved = officialStatValue(fixture, "host", "Break Points Saved");
      const guestBpSaved = officialStatValue(fixture, "guest", "Break Points Saved");
      // "Break Points" = faced as server (save denominator).
      const hostBpFaced = officialStatValue(fixture, "host", "Break Points");
      const guestBpFaced = officialStatValue(fixture, "guest", "Break Points");
      const ends = clutch.length ? lastShotsOfPoints(clutch) : lastShotsOfPoints(enriched);
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: `${hostLast} won` },
          { color: GUEST_COLOR, label: `${guestLast} won` },
          { color: "#64748B", label: "Color = point winner" },
        ],
        shots: asPointWinnerDots(ends),
        stats: [
          {
            accent: HOST_COLOR,
            label: `${hostLast} BP saved`,
            value: hostBpSaved != null && hostBpFaced != null
              ? formatWonTotal(hostBpSaved, hostBpFaced)
              : hostBpSaved != null ? String(hostBpSaved) : "—",
          },
          {
            accent: GUEST_COLOR,
            label: `${guestLast} BP saved`,
            value: guestBpSaved != null && guestBpFaced != null
              ? formatWonTotal(guestBpSaved, guestBpFaced)
              : guestBpSaved != null ? String(guestBpSaved) : "—",
          },
          { accent: BENCH_BLUE, label: "SP/MP ends", value: String(ends.filter((s) => s.isSetPoint || s.isMatchPoint).length) },
        ],
        subtitle: "Break · set · match point endings",
        title: "Clutch points",
      });
    },
    "coach-insight-1": () => renderCoachInsight(0, fixture, branding, slideIndex, slideCount, matchCtx),
    "coach-insight-2": () => renderCoachInsight(1, fixture, branding, slideIndex, slideCount, matchCtx),
    "coach-insight-3": () => renderCoachInsight(2, fixture, branding, slideIndex, slideCount, matchCtx),
    "court-insight": () => helpers.renderFeaturedInsight(fixture, branding, slideIndex, slideCount),
    "cover": () => helpers.renderCover(fixture, branding, slideIndex, slideCount),
    "crosscourt-flows": () => renderFlow("Crosscourt", "crosscourt", fixture, branding, slideIndex, slideCount),
    "cta": () => helpers.renderCta(fixture, branding, slideIndex, slideCount),
    "cta-court": () => renderHexSubset({
      accent: HOST_COLOR,
      branding, fixture, slideIndex, slideCount,
      half: "full",
      shots: enriched.filter((s) => s.result === "In"),
      stats: [],
      subtitle: "Sign up free → peakperformancedata.app",
      title: "Every shot. Mapped.",
    }),
    "depth-angle": () => renderDepthAngleSlide(fixture, branding, slideIndex, slideCount),
    "depth-bands": () => renderDepthBandsSlide(fixture, branding, slideIndex, slideCount),
    "down-the-line-flows": () => renderFlow("Down the line", "dtl", fixture, branding, slideIndex, slideCount),
    "errors-net": () => renderDotSubset({
      branding, fixture, slideIndex, slideCount,
      clipChildren: false,
      colorBy: "player",
      dotProps: BENCH_DOT_ERRORS,
      half: "near",
      legendItems: [
        { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
        { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
      ],
      shots: errorsNet,
      stats: [
        { accent: BENCH_BLUE, label: "Net errors", value: String(errorsNet.length) },
        { accent: HOST_COLOR, label: lastName(fixture.featured.hostName), value: String(errorsNet.filter((s) => s.player === "host").length) },
        { accent: GUEST_COLOR, label: lastName(fixture.featured.guestName), value: String(errorsNet.filter((s) => s.player === "guest").length) },
      ],
      subtitle: "Point-ending nets · pinned near tape",
      title: "Net errors",
      useHalfCourtNormalization: true,
    }),
    "errors-out": () => renderDotSubset({
      alleyShots: errorsOutAlley,
      branding, fixture, slideIndex, slideCount,
      clipChildren: false,
      colorBy: "player",
      dotProps: BENCH_DOT_ERRORS,
      half: "full",
      legendItems: [
        { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
        { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
        { color: "#94A3B8", label: "Alley (muted)" },
      ],
      shots: errorsOutTrue,
      stats: [
        { accent: BENCH_BLUE, label: "Out errors", value: String(errorsOut.length) },
        { accent: HOST_COLOR, label: lastName(fixture.featured.hostName), value: String(errorsOut.filter((s) => s.player === "host").length) },
        { accent: GUEST_COLOR, label: lastName(fixture.featured.guestName), value: String(errorsOut.filter((s) => s.player === "guest").length) },
      ],
      subtitle: "Outside singles · alley muted",
      title: "Out errors",
    }),
    "fastest-serve": () => renderFastestServeSlide(fixture, branding, slideIndex, slideCount),
    "featured-story": () => helpers.renderFeaturedMatch(fixture, branding, slideIndex, slideCount),
    "first-strike-court": () => {
      const guestPattern = fixture.patternStats?.guest || computePatternStats(enriched, "guest");
      const hostLast = lastName(fixture.featured.hostName);
      const guestLast = lastName(fixture.featured.guestName);
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: `${hostLast} won` },
          { color: GUEST_COLOR, label: `${guestLast} won` },
          { color: "#64748B", label: "Color = point winner" },
        ],
        shots: asPointWinnerDots(firstStrikeEnds),
        stats: [
          { accent: HOST_COLOR, label: `${hostLast} FS win`, value: pct(hostPattern.firstStrike?.rate) },
          { accent: GUEST_COLOR, label: `${guestLast} FS win`, value: pct(guestPattern.firstStrike?.rate) },
          { accent: BENCH_BLUE, label: "≤4-shot ends", value: String(firstStrikeEnds.length) },
        ],
        subtitle: "Point endings in four shots or fewer",
        title: "First strike",
      });
    },
    "forehand-map": () => renderStrokeMap("Forehand", fixture, branding, slideIndex, slideCount),
    "head-to-head-courts": () => renderHeadToHeadCourts(fixture, branding, slideIndex, slideCount),
    "inside-out-in": () => (ioShots.length
      ? renderFlow("Inside-out / in", "inside", fixture, branding, slideIndex, slideCount)
      : renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [{ color: BENCH_BLUE, label: "No IO/II labels" }],
        shots: [],
        stats: [
          { accent: BENCH_BLUE, label: "IO / II", value: "0" },
          { accent: HOST_COLOR, label: "Host aggr", value: `${fixture.depthAggression?.host?.aggressionPct ?? "—"}%` },
          { accent: GUEST_COLOR, label: "Guest aggr", value: `${fixture.depthAggression?.guest?.aggressionPct ?? "—"}%` },
        ],
        subtitle: "No inside-out / inside-in labels in this match",
        title: "Inside-out / in",
      })),
    "longest-rally": () => renderLongestRallySlide(fixture, branding, slideIndex, slideCount),
    "match-dna": () => renderMatchDna(fixture, branding, slideIndex, slideCount),
    "match-snapshot": () => helpers.renderMatchSnapshot(fixture, branding, slideIndex, slideCount),
    "momentum-court": () => renderMomentumCourts(fixture, branding, slideIndex, slideCount),
    "rally-long": () => {
      const ends = filterRallyBucket(enriched, 7, null);
      const hostWr = fixture.rallyBuckets?.host?.find((b) => b.bucket === "7+")?.winRate;
      const guestWr = fixture.rallyBuckets?.guest?.find((b) => b.bucket === "7+")?.winRate;
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
          { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
          { color: "#64748B", label: "Color = point winner" },
        ],
        shots: asPointWinnerDots(ends),
        stats: [
          { accent: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} win%`, value: hostWr != null ? pct(hostWr) : "—" },
          { accent: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} win%`, value: guestWr != null ? pct(guestWr) : "—" },
          { accent: BENCH_BLUE, label: "7+ ends", value: String(ends.length) },
        ],
        subtitle: "Where each 7+ shot point ended",
        title: "Long rallies",
      });
    },
    "rally-medium": () => {
      const ends = filterRallyBucket(enriched, 4, 6);
      const hostWr = fixture.rallyBuckets?.host?.find((b) => b.bucket === "4-6")?.winRate;
      const guestWr = fixture.rallyBuckets?.guest?.find((b) => b.bucket === "4-6")?.winRate;
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
          { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
          { color: "#64748B", label: "Color = point winner" },
        ],
        shots: asPointWinnerDots(ends),
        stats: [
          { accent: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} win%`, value: hostWr != null ? pct(hostWr) : "—" },
          { accent: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} win%`, value: guestWr != null ? pct(guestWr) : "—" },
          { accent: BENCH_BLUE, label: "4–6 ends", value: String(ends.length) },
        ],
        subtitle: "Where each 4–6 shot point ended",
        title: "Medium rallies",
      });
    },
    "rally-short": () => {
      const ends = filterRallyBucket(enriched, 1, 3);
      const hostWr = fixture.rallyBuckets?.host?.find((b) => b.bucket === "1-3")?.winRate;
      const guestWr = fixture.rallyBuckets?.guest?.find((b) => b.bucket === "1-3")?.winRate;
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: lastName(fixture.featured.hostName) },
          { color: GUEST_COLOR, label: lastName(fixture.featured.guestName) },
          { color: "#64748B", label: "Color = point winner" },
        ],
        shots: asPointWinnerDots(ends),
        stats: [
          { accent: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} win%`, value: hostWr != null ? pct(hostWr) : "—" },
          { accent: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} win%`, value: guestWr != null ? pct(guestWr) : "—" },
          { accent: BENCH_BLUE, label: "1–3 ends", value: String(ends.length) },
        ],
        subtitle: "Where each 1–3 shot point ended",
        title: "Short rallies",
      });
    },
    "return-placement": () => {
      const guestPattern = fixture.patternStats?.guest || computePatternStats(enriched, "guest");
      const hostLast = lastName(fixture.featured.hostName);
      const guestLast = lastName(fixture.featured.guestName);
      const hostRpw = officialReturnPointsWon(fixture, "host");
      const guestRpw = officialReturnPointsWon(fixture, "guest");
      const hostDeep = deepShare(returns.filter((s) => s.player === "host"));
      const guestDeep = deepShare(returns.filter((s) => s.player === "guest"));
      return renderDotSubset({
        branding, fixture, half: "near", slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: hostLast },
          { color: GUEST_COLOR, label: guestLast },
        ],
        shots: returns,
        stats: [
          { accent: HOST_COLOR, label: `${hostLast} RPW`, value: hostRpw ? pct(hostRpw.rate) : pct(hostPattern.returnInPlay?.rate) },
          { accent: GUEST_COLOR, label: `${guestLast} RPW`, value: guestRpw ? pct(guestRpw.rate) : pct(guestPattern.returnInPlay?.rate) },
          { accent: HOST_COLOR, label: `${hostLast} deep`, value: hostDeep != null ? pct(hostDeep) : "—" },
          { accent: GUEST_COLOR, label: `${guestLast} deep`, value: guestDeep != null ? pct(guestDeep) : "—" },
        ],
        subtitle: "Where returns land · official RPW · deep share",
        title: "Return placement",
        useHalfCourtNormalization: true,
      });
    },
    "serve-1st-vs-2nd": () => renderServe1stVs2nd(fixture, branding, slideIndex, slideCount),
    "serve-map-guest": () => renderServeMapFor("guest", fixture, branding, slideIndex, slideCount),
    "serve-map-host": () => renderServeMapFor("host", fixture, branding, slideIndex, slideCount),
    "serve-plus-one": () => renderServePlusOneSlide(fixture, branding, slideIndex, slideCount),
    "serve-speed-court-guest": () => renderServeSpeedCourt("guest", fixture, branding, slideIndex, slideCount),
    "serve-speed-court-host": () => renderServeSpeedCourt("host", fixture, branding, slideIndex, slideCount),
    "serve-zones-heat": () => renderServeZonesHeat(fixture, branding, slideIndex, slideCount),
    "set-1-density": () => {
      const set1 = filterBySet(enriched, 1);
      const set2 = filterBySet(enriched, 2);
      const set1In = set1.filter((s) => s.result === "In");
      const hexOpts = { gridsize: 7, sizeRange: [0.28, 0.92] };
      const vmax = Math.max(maxHexCount(set1, hexOpts), maxHexCount(set2, hexOpts));
      return renderHexSubset({
        accent: "#1D4ED8",
        branding, fixture, slideIndex, slideCount,
        half: "full",
        hexProps: {
          alpha: 0.9,
          gridsize: 7,
          haloWidth: 0.4,
          minCount: 1,
          sizeRange: [0.28, 0.92],
        },
        // Both players — do not scope to host (KPI is full-set In count).
        shots: set1,
        stats: [
          { accent: HOST_COLOR, label: "In shots", value: String(set1In.length) },
          { accent: HOST_COLOR, label: "Host In", value: String(set1In.filter((s) => s.player === "host").length) },
          { accent: GUEST_COLOR, label: "Guest In", value: String(set1In.filter((s) => s.player === "guest").length) },
        ],
        subtitle: "Both players · shared scale with Set 2",
        title: "Set 1 density",
        valueDomain: { vmax, vmin: 0 },
      });
    },
    "set-2-density": () => {
      const set1 = filterBySet(enriched, 1);
      const set2 = filterBySet(enriched, 2);
      const set2In = set2.filter((s) => s.result === "In");
      const hexOpts = { gridsize: 7, sizeRange: [0.28, 0.92] };
      const vmax = Math.max(maxHexCount(set1, hexOpts), maxHexCount(set2, hexOpts));
      return renderHexSubset({
        accent: "#1D4ED8",
        branding, fixture, slideIndex, slideCount,
        half: "full",
        hexProps: {
          alpha: 0.9,
          gridsize: 7,
          haloWidth: 0.4,
          minCount: 1,
          sizeRange: [0.28, 0.92],
        },
        shots: set2,
        stats: [
          { accent: HOST_COLOR, label: "In shots", value: String(set2In.length) },
          { accent: HOST_COLOR, label: "Host In", value: String(set2In.filter((s) => s.player === "host").length) },
          { accent: GUEST_COLOR, label: "Guest In", value: String(set2In.filter((s) => s.player === "guest").length) },
        ],
        subtitle: "Both players · shared scale with Set 1",
        title: "Set 2 density",
        valueDomain: { vmax, vmin: 0 },
      });
    },
    "stroke-dots-guest": () => renderStrokeDotsFor("guest", fixture, branding, slideIndex, slideCount),
    "stroke-dots-host": () => renderStrokeDotsFor("host", fixture, branding, slideIndex, slideCount),
    "territory-guest": () => renderTerritoryFor("guest", fixture, branding, slideIndex, slideCount),
    "territory-host": () => renderTerritoryFor("host", fixture, branding, slideIndex, slideCount),
    "top-points": () => {
      function leverageRank(s) {
        if (s.isMatchPoint) return 3;
        if (s.isSetPoint) return 2;
        if (s.isBreakPoint) return 1;
        return 0;
      }
      const pool = clutch.length ? clutch : enriched;
      const ends = lastShotsOfPoints(pool)
        .sort((a, b) => leverageRank(b) - leverageRank(a) || (b.rallyLength ?? 0) - (a.rallyLength ?? 0))
        .slice(0, 24);
      const mp = ends.filter((s) => s.isMatchPoint).length;
      const sp = ends.filter((s) => s.isSetPoint && !s.isMatchPoint).length;
      const bp = ends.filter((s) => s.isBreakPoint && !s.isSetPoint && !s.isMatchPoint).length;
      return renderDotSubset({
        branding, fixture, slideIndex, slideCount,
        colorBy: "player",
        legendItems: [
          { color: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} won` },
          { color: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} won` },
          { color: "#64748B", label: "Ranked MP › SP › BP" },
        ],
        shots: asPointWinnerDots(ends),
        stats: [
          { accent: BENCH_BLUE, label: "Match pts", value: String(mp) },
          { accent: HOST_COLOR, label: "Set pts", value: String(sp) },
          { accent: GUEST_COLOR, label: "Break pts", value: String(bp) },
          { accent: BENCH_BLUE, label: "Mapped", value: String(ends.length) },
        ],
        subtitle: "Highest-leverage endings · MP › SP › BP",
        title: "Top points",
      });
    },
    "volley-map": () => renderDotSubset({
      branding, fixture, half: "full", slideIndex, slideCount,
      clipChildren: false,
      colorBy: "result",
      dotProps: BENCH_DOT_VOLLEYS,
      legendItems: [
        { color: "#10B981", label: "In" },
        { color: "#EF4444", label: "Out" },
        { color: "#F59E0B", label: "Net (tape)" },
      ],
      shots: volleys,
      stats: [
        { accent: DOT_HC_STROKE.volley, label: "Volleys", value: String(volleys.length) },
        { accent: HOST_COLOR, label: lastName(fixture.featured.hostName), value: String(volleys.filter((s) => s.player === "host").length) },
        { accent: GUEST_COLOR, label: lastName(fixture.featured.guestName), value: String(volleys.filter((s) => s.player === "guest").length) },
      ],
      subtitle: "Contact points · full court · nets near tape",
      title: "Volley map",
      useHalfCourtNormalization: false,
    }),
    "winners-guest": () => renderDotSubset({
      branding, fixture, slideIndex, slideCount,
      colorBy: "stroke",
      dotProps: BENCH_DOT_ERRORS,
      legendItems: strokeLegendItems(["forehand", "backhand", "volley"]),
      shots: winnersGuest,
      stats: winnersKpis(fixture, "guest", winnersGuest, GUEST_COLOR),
      subtitle: "Guest last In shot · Official W/UE below",
      title: "Point endings",
    }),
    "winners-host": () => renderDotSubset({
      branding, fixture, slideIndex, slideCount,
      colorBy: "stroke",
      dotProps: BENCH_DOT_ERRORS,
      legendItems: strokeLegendItems(["forehand", "backhand", "volley"]),
      shots: winnersHost,
      stats: winnersKpis(fixture, "host", winnersHost, HOST_COLOR),
      subtitle: "Host last In shot · Official W/UE below",
      title: "Point endings",
    }),
    "zone-win-guest": () => renderZoneWinFor("guest", fixture, branding, slideIndex, slideCount),
    "zone-win-host": () => renderZoneWinFor("host", fixture, branding, slideIndex, slideCount),

    // ── Extra analysis slides ──
    "momentum-swing": () => {
      const points = matchCtx?.points || [];
      const surface = surfaceOf(fixture);
      const hostLast = lastName(fixture.featured.hostName);
      const guestLast = lastName(fixture.featured.guestName);

      // Find longest consecutive winning streak for each player
      function longestStreak(player) {
        let bestStart = 0, bestLen = 0, curStart = 0, curLen = 0;
        for (let i = 0; i < points.length; i++) {
          if (points[i].pointWinner === player) {
            if (curLen === 0) curStart = i;
            curLen++;
            if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
          } else {
            curLen = 0;
          }
        }
        return { length: bestLen, start: bestStart, end: bestStart + bestLen - 1 };
      }

      const hostStreak = longestStreak("host");
      const guestStreak = longestStreak("guest");

      // Get point-ending shots for the streak periods
      const ends = lastShotsOfPoints(enriched);
      function streakShots(streak, player) {
        if (streak.length === 0) return [];
        const streakPoints = new Set();
        for (let i = streak.start; i <= streak.end; i++) {
          const p = points[i];
          if (p) streakPoints.add(`${p.setNumber}-${p.gameNumber}-${p.pointNumber}`);
        }
        return ends.filter((s) =>
          streakPoints.has(`${s.setNumber}-${s.gameNumber}-${s.pointNumber}`)
          && s.pointWinner === player,
        );
      }

      const hostShots = asPointWinnerDots(streakShots(hostStreak, "host"));
      const guestShots = asPointWinnerDots(streakShots(guestStreak, "guest"));

      // Streak context: set/game where streak started
      const streakCtx = (streak) => {
        if (streak.length === 0) return "—";
        const p = points[streak.start];
        return p ? `S${p.setNumber} G${p.gameNumber}` : "—";
      };

      return renderMultiCourtShell({
        branding,
        cells: [
          {
            id: "host-streak",
            label: `${hostLast} streak`,
            render: ({ scales }) => React.createElement(DotLayer, {
              ...BENCH_DOT_STROKE,
              alpha: 0.65,
              colorBy: "player",
              highContrast: true,
              scales,
              shots: hostShots,
              size: 5,
              theme: benchTheme,
              useHalfCourtNormalization: true,
            }),
            surface,
          },
          {
            id: "guest-streak",
            label: `${guestLast} streak`,
            render: ({ scales }) => React.createElement(DotLayer, {
              ...BENCH_DOT_STROKE,
              alpha: 0.65,
              colorBy: "player",
              highContrast: true,
              scales,
              shots: guestShots,
              size: 5,
              theme: benchTheme,
              useHalfCourtNormalization: true,
            }),
            surface,
          },
        ],
        cols: 2,
        half: "near",
        legend: legendRow(0, 0, [
          { color: HOST_COLOR, label: `${hostLast} won` },
          { color: GUEST_COLOR, label: `${guestLast} won` },
        ], { orientation: "horizontal", swatchSize: 10 }),
        slideCount,
        slideIndex,
        stats: [
          { accent: HOST_COLOR, label: `${hostLast} streak`, value: String(hostStreak.length) },
          { accent: HOST_COLOR, label: "Start", value: streakCtx(hostStreak) },
          { accent: GUEST_COLOR, label: `${guestLast} streak`, value: String(guestStreak.length) },
          { accent: GUEST_COLOR, label: "Start", value: streakCtx(guestStreak) },
        ],
        subtitle: "Longest consecutive point streaks on court",
        title: "Momentum swing",
      });
    },
    "hex-efficiency": () => {
      const hostZones = computeZoneWinRatesByPoint(enriched, "host");
      const guestZones = computeZoneWinRatesByPoint(enriched, "guest");
      return renderMultiCourtShell({
        branding,
        cells: [
          {
            id: "host-eff",
            label: lastName(fixture.featured.hostName),
            render: ({ scales }) => React.createElement(ZoneWinRateLayer, {
              minSamples: 3,
              player: "host",
              rects: BOUNCE_ZONE_GRID_3X2,
              scales,
              showLabels: true,
              theme: benchTheme,
              zones: hostZones,
            }),
          },
          {
            id: "guest-eff",
            label: lastName(fixture.featured.guestName),
            render: ({ scales }) => React.createElement(ZoneWinRateLayer, {
              minSamples: 3,
              player: "guest",
              rects: BOUNCE_ZONE_GRID_3X2,
              scales,
              showLabels: true,
              theme: benchTheme,
              zones: guestZones,
            }),
          },
        ],
        cols: 1,
        half: "near",
        legend: legendRow(0, 0, [
          { color: HOST_COLOR, label: "Host win%" },
          { color: GUEST_COLOR, label: "Guest win%" },
        ], { orientation: "horizontal", swatchSize: 10 }),
        slideCount,
        slideIndex,
        stats: [
          { accent: HOST_COLOR, label: "Host zones", value: String(hostZones.length) },
          { accent: GUEST_COLOR, label: "Guest zones", value: String(guestZones.length) },
        ],
        subtitle: "Win % by court zone · stacked near courts",
        title: "Hex efficiency",
      });
    },
    "zone-bars": () => {
      const hostZones = computeZoneWinRatesByPoint(enriched, "host");
      const guestZones = computeZoneWinRatesByPoint(enriched, "guest");
      const hostLast = lastName(fixture.featured.hostName);
      const guestLast = lastName(fixture.featured.guestName);
      const hostRanked = [...hostZones].sort((a, b) => b.winRate - a.winRate);
      const guestRanked = [...guestZones].sort((a, b) => b.winRate - a.winRate);
      return renderMultiCourtShell({
        branding,
        cells: [
          {
            id: "host-zb",
            label: hostLast,
            render: ({ scales }) => React.createElement(ZoneWinRateLayer, {
              minSamples: 3,
              player: "host",
              rects: BOUNCE_ZONE_GRID_3X2,
              scales,
              showLabels: true,
              theme: benchTheme,
              zones: hostRanked,
            }),
          },
          {
            id: "guest-zb",
            label: guestLast,
            render: ({ scales }) => React.createElement(ZoneWinRateLayer, {
              minSamples: 3,
              player: "guest",
              rects: BOUNCE_ZONE_GRID_3X2,
              scales,
              showLabels: true,
              theme: benchTheme,
              zones: guestRanked,
            }),
          },
        ],
        cols: 1,
        half: "near",
        legend: legendRow(0, 0, [
          { color: HOST_COLOR, label: `${hostLast} win%` },
          { color: GUEST_COLOR, label: `${guestLast} win%` },
        ], { orientation: "horizontal", swatchSize: 10 }),
        slideCount,
        slideIndex,
        stats: [
          { accent: HOST_COLOR, label: hostLast, value: hostRanked[0] ? pct(hostRanked[0].winRate) : "—" },
          { accent: GUEST_COLOR, label: guestLast, value: guestRanked[0] ? pct(guestRanked[0].winRate) : "—" },
          { accent: BENCH_BLUE, label: "Zones", value: String(hostRanked.length + guestRanked.length) },
        ],
        subtitle: "Point win % by bounce zone · stacked courts",
        title: "Zone bars",
      });
    },
    "serve-diamond": () => {
      const surface = surfaceOf(fixture);
      const serves = enriched.filter((s) => s.stroke === "Serve" && s.result === "In");
      const hostFsir = computeFirstServeInRate(enriched, "host");
      const guestFsir = computeFirstServeInRate(enriched, "guest");
      const hostSwr = computeServePointsWonRate(enriched, "host");
      const guestSwr = computeServePointsWonRate(enriched, "guest");
      return renderCourtSlideShell({
        branding,
        half: "full",
        legend: legendRow(0, 0, [
          { color: HOST_COLOR, label: `${lastName(fixture.featured.hostName)} serves` },
          { color: GUEST_COLOR, label: `${lastName(fixture.featured.guestName)} serves` },
        ], { orientation: "horizontal", swatchSize: 10 }),
        renderCourt: ({ courtH, courtW }) => {
          const scales = createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 });
          return benchCourt("bench-serve-diamond", {
            height: courtH,
            surface,
            theme: benchTheme,
            width: courtW,
          },
            React.createElement(ServeLayer, {
              alpha: 0.55,
              courtSurface: surface,
              highContrast: true,
              includeFaults: false,
              scales,
              shots: serves,
              size: 5,
              theme: benchTheme,
            }),
          );
        },
        slideCount,
        slideIndex,
        stats: [
          { accent: HOST_COLOR, label: "Host 1st%", value: pct(hostFsir?.rate) },
          { accent: GUEST_COLOR, label: "Guest 1st%", value: pct(guestFsir?.rate) },
          { accent: HOST_COLOR, label: "Host won%", value: pct(hostSwr?.rate) },
          { accent: GUEST_COLOR, label: "Guest won%", value: pct(guestSwr?.rate) },
        ],
        subtitle: "Serve placement · both players on court",
        title: "Serve diamond",
      });
    },
    "error-profile": () => {
      const outErrors = enriched.filter((s) => s.result === "Out" && s.bounceX != null && s.bounceY != null);
      const netErrors = enriched.filter((s) => s.result === "Net");
      const totalErrors = outErrors.length + netErrors.length;
      return renderDotSubset({
        branding,
        clipChildren: false,
        colorBy: "stroke",
        dotProps: BENCH_DOT_ERRORS,
        fixture,
        half: "full",
        legendItems: [
          { color: "#EF4444", label: "Out errors" },
          { color: "#F59E0B", label: "Net errors" },
        ],
        shots: outErrors,
        slideCount,
        slideIndex,
        stats: [
          { accent: BENCH_BLUE, label: "Total errors", value: String(totalErrors) },
          { accent: "#EF4444", label: "Out", value: String(outErrors.length) },
          { accent: "#F59E0B", label: "Net", value: String(netErrors.length) },
          { accent: HOST_COLOR, label: "Host errors", value: String(outErrors.filter((s) => s.player === "host").length + netErrors.filter((s) => s.player === "host").length) },
        ],
        subtitle: "Out errors on court · net errors by stroke",
        title: "Error profile",
      });
    },
  };
}

module.exports = {
  createBuilders,
};
