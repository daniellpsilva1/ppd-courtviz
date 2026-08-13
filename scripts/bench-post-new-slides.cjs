/**
 * Legacy record slide still used by the 50-slide court registry.
 * Other duel/histogram posts live in bench-post-court-slides.cjs.
 */

const path = require("path");
const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const React = require("react");
const {
  CourtSurface,
  DotLayer,
  FigureFrame,
} = require("@courtviz/react");
const {
  resolveFrameLayout,
  layoutBands,
  createCourtScales,
  COURT_LENGTH,
  DOUBLES_HALF,
} = require("@courtviz/core");
const { ppdEditorial } = require("@courtviz/themes");

const BENCH_NAVY = "#0A1833";
const BENCH_BG_MID = "#EEF4FF";
const BENCH_GAP = 14;
const BENCH_FOOTER_H = 64;
const INK_MUTED = "#64748B";
const COURT_MARGIN = 1.5;
const COURT_PLOT_ASPECT = (DOUBLES_HALF * 2 + COURT_MARGIN * 2) / (COURT_LENGTH + COURT_MARGIN * 2);
const benchTheme = { ...ppdEditorial, background: BENCH_BG_MID };

function el(tag, props, ...children) {
  return React.createElement(tag, props, ...children);
}
function g(transform, ...children) {
  return el("g", { transform }, ...children);
}
function text(props, content) {
  return el("text", props, content);
}
function rect(x, y, w, h, fill, opts) {
  return el("rect", { fill, height: h, rx: opts?.rx ?? 0, width: w, x, y });
}
const BENCH_TITLE_CHROME_H = 91;
function benchLayout() {
  return resolveFrameLayout("portrait", { footerHeight: BENCH_FOOTER_H, titleHeight: BENCH_TITLE_CHROME_H });
}
function frameProps() {
  return {
    format: "portrait",
    layoutFooterHeight: BENCH_FOOTER_H,
    layoutTitleHeight: BENCH_TITLE_CHROME_H,
  };
}
function courtBox(bandW, bandH) {
  let width = bandW;
  let height = width / COURT_PLOT_ASPECT;
  if (height > bandH) {
    height = bandH;
    width = height * COURT_PLOT_ASPECT;
  }
  return { height, width, x: (bandW - width) / 2, y: (bandH - height) / 2 };
}
function benchCourt(idPrefix, props, ...children) {
  return React.createElement(CourtSurface, {
    half: props.half || "full",
    height: props.height,
    idPrefix,
    surface: props.surface,
    theme: props.theme || benchTheme,
    width: props.width,
  }, ...children);
}
function lastName(name) {
  return (name || "Player").split(" ").pop();
}
function frameShell({ branding, slideIndex, slideCount, title, subtitle, children }) {
  const layout = benchLayout();
  return React.createElement(
    FigureFrame,
    {
      background: BENCH_BG_MID,
      branding,
      ...frameProps(),
      showBaselineRule: true,
      slideCount,
      slideIndex,
      subtitle,
      theme: benchTheme,
      title,
    },
    React.createElement("g", null,
      rect(0, 0, layout.content.width, layout.content.height, BENCH_BG_MID),
      children(layout.content.width, layout.content.height),
    ),
  );
}

function toEnriched(shots) {
  if (!shots) return [];
  return shots
    .filter((s) => s.bounce_x != null && s.bounce_y != null)
    .map((s) => ({
      bounceDepth: s.bounce_depth ?? null,
      bounceSide: s.bounce_side ?? null,
      bounceX: s.bounce_x,
      bounceY: s.bounce_y,
      bounceZone: s.bounce_zone ?? null,
      direction: s.direction,
      gameNumber: s.game_number,
      hitX: s.hit_x,
      hitY: s.hit_y,
      hitZ: s.hit_z,
      isBreakPoint: Boolean(s.is_break_point),
      isMatchPoint: Boolean(s.is_match_point),
      isSetPoint: Boolean(s.is_set_point),
      player: s.player,
      pointNumber: s.point_number,
      pointWinner: s.point_winner ?? null,
      rallyLength: s.rally_length ?? null,
      result: s.result ?? "In",
      setNumber: s.set_number,
      shotNumber: s.shot_number,
      speedKmh: s.speed_kmh,
      spin: s.spin,
      stroke: s.stroke,
      type: s.type,
    }));
}

function renderRecordLongestRally(fixture, branding, slideIndex, slideCount) {
  const featured = fixture.featured;
  const record = (fixture.records || []).find((r) => r.labelKey === "longestRally");
  const surface = featured.surface || "clay";
  const rallyShots = (featured.shotPreview || []).filter((s) =>
    record
      && s.set_number === record.rallySet
      && s.game_number === record.rallyGame
      && (record.rallyPoint == null || s.point_number === record.rallyPoint),
  );
  const enriched = toEnriched(rallyShots.length ? rallyShots : featured.shotPreview || []);

  return frameShell({
    branding, slideIndex, slideCount,
    title: "Longest rally",
    subtitle: record ? `Set ${record.rallySet} · Game ${record.rallyGame}` : "Most shots in a point",
    children: (contentW, contentH) => {
      const [heroBand, courtBand, metaBand] = layoutBands(contentH, [
        { id: "hero", height: 140 },
        { id: "court", grow: true, minHeight: 360 },
        { id: "meta", height: 56 },
      ], BENCH_GAP);
      const box = courtBox(contentW, courtBand.height);
      const scales = createCourtScales({ width: box.width, height: box.height, half: "full", margin: 1.5 });
      return el("g", null,
        text({ fill: BENCH_NAVY, fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 96, fontWeight: 700, textAnchor: "middle", x: contentW / 2, y: heroBand.y + 80 }, record?.value || "—"),
        text({ fill: INK_MUTED, fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontSize: 16, textAnchor: "middle", x: contentW / 2, y: heroBand.y + 120 }, "shots"),
        g(`translate(0, ${courtBand.y})`,
          g(`translate(${box.x}, ${box.y})`,
            benchCourt("bench-record-rally", { height: box.height, surface, width: box.width },
              React.createElement(DotLayer, {
                alpha: 0.75,
                colorBy: "player",
                highContrast: true,
                scales,
                shots: enriched,
                size: 6,
                theme: benchTheme,
              }),
            ),
          ),
        ),
        text({
          fill: BENCH_NAVY,
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          textAnchor: "middle",
          x: contentW / 2,
          y: metaBand.y + 30,
        }, record?.matchLabel || `${lastName(featured.hostName)} vs ${lastName(featured.guestName)}`),
      );
    },
  });
}

module.exports = {
  renderRecordLongestRally,
};
