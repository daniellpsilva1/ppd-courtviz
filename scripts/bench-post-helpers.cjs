/**
 * Bench social post slide renderers — portrait 4:5 (1080×1350) templates.
 *
 * Style: Opta Analyst / Untold Arena — one big claim per slide, oversized number,
 * short supporting line, court graphic or compact chart, brand mark + slide index.
 */

const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const React = require("react");
const {
  ColorBar,
  CourtSurface,
  DotLayer,
  FigureFrame,
  HexbinLayer,
  Legend,
  MomentumChart,
  ServeLayer,
  ZoneWinRateLayer,
} = require("@courtviz/react");
const {
  resolveFrameLayout,
  layoutBands,
  createCourtScales,
  normalizeShot,
  SINGLES_HALF,
  COURT_LENGTH,
  DOUBLES_HALF,
  NET_Y,
  courtYBounds,
  measureSvgText,
  truncateText,
  MIN_SAMPLE,
  computeMomentum,
  computeServeZones,
  computeZoneWinRates,
  computeRallyBucketStats,
  computePatternStats,
} = require("@courtviz/core");
const { ppdEditorial, ppd, getPlayerColor, getSurfaceColor, getSurfaceColorLight } = require("@courtviz/themes");
const { socialFormats, brandDefaults } = require("@ppd/tokens");

const BENCH_BLUE = "#0047FF";
const BENCH_NAVY = "#0A1833";
const BENCH_BG_TOP = "#E4EDFF";
const BENCH_BG_MID = "#EEF4FF";
const BENCH_BG_BOT = "#E8F0FF";
const CARD_FILL = "#DCE8FF";
const CARD_STROKE = "#C7D7F5";
const benchTheme = { ...ppdEditorial, background: BENCH_BG_MID };
const benchCourtTheme = { ...ppdEditorial, background: BENCH_BG_MID };
const GUEST_COLOR = "#F97316";
const HOST_COLOR = "#3B82F6";
const INK_MUTED = "#64748B";
const INK_SUBTLE = "#94A3B8";
const NEGATIVE_COLOR = "#EF4444";
const POSITIVE_COLOR = "#10B981";
const SURFACE_CLAY = "#C97B4E";
const SURFACE_HARD = "#2E5A88";
const SURFACE_GRASS = "#6B9E5A";
const WARNING_COLOR = "#F59E0B";
const STROKE_COLORS = { backhand: "#2563EB", forehand: "#3B82F6", serve: "#A855F7", volley: "#10B981" };
const SPIN_COLORS = { flat: "#64748B", kick: "#A855F7", slice: "#06B6D4", topspin: "#3B82F6" };

/** Shared spacing rhythm for RTM bench posts (matches slides 03–05). */
const BENCH_FORMAT = "portrait";
const BENCH_GAP = 14;
const BENCH_PANEL_PAD = 8;
const BENCH_LEGEND_H = 44;
const BENCH_STATS_ROW_H = 72;
const BENCH_FOOTER_H = 64;
/** Typical FigureFrame title+subtitle+baseline for single-line deck titles. */
const BENCH_TITLE_CHROME_H = 91;
/** Court band floor so letterboxing never collapses the hero court. */
const BENCH_COURT_MIN_H = 420;
const BENCH_MAX_STATS = 4;
const COURT_MARGIN = 1.5;
/** Full-court plot aspect (width/height) including margin — doubles width × court length. */
const COURT_PLOT_ASPECT = (DOUBLES_HALF * 2 + COURT_MARGIN * 2) / (COURT_LENGTH + COURT_MARGIN * 2);
/** Near-half aspect — fills portrait width (~0.94) and avoids full-court side gutters. */
const COURT_NEAR_ASPECT = (DOUBLES_HALF * 2 + COURT_MARGIN * 2) / (NET_Y + COURT_MARGIN * 2);

/**
 * Resolve portrait layout shared by helpers and FigureFrame.
 * @param {{ untitled?: boolean }} [opts]
 */
function benchLayout(opts = {}) {
  const untitled = Boolean(opts.untitled);
  return resolveFrameLayout(BENCH_FORMAT, {
    footerHeight: BENCH_FOOTER_H,
    titleHeight: untitled ? 0 : BENCH_TITLE_CHROME_H,
  });
}

/** Props to keep FigureFrame on the same content box as `benchLayout`. */
function benchFrameLayoutProps(opts = {}) {
  const untitled = Boolean(opts.untitled);
  return {
    format: BENCH_FORMAT,
    layoutFooterHeight: BENCH_FOOTER_H,
    layoutTitleHeight: untitled ? 0 : BENCH_TITLE_CHROME_H,
  };
}

/**
 * Aspect-correct court rect centered in a band (avoids vertical squash).
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
function courtBox(bandW, bandH, aspect = COURT_PLOT_ASPECT) {
  let width = bandW;
  let height = width / aspect;
  if (height > bandH) {
    height = bandH;
    width = height * aspect;
  }
  return {
    height,
    width,
    x: (bandW - width) / 2,
    y: (bandH - height) / 2,
  };
}

/** Shared HexbinLayer props for density slides (darker = more shots, no count labels). */
const BENCH_HEX_DENSITY = {
  alpha: 0.90,
  clip: true,
  colorScale: "count",
  gridsize: 12,
  minCount: 1,
  showLabels: false,
  sizeRange: [0.40, 0.85],
};

/** Cover / match snapshot — dense fields stay readable without halo mush. */
const BENCH_DOT_SNAPSHOT = {
  alpha: 0.68,
  haloWidth: 0,
  size: 3.5,
};
/** Stroke / placement / rally maps. */
const BENCH_DOT_STROKE = {
  alpha: 0.72,
  haloWidth: 0.9,
  highContrast: true,
  size: 5.25,
};
/** Winners / errors / outs — stronger markers. */
const BENCH_DOT_ERRORS = {
  alpha: 0.62,
  haloWidth: 0.85,
  highContrast: true,
  size: 5,
};
/** Sparse volley contacts. */
const BENCH_DOT_VOLLEYS = {
  alpha: 0.78,
  haloWidth: 1.25,
  highContrast: true,
  size: 6.5,
};
/** @deprecated Prefer BENCH_DOT_SNAPSHOT / BENCH_DOT_STROKE. */
const BENCH_DOT_DENSITY = BENCH_DOT_SNAPSHOT;
const BENCH_ERROR_DOT_DENSITY = BENCH_DOT_ERRORS;

function formatNum(n) {
  return n.toLocaleString("en-US");
}

// ---------------------------------------------------------------------------
// Shared SVG primitives
// ---------------------------------------------------------------------------

function el(tag, props, ...children) {
  return React.createElement(tag, props, ...children);
}

function benchGradientDefs(id) {
  return el("defs", null,
    el("linearGradient", { id: `${id}-bg`, x1: 0, x2: 0, y1: 0, y2: 1 },
      el("stop", { offset: "0%", stopColor: BENCH_BG_TOP }),
      el("stop", { offset: "50%", stopColor: BENCH_BG_MID }),
      el("stop", { offset: "100%", stopColor: BENCH_BG_BOT }),
    ),
    el("radialGradient", { id: `${id}-glow`, cx: "50%", cy: "0%", r: "55%" },
      el("stop", { offset: "0%", stopColor: BENCH_BLUE, stopOpacity: 0.08 }),
      el("stop", { offset: "100%", stopColor: BENCH_BLUE, stopOpacity: 0 }),
    ),
  );
}

function benchBackground(layout, id) {
  return el("g", null,
    benchGradientDefs(id),
    rect(-layout.content.x, -layout.content.y, layout.width, layout.height, `url(#${id}-bg)`),
    rect(-layout.content.x, -layout.content.y, layout.width, layout.height, `url(#${id}-glow)`),
  );
}

function g(transform, ...children) {
  return el("g", { transform }, ...children);
}

/** Attach a React list key to a created element (stat cards, etc.). */
function withKey(element, key) {
  return React.cloneElement(element, { key });
}

function text(props, content) {
  return el("text", props, content);
}

function rect(x, y, w, h, fill, opts) {
  return el("rect", { fill, height: h, rx: opts?.rx ?? 0, width: w, x, y });
}

