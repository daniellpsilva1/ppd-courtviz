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
const { FigureFrame, Court, HexbinLayer, DotLayer } = require("@courtviz/react");
const { resolveFrameLayout, layoutBands, createCourtScales, normalizeShot, SINGLES_HALF, courtYBounds } = require("@courtviz/core");
const { ppdEditorial, ppd, getPlayerColor, getSurfaceColor, getSurfaceColorLight } = require("@courtviz/themes");
const { socialFormats, brandDefaults } = require("@ppd/tokens");

const BENCH_BLUE = "#0047FF";
const BENCH_NAVY = "#0A1833";

function formatNum(n) {
  return n.toLocaleString("en-US");
}

function toEnrichedShots(shotPreview) {
  if (!shotPreview) return [];
  return shotPreview.map((s) => ({
    bounceSide: null,
    bounceX: s.bounce_x,
    bounceY: s.bounce_y,
    bounceZone: null,
    direction: s.direction,
    endedBy: null,
    gameNumber: s.game_number,
    hitDepth: null,
    hitSide: null,
    hitX: s.hit_x,
    hitY: s.hit_y,
    hitZ: null,
    isBreakPoint: false,
    isMatchPoint: false,
    isSetPoint: false,
    isTerminal: s.result === "Out" || s.result === "Net",
    player: s.player,
    pointNumber: s.point_number,
    pointWinner: null,
    rallyLength: null,
    result: s.result ?? "In",
    setNumber: s.set_number,
    shotNumber: s.shot_number,
    speedKmh: s.speed_kmh,
    spin: s.spin,
    stroke: s.stroke,
    type: s.type,
  }));
}

function benchBranding(logoHref) {
  return {
    handle: brandDefaults.handle,
    logo: true,
    logoHref,
    source: "Peak Performance Data · Tennis Bench",
  };
}

function resolveBranding(logoHref) {
  return benchBranding(logoHref);
}

// ---------------------------------------------------------------------------
// Slide 1: Cover
// ---------------------------------------------------------------------------

function renderCover(fixture, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const centerX = contentW / 2;

  const [eyebrowBand, heroBand, hookBand, ctaBand] = layoutBands(contentH, [
    { id: "eyebrow", height: 36 },
    { id: "hero", height: 120 },
    { id: "hook", grow: true, minHeight: 120 },
    { id: "cta", height: 48 },
  ], 16);

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: false,
      showBrandingFooter: false,
      slideCount,
      slideIndex,
      theme: ppdEditorial,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 3,
        textAnchor: "middle",
        x: centerX,
        y: eyebrowBand.y + 22,
      }, "PEAK PERFORMANCE DATA · TENNIS BENCH"),
      React.createElement("text", {
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: 1,
        textAnchor: "middle",
        x: centerX,
        y: heroBand.y + 60,
      }, "THE TENNIS"),
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: 1,
        textAnchor: "middle",
        x: centerX,
        y: heroBand.y + 110,
      }, "ANALYTICS BENCH"),
      React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 20,
        fontWeight: 400,
        textAnchor: "middle",
        x: centerX,
        y: hookBand.y + 40,
      }, "Every match we process becomes"),
      React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 20,
        fontWeight: 400,
        textAnchor: "middle",
        x: centerX,
        y: hookBand.y + 68,
      }, "a public proof of what modern"),
      React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 20,
        fontWeight: 400,
        textAnchor: "middle",
        x: centerX,
        y: hookBand.y + 96,
      }, "tennis intelligence looks like."),
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 16,
        fontWeight: 600,
        textAnchor: "middle",
        x: centerX,
        y: ctaBand.y + 28,
      }, "Swipe to see the data →"),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 2: Scale (ticker numbers)
// ---------------------------------------------------------------------------

