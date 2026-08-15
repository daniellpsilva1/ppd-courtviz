/**
 * Pure, deterministic slide selector for per-match bench post decks.
 *
 * Filters the 55-slide catalog to ≤12 slides based on:
 *   1. Per-match eligibility gates (enough data for the slide to be meaningful)
 *   2. Preference weights (prioritize high-value slides when data is rich)
 *   3. Anti-repeat from previous decks (penalize slides used recently)
 *
 * I/O-free: all data is passed in.  Callers supply a `context` matching
 * the shape returned by `load-match-data.cjs` and an optional
 * `previousDecks` array of slide-id arrays.
 */

const { BENCH_POSTS_SLIDES } = require("./bench-posts-slides.cjs");

const MAX_SLIDES = 12;

// --- Section layout (from bench-posts-slides.cjs) ---
const SECTIONS = ["Open", "Serve", "Patterns", "Outcomes", "Pressure", "Close"];

// --- Sample floors (from generate-coach-insights.ts) ---
const MIN_ZONE = 20;
const MIN_SERVE = 10;
const MIN_RALLY_SHORT = 3;
const MIN_RALLY_MEDIUM = 4;
const MIN_RALLY_LONG = 7;
const MIN_FLOW = 5;
const MIN_VOLLEY = 3;
const MIN_DEPTH = 5;

// --- Slides that are always eligible (no data gate) ---
const ALWAYS_ELIGIBLE = new Set([
  "cover",
  "cta",
  "cta-court",
  "match-dna",
  "head-to-head-courts",
]);

/**
 * Compute eligibility for each slide based on match context.
 * Returns a Map<string, boolean>.
 */