function statCard(x, y, w, h, value, label, accent) {
  const accentW = 4;
  const labelFontSize = 13;
  const labelFontFamily = "Inter, Helvetica Neue, Arial, sans-serif";
  const valueFontFamily = "Barlow Condensed, Arial Narrow, sans-serif";
  const maxLabelW = w - accentW - 16;
  const fittedLabel = truncateText(label, {
    fontFamily: labelFontFamily,
    fontSize: labelFontSize,
    fontWeight: 500,
    maxWidth: maxLabelW,
  });
  // Shrink-to-fit value: start at default size, reduce until it fits, then truncate.
  const maxValueW = w - accentW - 12;
  let valueFontSize = Math.min(40, h * 0.42);
  let valueText = String(value);
  const valueW = () => measureSvgText(valueText, { fontFamily: valueFontFamily, fontSize: valueFontSize, fontWeight: 700 });
  while (valueFontSize > 18 && valueW() > maxValueW) {
    valueFontSize -= 2;
  }
  if (valueW() > maxValueW) {
    valueText = truncateText(valueText, {
      fontFamily: valueFontFamily,
      fontSize: valueFontSize,
      fontWeight: 700,
      maxWidth: maxValueW,
    });
  }
  // Flat canvas: accent bar + type only — no nested CARD_FILL rectangle.
  return g(
    `translate(${x}, ${y})`,
    rect(0, 0, accentW, h, accent || BENCH_BLUE, { rx: 2 }),
    text({
      fill: BENCH_NAVY,
      fontFamily: valueFontFamily,
      fontSize: valueFontSize,
      fontWeight: 700,
      textAnchor: "middle",
      x: w / 2 + accentW / 2,
      y: h * 0.42,
    }, valueText),
    text({
      fill: INK_MUTED,
      fontFamily: labelFontFamily,
      fontSize: labelFontSize,
      fontWeight: 500,
      textAnchor: "middle",
      x: w / 2 + accentW / 2,
      y: h * 0.72,
    }, fittedLabel),
  );
}

function benchCourt(idPrefix, props, ...children) {
  return React.createElement(
    CourtSurface,
    {
      clipChildren: props.clipChildren,
      // Soft drop-shadow blurs supersampled PNG exports — off for all bench posts.
      disableShadow: props.disableShadow !== false,
      half: props.half || "full",
      height: props.height,
      idPrefix,
      surface: props.surface,
      theme: props.theme || benchTheme,
      width: props.width,
    },
    ...children,
  );
}

function accentForSide(side, index = 0) {
  if (side === "host") return HOST_COLOR;
  if (side === "guest") return GUEST_COLOR;
  if (side === "match") return BENCH_BLUE;
  const fallback = [HOST_COLOR, BENCH_BLUE, BENCH_BLUE, SURFACE_CLAY];
  return fallback[index] || BENCH_BLUE;
}

function duelRows(x, y, w, rows, hostName, guestName) {
  const rowH = 56;
  const gap = 10;
  const nameH = 22;
  const nodes = [
    text({
      fill: HOST_COLOR,
      fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
      fontSize: 16,
      fontWeight: 700,
      x,
      y: y + 14,
    }, hostName.split(" ").pop()),
    text({
      fill: GUEST_COLOR,
      fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
      fontSize: 16,
      fontWeight: 700,
      textAnchor: "end",
      x: x + w,
      y: y + 14,
    }, guestName.split(" ").pop()),
  ];
  rows.forEach((row, i) => {
    const top = y + nameH + 8 + i * (rowH + gap);
    const host = row.host ?? 0;
    const guest = row.guest ?? 0;
    const total = Math.max(host + guest, 0.001);
    const hostPct = host / total;
    const guestPct = guest / total;
    const center = x + w / 2;
    const barY = top + 28;
    const barH = 10;
    const hostWins = host >= guest;
    nodes.push(
      text({
        fill: INK_MUTED,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        textAnchor: "middle",
        x: center,
        y: top + 12,
      }, row.label),
      text({
        fill: hostWins ? HOST_COLOR : INK_MUTED,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 28,
        fontWeight: 700,
        x,
        y: top + 36,
      }, row.host == null ? "—" : `${row.host}${row.unit || ""}`),
      text({
        fill: !hostWins ? GUEST_COLOR : INK_MUTED,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 28,
        fontWeight: 700,
        textAnchor: "end",
        x: x + w,
        y: top + 36,
      }, row.guest == null ? "—" : `${row.guest}${row.unit || ""}`),
      rect(x, barY, w, barH, "#E2EAFD", { rx: 5 }),
      rect(center - (w / 2) * hostPct, barY, (w / 2) * hostPct, barH, HOST_COLOR, { rx: 5 }),
      rect(center, barY, (w / 2) * guestPct, barH, GUEST_COLOR, { rx: 5 }),
    );
  });
  return el("g", null, ...nodes);
}

function hBarChart(x, y, w, h, bars, opts) {
  const gap = opts?.gap ?? 8;
  const labelW = opts?.labelW ?? 120;
  const valueW = opts?.valueW ?? 60;
  const barAreaW = w - labelW - valueW;
  const maxVal = Math.max(...bars.map(b => b.value), 0.001);
  const titleH = opts?.titleH ?? 0;
  const availH = h - titleH;
  const barH = Math.min(opts?.barH ?? 24, Math.floor((availH - gap * (bars.length - 1)) / Math.max(bars.length, 1)));
  const children = [];
  bars.forEach((bar, i) => {
    const by = i * (barH + gap);
    const bw = (bar.value / maxVal) * barAreaW;
    children.push(
      text({
        fill: INK_MUTED,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 13,
        fontWeight: 500,
        textAnchor: "end",
        x: labelW - 8,
        y: by + barH * 0.7,
      }, bar.label),
      el("rect", {
        fill: "#E2EAFD",
        height: barH,
        rx: 5,
        width: barAreaW,
        x: labelW,
        y: by,
      }),
      el("rect", {
        fill: bar.color || BENCH_BLUE,
        height: barH,
        rx: 5,
        width: Math.max(bw, 2),
        x: labelW,
        y: by,
      }),
      text({
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 16,
        fontWeight: 700,
        textAnchor: "start",
        x: labelW + bw + 8,
        y: by + barH * 0.7,
      }, bar.displayValue || String(bar.value)),
    );
  });
  return g(`translate(${x}, ${y})`, ...children);
}

function legendRow(x, y, items, opts) {
  const swatch = opts?.swatchSize ?? 10;
  const gap = opts?.gap ?? 6;
  const fontSize = opts?.fontSize ?? 12;
  const itemGap = opts?.itemGap ?? 24;
  const fontFamily = "Inter, Helvetica Neue, Arial, sans-serif";
  const isHorizontal = opts?.orientation === "horizontal";
  const children = [];
  if (isHorizontal) {
    let cursorX = 0;
    items.forEach((item) => {
      const labelW = measureSvgText(item.label, { fontFamily, fontSize, fontWeight: 500 });
      children.push(
        el("rect", { fill: item.color, height: swatch, rx: 2, width: swatch, x: cursorX, y: 0 }),
        text({
          fill: INK_MUTED,
          fontFamily,
          fontSize,
          fontWeight: 500,
          x: cursorX + swatch + gap,
          y: swatch * 0.85,
        }, item.label),
      );
      cursorX += swatch + gap + labelW + itemGap;
    });
  } else {
    items.forEach((item, i) => {
      const itemY = i * (swatch + gap + 4);
      children.push(
        el("rect", { fill: item.color, height: swatch, rx: 2, width: swatch, x: 0, y: itemY }),
        text({
          fill: INK_MUTED,
          fontFamily,
          fontSize,
          fontWeight: 500,
          x: swatch + gap,
          y: swatch * 0.85 + itemY,
        }, item.label),
      );
    });
  }
  return g(`translate(${x}, ${y})`, ...children);
}

// ---------------------------------------------------------------------------
// Derived data helpers
// ---------------------------------------------------------------------------