function renderScale(fixture, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const ag = fixture.aggregates;

  const stats = [
    { label: "Matches processed", value: formatNum(ag.totalMatches) },
    { label: "Shots tracked", value: formatNum(ag.totalShots) },
    { label: "Points analyzed", value: formatNum(ag.totalPoints) },
    { label: "Matches with video", value: formatNum(ag.matchesWithVideo) },
  ];

  const [titleBand, statsBand] = layoutBands(contentH, [
    { id: "title", height: 80 },
    { id: "stats", grow: true, minHeight: 200 },
  ], 16);

  const statH = 120;
  const statGap = 16;
  const startY = statsBand.y + 20;

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: true,
      slideCount,
      slideIndex,
      subtitle: "Platform-wide aggregates",
      theme: ppdEditorial,
      title: "By the numbers",
    },
    React.createElement(
      "g",
      null,
      stats.map((stat, i) => {
        const y = startY + i * (statH + statGap);
        return React.createElement(
          "g",
          { key: i, transform: `translate(0, ${y})` },
          React.createElement("rect", {
            fill: "#F0F4FF",
            height: statH,
            rx: 12,
            width: contentW,
            x: 0,
            y: 0,
          }),
          React.createElement("text", {
            fill: BENCH_NAVY,
            fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
            fontSize: 56,
            fontWeight: 700,
            textAnchor: "middle",
            x: contentW / 2,
            y: 60,
          }, stat.value),
          React.createElement("text", {
            fill: "#4A5568",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
            fontSize: 16,
            fontWeight: 500,
            textAnchor: "middle",
            x: contentW / 2,
            y: 92,
          }, stat.label),
        );
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 3: Live bench (pooled hexmap + stats)
// ---------------------------------------------------------------------------

function renderLiveBench(fixture, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const ag = fixture.aggregates;

  const [titleBand, courtBand, statsBand] = layoutBands(contentH, [
    { id: "title", height: 80 },
    { id: "court", grow: true, minHeight: 300 },
    { id: "stats", height: 100 },
  ], 12);

  const courtW = contentW;
  const courtH = courtBand.height;
  const surface = ag.dominantSurface || "clay";

  const enrichedShots = toEnrichedShots(fixture.pooledShots);

  const stats = [
    { label: "Published", value: String(ag.publishedCount) },
    { label: "Surface", value: surface },
  ];

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: true,
      slideCount,
      slideIndex,
      subtitle: `${ag.publishedCount} published match${ag.publishedCount !== 1 ? "es" : ""} mapped on court`,
      theme: ppdEditorial,
      title: "Live bench data",
    },
    React.createElement(
      "g",
      null,
      React.createElement(
        "g",
        { transform: `translate(0, ${courtBand.y})` },
        React.createElement(
          Court,
          {
            height: courtH,
            surface,
            theme: ppdEditorial,
            width: courtW,
          },
          React.createElement(HexbinLayer, {
            alpha: 0.85,
            colorScale: "count",
            minCount: 1,
            player: "host",
            scales: createCourtScales({ width: courtW, height: courtH, half: "full", margin: 1.5 }),
            shots: enrichedShots,
            theme: ppdEditorial,
          }),
        ),
      ),
      React.createElement(
        "g",
        { transform: `translate(0, ${statsBand.y})` },
        stats.map((stat, i) =>
          React.createElement(
            "g",
            { key: i, transform: `translate(${i * (contentW / 2)}, 0)` },
            React.createElement("text", {
              fill: BENCH_BLUE,
              fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
              fontSize: 36,
              fontWeight: 700,
              textAnchor: "middle",
              x: contentW / 4,
              y: 30,
            }, stat.value),
            React.createElement("text", {
              fill: "#4A5568",
              fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              textAnchor: "middle",
              x: contentW / 4,
              y: 54,
            }, stat.label),
          ),
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slides 4-7: Record slides
// ---------------------------------------------------------------------------

function findRecord(fixture, labelKey) {
  return fixture.records.find((r) => r.labelKey === labelKey);
}

function formatRecordValue(record) {
  if (record.labelKey === "fastestServe") {
    return `${record.value}`;
  }
  if (record.labelKey === "longestRally") {
    return record.value;
  }
  return record.value;
}

function formatRecordUnit(record) {
  if (record.labelKey === "fastestServe") return "km/h";
  if (record.labelKey === "longestRally") return "shots";
  return "";
}

function formatRecordContext(record) {
  if (record.labelKey === "fastestServe" && record.playerName) {
    const serveType = record.serveType === "first" ? "1st serve"
      : record.serveType === "second" ? "2nd serve" : "Serve";
    return `${record.playerName} · ${serveType}`;
  }
  if (record.labelKey === "longestRally" && record.rallySet != null && record.rallyGame != null) {
    return `Set ${record.rallySet} · Game ${record.rallyGame}`;
  }
  if ((record.labelKey === "topPointsWon" || record.labelKey === "bestBreakConv") && record.playerName && record.context) {
    return `${record.playerName} · ${record.context}`;
  }
  return record.context || "";
}

function renderRecordSlide(record, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const centerX = contentW / 2;

  if (!record) return null;

  const [labelBand, valueBand, unitBand, contextBand, matchBand] = layoutBands(contentH, [
    { id: "label", height: 40 },
    { id: "value", grow: true, minHeight: 200 },
    { id: "unit", height: 40 },
    { id: "context", height: 40 },
    { id: "match", height: 40 },
  ], 12);

  const valueText = formatRecordValue(record);
  const unitText = formatRecordUnit(record);
  const contextText = formatRecordContext(record);

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: false,
      showBrandingFooter: false,
      slideCount,
      slideIndex,
      theme: ppdEditorial,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 2,
        textAnchor: "middle",
        x: centerX,
        y: labelBand.y + 26,
      }, "BENCH RECORD"),
      React.createElement("text", {
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 120,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: valueBand.y + valueBand.height / 2 + 30,
      }, valueText),
      unitText ? React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 24,
        fontWeight: 600,
        textAnchor: "middle",
        x: centerX,
        y: unitBand.y + 26,
      }, unitText) : null,
      contextText ? React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 18,
        fontWeight: 500,
        textAnchor: "middle",
        x: centerX,
        y: contextBand.y + 26,
      }, contextText) : null,
      React.createElement("text", {
        fill: "#9AA7BD",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 14,
        fontWeight: 400,
        textAnchor: "middle",
        x: centerX,
        y: matchBand.y + 26,
      }, record.matchLabel),
      React.createElement("rect", {
        fill: BENCH_BLUE,
        height: 4,
        rx: 2,
        width: 60,
        x: centerX - 30,
        y: labelBand.y + 36,
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 8: Featured match
// ---------------------------------------------------------------------------

function renderFeaturedMatch(fixture, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const featured = fixture.featured;
  const centerX = contentW / 2;

  const [headlineBand, namesBand, scoreBand, pillsBand, courtBand] = layoutBands(contentH, [
    { id: "headline", height: 80 },
    { id: "names", height: 40 },
    { id: "score", height: 50 },
    { id: "pills", height: 120 },
    { id: "court", grow: true, minHeight: 200 },
  ], 12);

  const surface = featured.surface || "clay";
  const heroStats = featured.heroStats || [];

  const pillW = (contentW - 16) / 2;
  const pillH = 50;
  const pillGap = 12;

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: true,
      slideCount,
      slideIndex,
      subtitle: "Editorial match analysis",
      theme: ppdEditorial,
      title: "Featured story",
    },
    React.createElement(
      "g",
      null,
      React.createElement("text", {
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 28,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: headlineBand.y + 30,
      }, featured.headline || `${featured.hostName} vs ${featured.guestName}`),
      React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 16,
        fontWeight: 500,
        textAnchor: "middle",
        x: centerX,
        y: namesBand.y + 26,
      }, `${featured.hostName} vs ${featured.guestName} · ${surface}`),
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 36,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: scoreBand.y + 34,
      }, featured.setScore),
      heroStats.slice(0, 4).map((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col * (pillW + pillGap);
        const y = pillsBand.y + row * (pillH + pillGap);
        return React.createElement(
          "g",
          { key: stat.key, transform: `translate(${x}, ${y})` },
          React.createElement("rect", {
            fill: "#F0F4FF",
            height: pillH,
            rx: 8,
            width: pillW,
            x: 0,
            y: 0,
          }),
          React.createElement("text", {
            fill: BENCH_NAVY,
            fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            textAnchor: "middle",
            x: pillW / 2,
            y: 24,
          }, stat.value),
          React.createElement("text", {
            fill: "#4A5568",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            textAnchor: "middle",
            x: pillW / 2,
            y: 42,
          }, stat.label),
        );
      }),
      React.createElement(
        "g",
        { transform: `translate(0, ${courtBand.y})` },
        React.createElement(
          Court,
          {
            height: courtBand.height,
            surface,
            theme: ppdEditorial,
            width: contentW,
          },
          React.createElement(DotLayer, {
            colorBy: "stroke",
            scales: createCourtScales({ width: contentW, height: courtBand.height, half: "full", margin: 1.5 }),
            shots: toEnrichedShots(featured.shotPreview),
            theme: ppdEditorial,
          }),
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 9: Featured insight (court hexbin)
// ---------------------------------------------------------------------------

function renderFeaturedInsight(fixture, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const featured = fixture.featured;
  const surface = featured.surface || "clay";

  const [titleBand, courtBand, statsBand] = layoutBands(contentH, [
    { id: "title", height: 80 },
    { id: "court", grow: true, minHeight: 300 },
    { id: "stats", height: 80 },
  ], 12);

  const enrichedShots = toEnrichedShots(featured.shotPreview);
  const heroStats = featured.heroStats || [];
  const stat1 = heroStats[0];
  const stat2 = heroStats[1];

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: true,
      slideCount,
      slideIndex,
      subtitle: "Shot placement from the featured match",
      theme: ppdEditorial,
      title: "Court insight",
    },
    React.createElement(
      "g",
      null,
      React.createElement(
        "g",
        { transform: `translate(0, ${courtBand.y})` },
        React.createElement(
          Court,
          {
            height: courtBand.height,
            surface,
            theme: ppdEditorial,
            width: contentW,
          },
          React.createElement(HexbinLayer, {
            alpha: 0.85,
            colorScale: "count",
            minCount: 1,
            player: "host",
            scales: createCourtScales({ width: contentW, height: courtBand.height, half: "full", margin: 1.5 }),
            shots: enrichedShots,
            theme: ppdEditorial,
          }),
        ),
      ),
      React.createElement(
        "g",
        { transform: `translate(0, ${statsBand.y})` },
        stat1 ? React.createElement(
          "g",
          { transform: `translate(0, 0)` },
          React.createElement("text", {
            fill: BENCH_NAVY,
            fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
            fontSize: 32,
            fontWeight: 700,
            textAnchor: "middle",
            x: contentW / 4,
            y: 28,
          }, stat1.value),
          React.createElement("text", {
            fill: "#4A5568",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            textAnchor: "middle",
            x: contentW / 4,
            y: 52,
          }, stat1.label),
        ) : null,
        stat2 ? React.createElement(
          "g",
          { transform: `translate(${contentW / 2}, 0)` },
          React.createElement("text", {
            fill: BENCH_NAVY,
            fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
            fontSize: 32,
            fontWeight: 700,
            textAnchor: "middle",
            x: contentW / 4,
            y: 28,
          }, stat2.value),
          React.createElement("text", {
            fill: "#4A5568",
            fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            textAnchor: "middle",
            x: contentW / 4,
            y: 52,
          }, stat2.label),
        ) : null,
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Slide 10: CTA
// ---------------------------------------------------------------------------

function renderCta(fixture, branding, slideIndex, slideCount) {
  const format = "portrait";
  const layout = resolveFrameLayout(format);
  const contentW = layout.content.width;
  const contentH = layout.content.height;
  const centerX = contentW / 2;

  const [headlineBand, subBand, urlBand, buttonBand] = layoutBands(contentH, [
    { id: "headline", height: 120 },
    { id: "sub", height: 60 },
    { id: "url", height: 40 },
    { id: "button", grow: true, minHeight: 80 },
  ], 16);

  return React.createElement(
    FigureFrame,
    {
      branding,
      format,
      showBaselineRule: false,
      showBrandingFooter: false,
      slideCount,
      slideIndex,
      theme: ppdEditorial,
      title: undefined,
    },
    React.createElement(
      "g",
      null,
      React.createElement("text", {
        fill: BENCH_NAVY,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 48,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: headlineBand.y + 50,
      }, "Want your matches"),
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Barlow Condensed, Arial Narrow, sans-serif",
        fontSize: 48,
        fontWeight: 700,
        textAnchor: "middle",
        x: centerX,
        y: headlineBand.y + 100,
      }, "on the bench?"),
      React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 18,
        fontWeight: 400,
        textAnchor: "middle",
        x: centerX,
        y: subBand.y + 30,
      }, "Request access to Peak Performance Data"),
      React.createElement("text", {
        fill: "#4A5568",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 18,
        fontWeight: 400,
        textAnchor: "middle",
        x: centerX,
        y: subBand.y + 56,
      }, "and start building your academy's analytics story."),
      React.createElement("text", {
        fill: BENCH_BLUE,
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        fontSize: 16,
        fontWeight: 600,
        textAnchor: "middle",
        x: centerX,
        y: urlBand.y + 26,
      }, "peakperformancedata.app/tennis-bench"),
      React.createElement(
        "g",
        { transform: `translate(${centerX - 140}, ${buttonBand.y + 20})` },
        React.createElement("rect", {
          fill: BENCH_BLUE,
          height: 56,
          rx: 28,
          width: 280,
          x: 0,
          y: 0,
        }),
        React.createElement("text", {
          fill: "#FFFFFF",
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 20,
          fontWeight: 600,
          textAnchor: "middle",
          x: 140,
          y: 36,
        }, "Request invitation →"),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Builder dispatcher
// ---------------------------------------------------------------------------

function buildSlide(slideId, fixture, branding, slideIndex, slideCount) {
  const builders = {
    "cover": () => renderCover(fixture, branding, slideIndex, slideCount),
    "scale": () => renderScale(fixture, branding, slideIndex, slideCount),
    "live-bench": () => renderLiveBench(fixture, branding, slideIndex, slideCount),
    "record-fastest-serve": () => renderRecordSlide(findRecord(fixture, "fastestServe"), branding, slideIndex, slideCount),
    "record-longest-rally": () => renderRecordSlide(findRecord(fixture, "longestRally"), branding, slideIndex, slideCount),
    "record-best-break": () => renderRecordSlide(findRecord(fixture, "bestBreakConv"), branding, slideIndex, slideCount),
    "record-top-points": () => renderRecordSlide(findRecord(fixture, "topPointsWon"), branding, slideIndex, slideCount),
    "featured-match": () => renderFeaturedMatch(fixture, branding, slideIndex, slideCount),
    "featured-insight": () => renderFeaturedInsight(fixture, branding, slideIndex, slideCount),
    "cta": () => renderCta(fixture, branding, slideIndex, slideCount),
  };

  const builder = builders[slideId];
  if (!builder) throw new Error(`Unknown bench post slide: ${slideId}`);
  return builder();
}

module.exports = {
  buildSlide,
  resolveBranding,
  toEnrichedShots,
};