function computeEligibility(ctx) {
  const shots = ctx.enrichedShots ?? [];
  const points = ctx.points ?? [];
  const sets = ctx.sets ?? [];

  const serveShots = shots.filter((s) => s.stroke === "Serve");
  const inShots = shots.filter((s) => s.result === "In");
  const volleyShots = shots.filter(
    (s) => s.stroke === "Volley" || s.stroke === "Approach",
  );
  const depthShots = inShots.filter((s) => s.bounceY != null);
  const zoneShots = inShots.filter((s) => s.bounceZone != null);
  const flowShots = inShots.filter(
    (s) =>
      s.direction != null &&
      ["crosscourt", "downTheLine", "insideOut", "insideIn"].includes(
        s.direction,
      ),
  );

  const rallyLengths = points
    .map((p) => p.rallyLength ?? p.rally_length ?? 0)
    .filter((r) => r > 0);
  const shortRallies = rallyLengths.filter((r) => r <= 3);
  const mediumRallies = rallyLengths.filter((r) => r >= 4 && r <= 6);
  const longRallies = rallyLengths.filter((r) => r >= 7);

  const hasMultipleSets = sets.length >= 2;

  const gates = {
    // Open
    "cover": true,
    "match-snapshot": shots.length > 0,
    "territory-host": depthShots.filter((s) => s.player === "host").length >= MIN_DEPTH,
    "territory-guest": depthShots.filter((s) => s.player === "guest").length >= MIN_DEPTH,
    "court-insight": points.length >= 10,

    // Serve
    "serve-map-host": serveShots.filter((s) => s.player === "host").length >= MIN_SERVE,
    "serve-map-guest": serveShots.filter((s) => s.player === "guest").length >= MIN_SERVE,
    "serve-zones-heat": serveShots.length >= MIN_SERVE,
    "serve-1st-vs-2nd": serveShots.length >= MIN_SERVE,
    "serve-speed-court-host": serveShots.filter((s) => s.player === "host" && s.speedKmh != null).length >= 3,
    "serve-speed-court-guest": serveShots.filter((s) => s.player === "guest" && s.speedKmh != null).length >= 3,
    "serve-plus-one": inShots.length >= MIN_FLOW,
    "return-placement": inShots.length >= MIN_FLOW,
    "fastest-serve": serveShots.filter((s) => s.speedKmh != null && s.speedKmh > 0).length >= 3,

    // Patterns
    "stroke-dots-host": inShots.filter((s) => s.player === "host").length >= MIN_DEPTH,
    "stroke-dots-guest": inShots.filter((s) => s.player === "guest").length >= MIN_DEPTH,
    "forehand-map": inShots.filter((s) => s.stroke === "Forehand").length >= MIN_DEPTH,
    "backhand-map": inShots.filter((s) => s.stroke === "Backhand").length >= MIN_DEPTH,
    "crosscourt-flows": flowShots.length >= MIN_FLOW,
    "down-the-line-flows": flowShots.filter((s) => s.direction === "downTheLine").length >= MIN_FLOW,
    "inside-out-in": flowShots.filter((s) => s.direction === "insideOut" || s.direction === "insideIn").length >= MIN_FLOW,
    "depth-bands": depthShots.length >= MIN_DEPTH,
    "depth-angle": depthShots.length >= MIN_DEPTH,
    "approach-net": volleyShots.length >= MIN_VOLLEY,
    "volley-map": volleyShots.filter((s) => s.stroke === "Volley").length >= MIN_VOLLEY,

    // Outcomes
    "winners-host": shots.filter((s) => s.player === "host" && s.isTerminal).length >= 5,
    "winners-guest": shots.filter((s) => s.player === "guest" && s.isTerminal).length >= 5,
    "errors-out": shots.filter((s) => s.result === "Out").length >= 5,
    "errors-net": shots.filter((s) => s.result === "Net").length >= 3,
    "zone-win-host": zoneShots.filter((s) => s.player === "host").length >= MIN_ZONE,
    "zone-win-guest": zoneShots.filter((s) => s.player === "guest").length >= MIN_ZONE,
    "first-strike-court": shortRallies.length >= MIN_RALLY_SHORT,
    "rally-short": shortRallies.length >= MIN_RALLY_SHORT,
    "rally-medium": mediumRallies.length >= MIN_RALLY_MEDIUM,
    "rally-long": longRallies.length >= MIN_RALLY_LONG,

    // Pressure
    "break-points-court": points.filter((p) => p.isBreakPoint).length >= 3,
    "clutch-points": points.filter((p) => p.isBreakPoint || p.isSetPoint || p.isMatchPoint).length >= 3,
    "set-1-density": sets.length >= 1 && depthShots.length >= MIN_DEPTH,
    "set-2-density": hasMultipleSets && depthShots.length >= MIN_DEPTH,
    "momentum-court": points.length >= 10,
    "longest-rally": longRallies.length >= 1,
    "top-points": points.filter((p) => p.isBreakPoint || p.isSetPoint || p.isMatchPoint).length >= 3,
    "featured-story": shots.length >= 20,
    "coach-insight-1": shots.length >= 20,
    "momentum-swing": points.length >= 10,
    "hex-efficiency": zoneShots.length >= MIN_ZONE,
    "zone-bars": zoneShots.length >= MIN_ZONE,
    "serve-diamond": serveShots.length >= MIN_SERVE,
    "error-profile": shots.filter((s) => s.result === "Out" || s.result === "Net").length >= 5,

    // Close
    "coach-insight-2": shots.length >= 20,
    "coach-insight-3": shots.length >= 20,
    "head-to-head-courts": depthShots.length >= MIN_DEPTH,
    "match-dna": shots.length > 0,
    "cta-court": true,
    "cta": true,
  };

  return gates;
}