function shotStats(shots) {
  const speeds = shots.map(s => s.speed_kmh).filter(v => v != null);
  const serves = shots.filter(s => s.stroke === "Serve");
  const serveSpeeds = serves.map(s => s.speed_kmh).filter(v => v != null);
  const inCount = shots.filter(s => s.result === "In").length;
  const outCount = shots.filter(s => s.result === "Out").length;
  const netCount = shots.filter(s => s.result === "Net").length;
  const firstServes = serves.filter(s => s.serve_number === 1 || s.serveNumber === 1);
  const firstServeIn = firstServes.filter(s => s.result === "In").length;
  return {
    avgServeSpeed: serveSpeeds.length ? Math.round(serveSpeeds.reduce((a, b) => a + b, 0) / serveSpeeds.length) : 0,
    avgSpeed: speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0,
    firstServePct: firstServes.length ? Math.round((firstServeIn / firstServes.length) * 100) : 0,
    inPct: Math.round((inCount / shots.length) * 100),
    maxSpeed: speeds.length ? Math.round(Math.max(...speeds)) : 0,
    netCount,
    outCount,
    serveCount: serves.length,
  };
}

function strokeBreakdown(shots) {
  const counts = {};
  shots.forEach(s => {
    const stroke = s.stroke || "Unknown";
    counts[stroke] = (counts[stroke] || 0) + 1;
  });
  const total = shots.length;
  return Object.entries(counts)
    .map(([stroke, count]) => ({
      color: STROKE_COLORS[stroke?.toLowerCase()] || INK_SUBTLE,
      displayValue: `${count} (${Math.round((count / total) * 100)}%)`,
      label: stroke,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);
}

function strokeWinRates(shots, player = null) {
  const byStroke = {};
  for (const s of shots) {
    if (player && s.player !== player) continue;
    const stroke = (s.stroke || "Unknown").toLowerCase();
    if (!byStroke[stroke]) byStroke[stroke] = { won: 0, total: 0, winRate: null };
    byStroke[stroke].total++;
    const pointWinner = s.pointWinner ?? s.point_winner ?? null;
    if (pointWinner != null && pointWinner === s.player) byStroke[stroke].won++;
  }
  for (const entry of Object.values(byStroke)) {
    entry.winRate = entry.total >= MIN_SAMPLE ? entry.won / entry.total : null;
  }
  return byStroke;
}

function directionBreakdown(shots) {
  const counts = {};
  shots.forEach(s => {
    const dir = s.direction || "Unknown";
    if (dir === "---") return;
    counts[dir] = (counts[dir] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .map(([dir, count]) => ({
      displayValue: `${Math.round((count / total) * 100)}%`,
      label: dir,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);
}

function rallyStats(shots) {
  const pointMap = new Map();
  for (const s of shots) {
    const key = `${s.set_number}-${s.game_number}-${s.point_number}`;
    const entry = pointMap.get(key) ?? { count: 0, shots: [] };
    entry.count = Math.max(entry.count, s.shot_number ?? 0);
    entry.shots.push(s);
    pointMap.set(key, entry);
  }
  const rallyLengths = [...pointMap.values()].map(e => e.count).filter(c => c > 0);
  if (rallyLengths.length === 0) return { avgRally: 0, longestRally: 0 };
  return {
    avgRally: (rallyLengths.reduce((a, b) => a + b, 0) / rallyLengths.length).toFixed(1),
    longestRally: Math.max(...rallyLengths),
  };
}

function winnersErrors(shots, player) {
  const playerShots = shots.filter(s => s.player === player);
  const errors = playerShots.filter(s => s.result === "Out" || s.result === "Net").length;
  const inCount = playerShots.filter(s => s.result === "In").length;
  return { errors, inCount, total: playerShots.length };
}

function serveZoneStats(shots, player) {
  const serves = shots.filter(s => s.player === player && s.stroke === "Serve" && s.result === "In" && s.bounce_x != null && s.bounce_y != null);
  if (serves.length === 0) return { topZone: "—", topZonePct: "—" };
  const zones = {};
  for (const s of serves) {
    const isDeuce = s.bounce_x > 0;
    const isT = Math.abs(s.bounce_x) < 1.5;
    const isWide = Math.abs(s.bounce_x) > 3;
    const zone = isT ? "T" : isWide ? "Wide" : "Body";
    const side = isDeuce ? "Deuce" : "Ad";
    const key = `${side} ${zone}`;
    zones[key] = (zones[key] || 0) + 1;
  }
  const sorted = Object.entries(zones).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { topZone: "—", topZonePct: "—" };
  const [topZone, count] = sorted[0];
  return { topZone, topZonePct: `${Math.round((count / serves.length) * 100)}%` };
}

function perPlayerSpeed(shots, player) {
  const speeds = shots.filter(s => s.player === player && s.speed_kmh != null).map(s => s.speed_kmh);
  if (speeds.length === 0) return 0;
  return Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);
}

const COURT_X_MIN = -DOUBLES_HALF - COURT_MARGIN;
const COURT_X_MAX = DOUBLES_HALF + COURT_MARGIN;
const COURT_Y_MIN = 0 - COURT_MARGIN;
const COURT_Y_MAX = COURT_LENGTH + COURT_MARGIN;

function isWithinCourtBounds(bounceX, bounceY) {
  if (bounceX == null || bounceY == null) return false;
  return bounceX >= COURT_X_MIN && bounceX <= COURT_X_MAX &&
    bounceY >= COURT_Y_MIN && bounceY <= COURT_Y_MAX;
}

function toEnrichedShots(shotPreview) {
  if (!shotPreview) return [];
  return shotPreview
    .filter((s) => isWithinCourtBounds(s.bounce_x ?? s.bounceX, s.bounce_y ?? s.bounceY))
    .map((s) => ({
      bounceDepth: s.bounce_depth ?? s.bounceDepth ?? null,
      bounceSide: s.bounce_side ?? s.bounceSide ?? null,
      bounceX: s.bounce_x ?? s.bounceX ?? null,
      bounceY: s.bounce_y ?? s.bounceY ?? null,
      bounceZone: s.bounce_zone ?? s.bounceZone ?? null,
      direction: s.direction ?? null,
      endedBy: s.ended_by ?? s.endedBy ?? null,
      gameNumber: s.game_number ?? s.gameNumber,
      hitDepth: s.hit_depth ?? s.hitDepth ?? null,
      hitSide: s.hit_side ?? s.hitSide ?? null,
      hitX: s.hit_x ?? s.hitX ?? null,
      hitY: s.hit_y ?? s.hitY ?? null,
      hitZ: s.hit_z ?? s.hitZ ?? null,
      hitZone: s.hit_zone ?? s.hitZone ?? null,
      isBreakPoint: Boolean(s.is_break_point ?? s.isBreakPoint),
      isMatchPoint: Boolean(s.is_match_point ?? s.isMatchPoint),
      isSetPoint: Boolean(s.is_set_point ?? s.isSetPoint),
      isTerminal: Boolean(
        s.is_terminal ?? s.isTerminal ?? (s.result === "Out" || s.result === "Net"),
      ),
      player: s.player,
      pointNumber: s.point_number ?? s.pointNumber,
      pointWinner: s.point_winner ?? s.pointWinner ?? null,
      rallyLength: s.rally_length ?? s.rallyLength ?? null,
      result: s.result ?? "In",
      setNumber: s.set_number ?? s.setNumber,
      shotNumber: s.shot_number ?? s.shotNumber,
      speedKmh: s.speed_kmh ?? s.speedKmh ?? null,
      spin: s.spin ?? null,
      stroke: s.stroke ?? null,
      type: s.type ?? null,
    }));
}

/**
 * Bench footer branding — official PPD logo PNG + one source line.
 * @param {{ logoHref?: string }} [overrides]
 */
function benchBranding(overrides = {}) {
  const { getLogoDataUri } = require("./logo-data.cjs");
  return {
    handle: brandDefaults.handle,
    logo: true,
    logoHref: overrides.logoHref ?? getLogoDataUri(),
    source: "Peak Performance Data",
  };
}

function resolveBranding(overrides = {}) {
  return benchBranding(overrides);
}

// ---------------------------------------------------------------------------
// Slide 1: Cover
// ---------------------------------------------------------------------------

function renderCover(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const layout = benchLayout({ untitled: true });
  const frameLayout = benchFrameLayoutProps({ untitled: true });
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const centerX = contentW / 2;
  const surface = featured.surface || "clay";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const surfaceLabel = surface.charAt(0).toUpperCase() + surface.slice(1);
  const matchDate = featured.matchDate || "";
  const dateLabel = matchDate ? new Date(matchDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "";
  const heroStats = featured.heroStats || [];
  const enrichedShots = toEnrichedShots(featured.shotPreview || []);

  const [eyebrowBand, namesBand, scoreBand, courtBand, statsBand, ctaBand] = layoutBands(contentH, [
    { id: "eyebrow", height: 28 },
    { id: "names", height: 88 },
    { id: "score", height: 60 },
    { id: "court", grow: true, minHeight: 460 },
    { id: "stats", height: 104 },
    { id: "cta", height: 32 },
  ], BENCH_GAP);

  const heroCols = Math.min(Math.max(heroStats.length, 1), 4);
  const statW = (contentW - BENCH_GAP * (heroCols - 1)) / heroCols;
  const statH = 64;
  const statGap = BENCH_GAP;
  const court = courtBox(contentW, courtBand.height);

  const scoreText = featured.setScore || "";
  const scoreW = measureSvgText(scoreText, {
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
    fontSize: 56,
    fontWeight: 700,
  });
  const hostNameW = measureSvgText(featured.hostName || "Host", {
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
    fontSize: 38,
    fontWeight: 700,
  });
  const guestNameW = measureSvgText(featured.guestName || "Guest", {
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
    fontSize: 38,
    fontWeight: 700,
  });
  const nameGap = 16;
  const totalNamesW = hostNameW + nameGap + guestNameW;
  const namesFit = totalNamesW <= contentW - 16;
  const nameFontSize = namesFit ? 38 : Math.max(22, Math.floor(38 * (contentW - 16) / totalNamesW));
  const truncatedHost = truncateText(featured.hostName || "Host", {
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
    fontSize: nameFontSize,
    fontWeight: 700,
    maxWidth: (contentW - 16) / 2 - nameGap,
  });
  const truncatedGuest = truncateText(featured.guestName || "Guest", {
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
    fontSize: nameFontSize,
    fontWeight: 700,
    maxWidth: (contentW - 16) / 2 - nameGap,
  });

  return React.createElement(
    FigureFrame,
    {
      background: BENCH_BG_MID,
      branding,
      ...frameLayout,
      showBaselineRule: false,
      showBrandingFooter: true,
      showSlideIndex: false,
      slideCount,
      slideIndex,
      theme: benchTheme,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, "bench-cover"),
      // Brand lockup: logo + handle at top-left
      g(`translate(16, ${eyebrowBand.y + 6})`,
        React.createElement("image", {
          height: 24,
          href: branding?.logoHref,
          preserveAspectRatio: "xMidYMid meet",
          width: 24,
          x: 0,
          y: 0,
        }),
        text({
          fill: BENCH_NAVY,
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          x: 32,
          y: 18,
        }, brandDefaults.handle),
      ),
      // Surface accent strip at top (inside band — no negative bleed)
      rect(0, eyebrowBand.y, contentW, 3, surfaceColor, { rx: 1 }),
      // Eyebrow: surface + date
      text({
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 3,
        textAnchor: "middle",
        x: centerX,
        y: eyebrowBand.y + 24,
      }, `${surfaceLabel.toUpperCase()} · ${dateLabel.toUpperCase()} · MATCH REPORT`),
      // Player names — stacked with clear vs gap
      text({
        fill: HOST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: nameFontSize,
        fontWeight: 700,
        letterSpacing: 0.5,
        textAnchor: "middle",
        x: centerX,
        y: namesBand.y + 32,
      }, truncatedHost),
      text({
        fill: INK_SUBTLE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        textAnchor: "middle",
        x: centerX,
        y: namesBand.y + 54,
      }, "vs"),
      text({
        fill: GUEST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: nameFontSize,
        fontWeight: 700,
        letterSpacing: 0.5,
        textAnchor: "middle",
        x: centerX,
        y: namesBand.y + 84,
      }, truncatedGuest),
      // Oversized hero score (font fits inside taller score band)
      text({
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 56,
        fontWeight: 700,
        letterSpacing: 2,
        textAnchor: "middle",
        x: centerX,
        y: scoreBand.y + 48,
      }, scoreText),
      // Surface color underline beneath score
      rect(centerX - scoreW / 2 - 4, scoreBand.y + 56, scoreW + 8, 3, surfaceColor, { rx: 1 }),
      // Aspect-correct court with shot dots
      g(`translate(0, ${courtBand.y})`,
        g(`translate(${court.x}, ${court.y})`,
          benchCourt("bench-1", { height: court.height, surface, theme: benchTheme, width: court.width },
            React.createElement(DotLayer, {
              ...BENCH_DOT_SNAPSHOT,
              colorBy: "stroke",
              scales: createCourtScales({ width: court.width, height: court.height, half: "full", margin: 1.2 }),
              shots: enrichedShots,
              theme: benchTheme,
            }),
          ),
        ),
      ),
      // Hero KPIs — accent/label from stat.side (host vs match), never index color
      text({
        fill: INK_MUTED,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 1,
        textAnchor: "middle",
        x: centerX,
        y: statsBand.y + 14,
      }, `${(featured.hostName || "Host").split(" ").pop().toUpperCase()} · MATCH KPIs`),
      heroStats.slice(0, 4).map((stat, i) => {
        const x = i * (statW + statGap);
        const y = statsBand.y + 28;
        const side = stat.side || (i < 2 ? "host" : "match");
        const label = side === "host"
          ? `${(featured.hostName || "Host").split(" ").pop()} · ${stat.label}`
          : stat.label;
        return withKey(
          statCard(x, y, statW, statH, stat.value, label, accentForSide(side, i)),
          `hero-kpi-${i}-${stat.label}`,
        );
      }),
      text({
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 15,
        fontWeight: 600,
        textAnchor: "middle",
        x: centerX,
        y: ctaBand.y + 24,
      }, "Swipe to map the match →"),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 2: Match snapshot (replaces platform "scale")
// ---------------------------------------------------------------------------

function renderMatchSnapshot(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const layout = benchLayout({ untitled: true });
  const frameLayout = benchFrameLayoutProps({ untitled: true });
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const centerX = contentW / 2;
  const surface = featured.surface || "clay";
  const allShots = featured.shotPreview || fixture.pooledShots || [];
  const rally = rallyStats(allShots);
  const enrichedShots = toEnrichedShots(allShots);
  const shotsPerPoint = (allShots.length / Math.max(featured.totalPoints || 1, 1)).toFixed(1);

  const [headerBand, kpiBand, courtBand, legendBand] = layoutBands(contentH, [
    { id: "header", height: 72 },
    { id: "kpi", height: 72 },
    { id: "court", grow: true, minHeight: BENCH_COURT_MIN_H },
    { id: "legend", height: BENCH_LEGEND_H },
  ], BENCH_GAP);

  const kpis = [
    { accent: BENCH_BLUE, label: "Shots", value: formatNum(allShots.length) },
    { accent: BENCH_BLUE, label: "Points", value: formatNum(featured.totalPoints || 0) },
    { accent: BENCH_BLUE, label: "Shots / point", value: shotsPerPoint },
    { accent: BENCH_BLUE, label: "Longest rally", value: `${rally.longestRally}` },
  ];
  const kpiW = (contentW - BENCH_GAP * 3) / 4;
  const court = courtBox(contentW, courtBand.height, COURT_PLOT_ASPECT);
  const hcStroke = {
    backhand: "#22D3EE",
    forehand: "#FB923C",
    serve: "#C084FC",
    volley: "#4ADE80",
  };

  return React.createElement(
    FigureFrame,
    {
      background: BENCH_BG_MID,
      branding,
      ...frameLayout,
      showBaselineRule: false,
      showSlideIndex: false,
      slideCount,
      slideIndex,
      theme: benchTheme,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, "bench-match-snapshot"),
      text({
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 2,
        textAnchor: "middle",
        x: centerX,
        y: headerBand.y + 18,
      }, "MATCH SNAPSHOT"),
      text({
        fill: HOST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        x: 0,
        y: headerBand.y + 52,
      }, (featured.hostName || "Host").split(" ").pop()),
      text({
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 28,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: headerBand.y + 52,
      }, featured.setScore || ""),
      text({
        fill: GUEST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        textAnchor: "end",
        x: contentW,
        y: headerBand.y + 52,
      }, (featured.guestName || "Guest").split(" ").pop()),
      kpis.map((stat, i) =>
        withKey(
          statCard(i * (kpiW + BENCH_GAP), kpiBand.y + 4, kpiW, 64, stat.value, stat.label, stat.accent),
          `snap-kpi-${i}-${stat.label}`,
        ),
      ),
      g(`translate(0, ${courtBand.y})`,
        g(`translate(${court.x}, ${court.y})`,
          benchCourt("bench-match-snapshot", { height: court.height, surface, theme: benchTheme, width: court.width },
            React.createElement(DotLayer, {
              ...BENCH_DOT_SNAPSHOT,
              colorBy: "stroke",
              scales: createCourtScales({ width: court.width, height: court.height, half: "full", margin: 1.5 }),
              shots: enrichedShots,
              theme: benchTheme,
            }),
          ),
        ),
      ),
      g(`translate(0, ${legendBand.y})`,
        legendRow(0, 8, [
          { color: hcStroke.forehand, label: "Forehand" },
          { color: hcStroke.backhand, label: "Backhand" },
          { color: hcStroke.serve, label: "Serve" },
          { color: hcStroke.volley, label: "Volley" },
        ], { orientation: "horizontal", swatchSize: 10 }),
      ),
    ),
  );
}

/** @deprecated alias — registry switches to match-snapshot in T9 */
function renderScale(fixture, branding, slideIndex, slideCount) {
  return renderMatchSnapshot(fixture, branding, slideIndex, slideCount);
}

// ---------------------------------------------------------------------------
// Slide 3: Live bench (pooled hexmap + stats)
// ---------------------------------------------------------------------------

function renderLiveBench(fixture, branding, slideIndex, slideCount) {
  const ag = fixture.aggregates;
  const layout = benchLayout();
  const frameLayout = benchFrameLayoutProps();
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const surface = ag.dominantSurface || "clay";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const enrichedShots = toEnrichedShots(fixture.pooledShots);
  const sStats = shotStats(fixture.pooledShots);

  const [courtBand, legendBand, statsBand] = layoutBands(contentH, [
    { id: "court", grow: true, minHeight: 300 },
    { id: "legend", height: 44 },
    { id: "stats", height: 88 },
  ], 16);

  const courtH = courtBand.height;
  const courtW = contentW;

  const bottomStats = [
    { accent: BENCH_BLUE, label: "Published", value: String(ag.publishedCount) },
    { accent: surfaceColor, label: "Surface", value: surface },
    { accent: HOST_COLOR, label: "Shots mapped", value: formatNum(ag.totalShots) },
    { accent: GUEST_COLOR, label: "Avg speed", value: `${sStats.avgSpeed} km/h` },
  ];
  const statW = (contentW - 36) / 4;

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
      subtitle: `${ag.publishedCount} published match${ag.publishedCount !== 1 ? "es" : ""} mapped on court`,
      theme: benchTheme,
      title: "Live Bench Data",
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, `bench-live-${slideIndex ?? 0}`),
      // Court with hexbin
      g(`translate(0, ${courtBand.y})`,
        benchCourt("bench-3", { height: courtH, surface, theme: benchTheme, width: courtW },
          React.createElement(HexbinLayer, {
            ...BENCH_HEX_DENSITY,
            player: "host",
            scales: createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 }),
            shots: enrichedShots,
            theme: benchTheme,
          }),
        ),
      ),
      // Legend row
      g(`translate(0, ${legendBand.y})`,
        legendRow(0, 0, [
          { color: HOST_COLOR, label: "Darker = more shots" },
        ], { orientation: "horizontal", swatchSize: 10 }),
      ),
      // Bottom stat cards
      bottomStats.map((stat, i) => {
        const x = i * (statW + 12);
        return withKey(
          statCard(x, statsBand.y, statW, 72, stat.value, stat.label, stat.accent),
          `live-kpi-${i}-${stat.label}`,
        );
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Shared court slide shell (slides 03-07, 09)
// ---------------------------------------------------------------------------

/**
 * Shared court-first slide shell.
 * @param {{
 *   branding: object,
 *   legend?: unknown,
 *   half?: "near" | "full",
 *   renderCourt: (size: { courtH: number, courtW: number }) => unknown,
 *   slideCount: number,
 *   slideIndex: number,
 *   stats: Array<{ accent?: string, label: string, value: string }>,
 *   subtitle: string,
 *   title: string,
 * }} opts
 */
function renderCourtSlideShell(opts) {
  const {
    branding,
    half = "near",
    legend,
    renderCourt,
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
  const gradId = `bench-${slideIndex ?? 0}`;
  const kpiStats = stats.slice(0, BENCH_MAX_STATS);
  const legendH = legend ? BENCH_LEGEND_H : 0;
  const statsH = kpiStats.length > 0 ? BENCH_STATS_ROW_H : 0;

  const bandSpecs = [
    { id: "court", grow: true, minHeight: BENCH_COURT_MIN_H },
  ];
  if (legendH > 0) bandSpecs.push({ id: "legend", height: legendH });
  if (statsH > 0) bandSpecs.push({ id: "stats", height: statsH });

  const bands = layoutBands(contentH, bandSpecs, BENCH_GAP);
  const courtBand = bands.find((b) => b.id === "court");
  const legendBand = bands.find((b) => b.id === "legend");
  const statsBand = bands.find((b) => b.id === "stats");

  const aspect = half === "full" ? COURT_PLOT_ASPECT : COURT_NEAR_ASPECT;
  const box = courtBox(contentW, courtBand.height, aspect);
  const courtH = box.height;
  const courtW = box.width;
  const courtNode = g(
    `translate(${box.x}, ${box.y})`,
    renderCourt({ courtH, courtW }),
  );
  const statCols = Math.max(kpiStats.length, 1);
  const statW = (contentW - 12 * (statCols - 1)) / statCols;

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
      benchBackground(layout, gradId),
      g(`translate(0, ${courtBand.y})`, courtNode),
      legend && legendBand
        ? g(`translate(0, ${legendBand.y})`, legend)
        : null,
      statsBand
        ? kpiStats.map((stat, i) => {
          const x = i * (statW + 12);
          return React.cloneElement(
            statCard(x, statsBand.y + BENCH_PANEL_PAD, statW, 64, stat.value, stat.label, stat.accent),
            { key: `kpi-${i}-${stat.label}` },
          );
        })
        : null,
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 4: Serve map (ServeLayer)
// ---------------------------------------------------------------------------

function renderServeMap(fixture, branding, slideIndex, slideCount) {
  const ag = fixture.aggregates;
  const featured = fixture.featured;
  const surface = featured.surface || ag.dominantSurface || "clay";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const featuredShots = featured.shotPreview || fixture.pooledShots;
  const enrichedShots = toEnrichedShots(featuredShots);
  const sStats = shotStats(featuredShots);
  const serveZone = serveZoneStats(featuredShots, "host");

  const secondServeCol = surface === "clay" ? "#FACC15" : "#FBBF24";

  const legend = legendRow(0, 0, [
    { color: HOST_COLOR, label: "1st · circle" },
    { color: secondServeCol, label: "2nd · triangle" },
  ], { orientation: "horizontal", swatchSize: 10 });

  const hostZones = computeServeZones(enrichedShots, "host");
  const topZone = hostZones[0];
  const topZoneLabel = topZone
    ? `${topZone.side === "deuce" ? "Deuce" : topZone.side === "ad" ? "Ad" : "Center"} ${String(topZone.zone || "").replace(/^./, (c) => c.toUpperCase())}`
    : serveZone.topZone;
  const topZonePct = topZone?.inRate != null
    ? `${Math.round(topZone.inRate * 100)}%`
    : serveZone.topZonePct;
  const serveStats = [
    { accent: BENCH_BLUE, label: "Avg serve speed", value: `${featured.avgServeSpeed || sStats.avgServeSpeed} km/h` },
    { accent: HOST_COLOR, label: `${(featured.hostName || "Host").split(" ").pop()} · 1st in`, value: `${sStats.firstServePct}%` },
    { accent: HOST_COLOR, label: "Top serve zone", value: `${topZoneLabel} ${topZonePct}` },
    { accent: surfaceColor, label: "Serves tracked", value: String(featured.serveCount || sStats.serveCount) },
  ];

  return renderCourtSlideShell({
    branding,
    legend,
    renderCourt: ({ courtH, courtW }) => {
      const scales = createCourtScales({ width: courtW, height: courtH, half: "near", margin: 1.5 });
      return benchCourt("bench-serve-map", { half: "near", height: courtH, surface, theme: benchTheme, width: courtW },
        React.createElement(ServeLayer, {
          alpha: 0.55,
          courtSurface: surface,
          haloWidth: 0.5,
          highContrast: true,
          includeFaults: false,
          player: "host",
          scales,
          serveType: "both",
          shapeEncode: true,
          shots: enrichedShots,
          size: 4.5,
          theme: benchTheme,
        }),
      );
    },
    slideCount,
    slideIndex,
    stats: serveStats,
    subtitle: `Where ${featured.hostName}'s serves land`,
    title: "Serve placement",
  });
}

// ---------------------------------------------------------------------------
// Slide 5: Stroke dots (DotLayer colorBy: "stroke")
// ---------------------------------------------------------------------------

function renderStrokeDots(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const surface = featured.surface || fixture.aggregates?.dominantSurface || "clay";
  const hostName = (featured.hostName || "Host").split(" ").pop();
  const hostShots = (fixture.pooledShots || []).filter((s) => s.player === "host");
  const enrichedShots = toEnrichedShots(hostShots);
  const strokes = strokeBreakdown(hostShots);
  const winRates = strokeWinRates(enrichedShots, "host");

  const legend = legendRow(0, 0, [
    { color: STROKE_COLORS.forehand, label: "Forehand" },
    { color: "#1D4ED8", label: "Backhand" },
    { color: STROKE_COLORS.serve, label: "Serve" },
    { color: STROKE_COLORS.volley, label: "Volley" },
  ], { orientation: "horizontal", swatchSize: 8, fontSize: 11 });

  const stats = strokes.slice(0, 4).map((s) => {
    const wr = winRates[s.label?.toLowerCase()];
    const winPct = wr?.winRate != null ? `${Math.round(wr.winRate * 100)}%` : "—";
    return {
      accent: s.label?.toLowerCase() === "backhand" ? "#1D4ED8" : s.color,
      label: `${s.label} · ${wr?.total ?? 0}`,
      value: winPct,
    };
  });

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend,
    renderCourt: ({ courtH, courtW }) => benchCourt("bench-stroke-dots", { height: courtH, surface, theme: benchTheme, width: courtW },
      React.createElement(DotLayer, {
        ...BENCH_DOT_STROKE,
        colorBy: "stroke",
        scales: createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 }),
        shots: enrichedShots,
        theme: benchTheme,
      }),
    ),
    slideCount,
    slideIndex,
    stats,
    subtitle: `${hostName}'s shots by stroke · win %`,
    title: "Shot placement",
  });
}

// ---------------------------------------------------------------------------
// Slide 6: Territory (side-by-side host & guest hexbins)
// ---------------------------------------------------------------------------

function renderTerritory(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const layout = benchLayout();
  const frameLayout = benchFrameLayoutProps();
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const surface = featured.surface || "clay";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const hostName = featured.hostName || "Host";
  const guestName = featured.guestName || "Guest";

  const hostShots = toEnrichedShots((fixture.pooledShots || []).filter((s) => s.player === "host"));
  const guestShots = toEnrichedShots((fixture.pooledShots || []).filter((s) => s.player === "guest"));
  const hostStats = shotStats((fixture.pooledShots || []).filter((s) => s.player === "host"));
  const guestStats = shotStats((fixture.pooledShots || []).filter((s) => s.player === "guest"));

  const [courtBand, legendBand, statsBand] = layoutBands(contentH, [
    { id: "court", grow: true, minHeight: 300 },
    { id: "legend", height: BENCH_LEGEND_H },
    { id: "stats", height: BENCH_STATS_ROW_H },
  ], BENCH_GAP);

  const nameH = 28;
  const colGap = BENCH_GAP;
  const colW = (contentW - colGap) / 2;
  const box = courtBox(colW, courtBand.height - nameH - BENCH_PANEL_PAD);
  const statW = (contentW - BENCH_PANEL_PAD * 2 - 12 * 3) / 4;
  const sharedDomain = { vmin: 0, vmax: Math.max(hostShots.length, guestShots.length, 1) };

  const legend = legendRow(0, 0, [
    { color: HOST_COLOR, label: hostName.split(" ").pop() },
    { color: GUEST_COLOR, label: guestName.split(" ").pop() },
  ], { orientation: "horizontal", swatchSize: 10 });

  const stats = [
    { accent: HOST_COLOR, label: `${hostName.split(" ").pop()} shots`, value: formatNum(hostShots.length) },
    { accent: GUEST_COLOR, label: `${guestName.split(" ").pop()} shots`, value: formatNum(guestShots.length) },
    { accent: HOST_COLOR, label: "Host avg km/h", value: `${hostStats.avgSpeed}` },
    { accent: GUEST_COLOR, label: "Guest avg km/h", value: `${guestStats.avgSpeed}` },
  ];

  function column(player, shots, color, colX, label) {
    return g(`translate(${colX}, ${courtBand.y})`,
      text({
        fill: color,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 20,
        fontWeight: 700,
        textAnchor: "middle",
        x: colW / 2,
        y: 20,
      }, truncateText(label, {
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 20,
        fontWeight: 700,
        maxWidth: colW - 16,
      })),
      g(`translate(${box.x}, ${nameH + box.y})`,
        benchCourt(`bench-territory-${player}`, {
          height: box.height,
          surface,
          theme: benchTheme,
          width: box.width,
        },
          React.createElement(HexbinLayer, {
            ...BENCH_HEX_DENSITY,
            player,
            scales: createCourtScales({ width: box.width, height: box.height, half: "full", margin: 1.5 }),
            shots,
            theme: benchTheme,
            valueDomain: sharedDomain,
          }),
        ),
      ),
    );
  }

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
      subtitle: "Where each player hit most",
      theme: benchTheme,
      title: "Territory",
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, `bench-territory-${slideIndex ?? 0}`),
      column("host", hostShots, HOST_COLOR, 0, hostName),
      column("guest", guestShots, GUEST_COLOR, colW + colGap, guestName),
      g(`translate(${(contentW - 420) / 2}, ${legendBand.y})`, legend),
      stats.map((stat, i) =>
        withKey(
          statCard(
            BENCH_PANEL_PAD + i * (statW + 12),
            statsBand.y + BENCH_PANEL_PAD,
            statW,
            64,
            stat.value,
            stat.label,
            stat.accent,
          ),
          `terr-kpi-${i}-${stat.label}`,
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 8: Featured match
// ---------------------------------------------------------------------------

function renderFeaturedMatch(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const layout = benchLayout({ untitled: true });
  const frameLayout = benchFrameLayoutProps({ untitled: true });
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const centerX = contentW / 2;
  const surface = featured.surface || "clay";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const rally = rallyStats(featured.shotPreview || []);
  const heroStats = (featured.heroStats || []).slice(0, 4);
  const hcStroke = {
    backhand: "#22D3EE",
    forehand: "#FB923C",
    serve: "#C084FC",
    volley: "#4ADE80",
  };

  const [headerBand, kpiBand, courtBand, legendBand] = layoutBands(contentH, [
    { id: "header", height: 96 },
    { id: "kpi", height: BENCH_STATS_ROW_H },
    { id: "court", grow: true, minHeight: BENCH_COURT_MIN_H },
    { id: "legend", height: BENCH_LEGEND_H },
  ], BENCH_GAP);

  const court = courtBox(contentW, courtBand.height, COURT_PLOT_ASPECT);
  const scoreText = featured.setScore || "";
  const statW = heroStats.length
    ? (contentW - BENCH_GAP * (heroStats.length - 1)) / heroStats.length
    : contentW;

  return React.createElement(
    FigureFrame,
    {
      background: BENCH_BG_MID,
      branding,
      ...frameLayout,
      showBaselineRule: false,
      showBrandingFooter: true,
      showSlideIndex: false,
      slideCount,
      slideIndex,
      theme: benchTheme,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, "bench-featured"),
      text({
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 2,
        textAnchor: "middle",
        x: centerX,
        y: headerBand.y + 16,
      }, "FEATURED STORY"),
      text({
        fill: HOST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        x: 0,
        y: headerBand.y + 52,
      }, (featured.hostName || "Host").split(" ").pop()),
      text({
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 28,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: headerBand.y + 54,
      }, scoreText),
      text({
        fill: GUEST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        textAnchor: "end",
        x: contentW,
        y: headerBand.y + 52,
      }, (featured.guestName || "Guest").split(" ").pop()),
      text({
        fill: INK_MUTED,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        textAnchor: "middle",
        x: centerX,
        y: headerBand.y + 82,
      }, truncateText(featured.headline || `Avg rally ${rally.avgRally} · longest ${rally.longestRally}`, {
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        maxWidth: contentW - 24,
      })),
      heroStats.map((stat, i) =>
        withKey(
          statCard(
            i * (statW + BENCH_GAP),
            kpiBand.y + BENCH_PANEL_PAD,
            statW,
            64,
            stat.value,
            stat.label,
            accentForSide(stat.side, i),
          ),
          `story-kpi-${i}-${stat.label}`,
        ),
      ),
      g(`translate(0, ${courtBand.y})`,
        g(`translate(${court.x}, ${court.y})`,
          benchCourt("bench-featured-match", { height: court.height, surface, theme: benchTheme, width: court.width },
            React.createElement(DotLayer, {
              ...BENCH_DOT_SNAPSHOT,
              colorBy: "stroke",
              highContrast: true,
              scales: createCourtScales({ width: court.width, height: court.height, half: "full", margin: 1.5 }),
              shots: toEnrichedShots(featured.shotPreview),
              theme: benchTheme,
            }),
          ),
        ),
      ),
      g(`translate(0, ${legendBand.y})`,
        legendRow(0, 8, [
          { color: hcStroke.forehand, label: "Forehand" },
          { color: hcStroke.backhand, label: "Backhand" },
          { color: hcStroke.serve, label: "Serve" },
          { color: hcStroke.volley, label: "Volley" },
        ], { orientation: "horizontal", swatchSize: 8, fontSize: 11 }),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 9: Featured insight (court hexbin)
// ---------------------------------------------------------------------------

function renderFeaturedInsight(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const surface = featured.surface || "clay";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const hostLast = (featured.hostName || "Host").split(" ").pop();
  const guestLast = (featured.guestName || "Guest").split(" ").pop();
  const featuredShots = featured.shotPreview?.length ? featured.shotPreview : (fixture.pooledShots || []);
  const enrichedShots = toEnrichedShots(featuredShots);
  // Pressure endings — distinct from Territory (full-shot density).
  const byPoint = new Map();
  for (const shot of enrichedShots) {
    const key = `${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}`;
    const prev = byPoint.get(key);
    if (!prev || (shot.shotNumber ?? 0) > (prev.shotNumber ?? 0)) byPoint.set(key, shot);
  }
  const pressureEnds = [...byPoint.values()].filter(
    (s) => s.isBreakPoint || s.isSetPoint || s.isMatchPoint,
  );
  const plotShots = pressureEnds.length ? pressureEnds : [...byPoint.values()];
  const bpN = plotShots.filter((s) => s.isBreakPoint).length;
  const spMpN = plotShots.filter((s) => s.isSetPoint || s.isMatchPoint).length;
  const hostWon = plotShots.filter((s) => s.pointWinner === "host").length;

  const legend = legendRow(0, 0, [
    { color: HOST_COLOR, label: `${hostLast} won` },
    { color: GUEST_COLOR, label: `${guestLast} won` },
    { color: surfaceColor, label: "Pressure endings" },
  ], { orientation: "horizontal", swatchSize: 10 });

  const stats = [
    { accent: BENCH_BLUE, label: "BP ends", value: String(bpN) },
    { accent: HOST_COLOR, label: "SP/MP ends", value: String(spMpN) },
    { accent: HOST_COLOR, label: `${hostLast} won`, value: String(hostWon) },
    { accent: GUEST_COLOR, label: `${guestLast} won`, value: String(plotShots.length - hostWon) },
  ];

  return renderCourtSlideShell({
    branding,
    half: "full",
    legend,
    renderCourt: ({ courtH, courtW }) => benchCourt("bench-featured-insight", { height: courtH, surface, theme: benchTheme, width: courtW },
      React.createElement(HexbinLayer, {
        ...BENCH_HEX_DENSITY,
        scales: createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 }),
        shots: plotShots,
        theme: benchTheme,
      }),
    ),
    slideCount,
    slideIndex,
    stats,
    subtitle: "Where break, set, and match points ended",
    title: "Pressure zones",
  });
}

// ---------------------------------------------------------------------------
// Slide 10: CTA
// ---------------------------------------------------------------------------

function renderCta(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const layout = benchLayout({ untitled: true });
  const frameLayout = benchFrameLayoutProps({ untitled: true });
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const centerX = contentW / 2;
  const surface = featured?.surface || "clay";
  const enrichedShots = toEnrichedShots(featured?.shotPreview || fixture.pooledShots || []);
  const scoreText = featured?.setScore || "";

  const [heroBand, scoreBand, headlineBand, supportBand, urlBand, buttonBand] = layoutBands(contentH, [
    { id: "hero", grow: true, minHeight: 360 },
    { id: "score", height: 48 },
    { id: "headline", height: 100 },
    { id: "support", height: 48 },
    { id: "url", height: 32 },
    { id: "button", height: 64 },
  ], BENCH_GAP);

  const court = courtBox(contentW, heroBand.height);

  return React.createElement(
    FigureFrame,
    {
      background: BENCH_BG_MID,
      branding,
      ...frameLayout,
      showBaselineRule: false,
      showBrandingFooter: true,
      showSlideIndex: false,
      slideCount,
      slideIndex,
      theme: benchTheme,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, "bench-cta"),
      // Brand lockup: logo + handle at top-left
      g(`translate(16, 6)`,
        React.createElement("image", {
          height: 24,
          href: branding?.logoHref,
          preserveAspectRatio: "xMidYMid meet",
          width: 24,
          x: 0,
          y: 0,
        }),
        text({
          fill: BENCH_NAVY,
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          x: 32,
          y: 18,
        }, brandDefaults.handle),
      ),
      g(`translate(0, ${heroBand.y})`,
        g(`translate(${court.x}, ${court.y})`,
          benchCourt("bench-cta", { height: court.height, surface, theme: benchTheme, width: court.width },
            React.createElement(DotLayer, {
              ...BENCH_DOT_SNAPSHOT,
              colorBy: "stroke",
              scales: createCourtScales({ width: court.width, height: court.height, half: "full", margin: 1.5 }),
              shots: enrichedShots,
              theme: benchTheme,
            }),
          ),
        ),
      ),
      text({
        fill: HOST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 18,
        fontWeight: 700,
        x: 0,
        y: scoreBand.y + 30,
      }, (featured?.hostName || "Host").split(" ").pop()),
      text({
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 26,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: scoreBand.y + 30,
      }, scoreText),
      text({
        fill: GUEST_COLOR,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 18,
        fontWeight: 700,
        textAnchor: "end",
        x: contentW,
        y: scoreBand.y + 30,
      }, (featured?.guestName || "Guest").split(" ").pop()),
      text({
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 42,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: headlineBand.y + 52,
      }, "Your matches. This clarity."),
      text({
        fill: INK_MUTED,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 15,
        fontWeight: 500,
        textAnchor: "middle",
        x: centerX,
        y: supportBand.y + 28,
      }, "Free account · Your first match mapped in minutes"),
      text({
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 15,
        fontWeight: 600,
        textAnchor: "middle",
        x: centerX,
        y: urlBand.y + 22,
      }, brandDefaults.website.replace(/^https?:\/\//, "")),
      g(`translate(${centerX - 170}, ${buttonBand.y})`,
        rect(0, 0, 340, 56, BENCH_BLUE, { rx: 28 }),
        text({
          fill: "#FFFFFF",
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 20,
          fontWeight: 600,
          textAnchor: "middle",
          x: 170,
          y: 36,
        }, "Sign up free →"),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 9: Error map (migrated from blue deck)
// ---------------------------------------------------------------------------

function renderErrorMap(fixture, matchCtx, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const layout = benchLayout();
  const frameLayout = benchFrameLayoutProps();
  const contentH = layout.content.height;
  const contentW = layout.content.width;
  const surface = featured.surface || "hard";
  const surfaceColor = surface === "clay" ? SURFACE_CLAY : surface === "grass" ? SURFACE_GRASS : SURFACE_HARD;
  const enrichedShots = matchCtx ? matchCtx.enrichedShots : toEnrichedShots(featured.shotPreview);

  const errors = enrichedShots.filter(
    (s) =>
      s.bounceX != null &&
      s.bounceY != null &&
      (s.result === "Out" || s.result === "Net" || s.endedBy === "unforced_error"),
  );
  const outErrors = errors.filter((s) => s.result === "Out" || s.endedBy === "unforced_error");
  const netErrors = errors.filter((s) => s.result === "Net");
  const hostOut = outErrors.filter((s) => s.player === "host").length;
  const guestOut = outErrors.filter((s) => s.player === "guest").length;
  const hostNet = netErrors.filter((s) => s.player === "host").length;
  const guestNet = netErrors.filter((s) => s.player === "guest").length;
  const hostLast = (matchCtx?.hostName || featured.hostName || "Host").split(" ").pop();
  const guestLast = (matchCtx?.guestName || featured.guestName || "Guest").split(" ").pop();

  const statsBandH = 248;
  const [courtBand, statsBand] = layoutBands(contentH, [
    { id: "court", grow: true, minHeight: 280 },
    { id: "stats", height: statsBandH },
  ], BENCH_GAP);

  const court = courtBox(contentW, courtBand.height);
  const scales = createCourtScales({ width: court.width, height: court.height, half: "full", margin: 1.5 });
  const cardGap = BENCH_GAP;
  const cardW = (contentW - BENCH_PANEL_PAD * 2 - cardGap * 3) / 4;
  const cardH = 56;
  const labelW = 88;
  const valueW = 28;
  const trackW = contentW - labelW - valueW - 16;

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
      subtitle: "Out errors on court · net errors by stroke",
      theme: benchTheme,
      title: "Error map",
    },
    React.createElement(
      "g",
      null,
      benchBackground(layout, "bench-error"),
      g(`translate(0, ${courtBand.y})`,
        g(`translate(${court.x}, ${court.y})`,
          benchCourt("bench-11", { height: court.height, surface, theme: benchTheme, width: court.width },
            React.createElement(DotLayer, {
              ...BENCH_ERROR_DOT_DENSITY,
              colorBy: "player",
              player: "host",
              scales,
              shots: outErrors,
              theme: benchTheme,
            }),
            React.createElement(DotLayer, {
              ...BENCH_ERROR_DOT_DENSITY,
              colorBy: "player",
              player: "guest",
              scales,
              shots: outErrors,
              theme: benchTheme,
            }),
          ),
        ),
      ),
      g(`translate(0, ${statsBand.y})`,
        text({
          fill: INK_MUTED,
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          x: BENCH_PANEL_PAD,
          y: 18,
        }, "OUT ON COURT"),
        text({
          fill: INK_MUTED,
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          x: BENCH_PANEL_PAD + (cardW + cardGap) * 2,
          y: 18,
        }, "NET TOTALS"),
        statCard(BENCH_PANEL_PAD, 28, cardW, cardH, String(hostOut), `${hostLast} out`, HOST_COLOR),
        statCard(BENCH_PANEL_PAD + cardW + cardGap, 28, cardW, cardH, String(guestOut), `${guestLast} out`, GUEST_COLOR),
        statCard(BENCH_PANEL_PAD + (cardW + cardGap) * 2, 28, cardW, cardH, String(hostNet), `${hostLast} net`, HOST_COLOR),
        statCard(BENCH_PANEL_PAD + (cardW + cardGap) * 3, 28, cardW, cardH, String(guestNet), `${guestLast} net`, GUEST_COLOR),
        text({
          fill: INK_MUTED,
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          x: BENCH_PANEL_PAD,
          y: 108,
        }, "NET ERRORS BY STROKE"),
        (() => {
          const strokes = ["Forehand", "Backhand", "Volley"];
          const maxNet = Math.max(
            ...strokes.flatMap((st) => [
              netErrors.filter((s) => s.player === "host" && s.stroke === st).length,
              netErrors.filter((s) => s.player === "guest" && s.stroke === st).length,
            ]),
            1,
          );
          const barH = 22;
          const barGap = 10;
          return strokes.map((st, i) => {
            const hostCount = netErrors.filter((s) => s.player === "host" && s.stroke === st).length;
            const guestCount = netErrors.filter((s) => s.player === "guest" && s.stroke === st).length;
            const y = 122 + i * (barH + barGap);
            const hostBarW = Math.max(2, (hostCount / maxNet) * trackW);
            const guestBarW = Math.max(2, (guestCount / maxNet) * trackW);
            const stripH = (barH - 2) / 2;
            return el("g", { key: st },
              text({
                fill: INK_MUTED,
                fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
                fontSize: 12,
                x: BENCH_PANEL_PAD,
                y: y + 15,
              }, st),
              rect(labelW, y, hostBarW, stripH, HOST_COLOR, { rx: 2 }),
              rect(labelW, y + stripH + 2, guestBarW, stripH, GUEST_COLOR, { rx: 2 }),
              text({
                fill: BENCH_NAVY,
                fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                textAnchor: "end",
                x: contentW - BENCH_PANEL_PAD,
                y: y + 15,
              }, `${hostCount} · ${guestCount}`),
            );
          });
        })(),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Builder dispatcher
// ---------------------------------------------------------------------------

function buildSlide(slideId, fixture, branding, slideIndex, slideCount, matchCtx) {
  // Lazy require avoids circular load with bench-post-court-slides.cjs
  const { createBuilders } = require("./bench-post-court-slides.cjs");
  const builders = createBuilders({ branding, fixture, matchCtx, slideCount, slideIndex });
  const builder = builders[slideId];
  if (!builder) throw new Error(`Unknown bench post slide: ${slideId}`);
  return builder();
}

module.exports = {
  BENCH_DOT_DENSITY,
  BENCH_DOT_ERRORS,
  BENCH_DOT_SNAPSHOT,
  BENCH_DOT_STROKE,
  BENCH_DOT_VOLLEYS,
  BENCH_HEX_DENSITY,
  BENCH_BG_MID,
  BENCH_GAP,
  BENCH_LEGEND_H,
  BENCH_PANEL_PAD,
  BENCH_STATS_ROW_H,
  COURT_NEAR_ASPECT,
  COURT_PLOT_ASPECT,
  GUEST_COLOR,
  HOST_COLOR,
  BENCH_BLUE,
  SURFACE_CLAY,
  SURFACE_GRASS,
  SURFACE_HARD,
  STROKE_COLORS,
  benchBackground,
  benchCourt,
  benchFrameLayoutProps,
  benchLayout,
  benchTheme,
  buildSlide,
  courtBox,
  g,
  legendRow,
  renderCourtSlideShell,
  renderCover,
  renderCta,
  renderErrorMap,
  renderFeaturedInsight,
  renderFeaturedMatch,
  renderMatchSnapshot,
  renderServeMap,
  renderStrokeDots,
  renderTerritory,
  resolveBranding,
  statCard,
  text,
  toEnrichedShots,
};