// --- Preference weights (higher = more likely to be picked) ---
const PREFERENCE_WEIGHTS = {
  "cover": 100,
  "match-snapshot": 90,
  "court-insight": 80,
  "serve-map-host": 70,
  "serve-map-guest": 70,
  "serve-1st-vs-2nd": 65,
  "momentum-court": 65,
  "break-points-court": 60,
  "featured-story": 60,
  "coach-insight-1": 55,
  "crosscourt-flows": 55,
  "depth-angle": 50,
  "zone-win-host": 50,
  "zone-win-guest": 50,
  "winners-host": 45,
  "winners-guest": 45,
  "first-strike-court": 45,
  "territory-host": 40,
  "territory-guest": 40,
  "stroke-dots-host": 40,
  "stroke-dots-guest": 40,
  "forehand-map": 40,
  "backhand-map": 40,
  "rally-short": 35,
  "rally-medium": 35,
  "rally-long": 35,
  "clutch-points": 35,
  "top-points": 35,
  "fastest-serve": 30,
  "longest-rally": 30,
  "serve-speed-court-host": 30,
  "serve-speed-court-guest": 30,
  "serve-zones-heat": 30,
  "serve-plus-one": 30,
  "return-placement": 30,
  "depth-bands": 30,
  "inside-out-in": 30,
  "down-the-line-flows": 25,
  "approach-net": 25,
  "volley-map": 25,
  "errors-out": 25,
  "errors-net": 25,
  "set-1-density": 25,
  "set-2-density": 25,
  "momentum-swing": 25,
  "hex-efficiency": 25,
  "zone-bars": 25,
  "serve-diamond": 25,
  "error-profile": 25,
  "coach-insight-2": 20,
  "coach-insight-3": 20,
  "head-to-head-courts": 20,
  "match-dna": 20,
  "cta-court": 15,
  "cta": 100,
};

// --- Section budget: how many slides per section (totals ≤12) ---
const SECTION_BUDGETS = {
  "Open": 3,
  "Serve": 2,
  "Patterns": 2,
  "Outcomes": 2,
  "Pressure": 2,
  "Close": 1,
};

/**
 * Select ≤12 slides for a match deck.
 *
 * @param {object} context - Match context from load-match-data.cjs
 * @param {object} [options]
 * @param {number} [options.maxSlides=12]
 * @param {Array<string[]>} [options.previousDecks=[]] - Arrays of slide IDs from previous decks
 * @returns {string[]} - Selected slide IDs in catalog order
 */
function selectSlides(context, options = {}) {
  const maxSlides = options.maxSlides ?? MAX_SLIDES;
  const previousDecks = options.previousDecks ?? [];

  const eligibility = computeEligibility(context);

  // Anti-repeat: count how many times each slide appeared in previous decks
  const slideUsage = new Map();
  for (const deck of previousDecks) {
    for (const id of deck) {
      slideUsage.set(id, (slideUsage.get(id) ?? 0) + 1);
    }
  }

  // Build candidate list: eligible slides with score = weight - usage penalty
  const candidates = BENCH_POSTS_SLIDES.filter((slide) => eligibility[slide.id])
    .map((slide) => {
      const weight = PREFERENCE_WEIGHTS[slide.id] ?? 10;
      const usagePenalty = (slideUsage.get(slide.id) ?? 0) * 15;
      return {
        id: slide.id,
        score: weight - usagePenalty,
        section: slide.section,
      };
    });

  // Group by section and pick top-scoring within each section's budget
  const selected = [];
  for (const section of SECTIONS) {
    const budget = SECTION_BUDGETS[section] ?? 0;
    const sectionCandidates = candidates
      .filter((c) => c.section === section)
      .sort((a, b) => b.score - a.score);

    for (const candidate of sectionCandidates.slice(0, budget)) {
      selected.push(candidate);
    }
  }

  // If we're under maxSlides, fill from remaining candidates by score
  if (selected.length < maxSlides) {
    const selectedIds = new Set(selected.map((c) => c.id));
    const remaining = candidates
      .filter((c) => !selectedIds.has(c.id))
      .sort((a, b) => b.score - a.score);

    for (const candidate of remaining) {
      if (selected.length >= maxSlides) break;
      selected.push(candidate);
    }
  }

  // If we're over maxSlides, trim by lowest score
  if (selected.length > maxSlides) {
    selected.sort((a, b) => b.score - a.score);
    selected.length = maxSlides;
  }

  // Return in catalog order
  const selectedIds = new Set(selected.map((c) => c.id));
  return BENCH_POSTS_SLIDES.filter((s) => selectedIds.has(s.id)).map((s) => s.id);
}

module.exports = {
  MAX_SLIDES,
  SECTIONS,
  SECTION_BUDGETS,
  PREFERENCE_WEIGHTS,
  computeEligibility,
  selectSlides,
};
