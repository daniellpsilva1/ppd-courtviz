/**
 * Generate frozen bench-landing.json fixture from Boluda demo data.
 *
 * Replicates the same logic as the app's getDemoBenchListResponse() to produce
 * a BenchListResponse-shaped JSON that the bench-posts export pipeline reads.
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const {
  enrichShots,
  extractPointsForMomentum,
  match,
  points,
  sets,
  shots,
  stats,
  guestName,
  hostName,
  matchDate,
  momentumPoints,
  surface,
} = require("@courtviz/data");

const {
  computePointsWonRate,
  computeFirstServeInRate,
  computeBreakPointConversion,
} = require("@courtviz/core");

const MIN_SERVE_SPEED_KMH = 40;
const MAX_SERVE_SPEED_KMH = 215;

function isPlausibleServeSpeed(speed) {
  return speed >= MIN_SERVE_SPEED_KMH && speed <= MAX_SERVE_SPEED_KMH;
}

function filterPlausibleServeSpeeds(speeds) {
  const plausible = speeds.filter(isPlausibleServeSpeed);
  if (plausible.length >= 3) return plausible;
  const sorted = [...speeds].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const iqrCap = q3 + 1.5 * (q3 - q1);
  return speeds.filter(
    (speed) => speed > 0 && speed <= Math.min(MAX_SERVE_SPEED_KMH, iqrCap || MAX_SERVE_SPEED_KMH),
  );
}

function toShotPreview() {
  return shots.slice(0, 120).map((shot) => ({
    bounce_x: shot.bounceX ?? null,
    bounce_y: shot.bounceY ?? null,
    direction: shot.direction ?? null,
    game_number: shot.gameNumber,
    hit_x: shot.hitX ?? null,
    hit_y: shot.hitY ?? null,
    id: `${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}-${shot.shotNumber}`,
    player: shot.player,
    point_number: shot.pointNumber,
    result: shot.result ?? null,
    set_number: shot.setNumber,
    shot_number: shot.shotNumber,
    speed_kmh: shot.speedKmh ?? null,
    spin: shot.spin ?? null,
    stroke: shot.stroke ?? null,
    type: shot.type ?? null,
  }));
}

function pctValue(rate) {
  return `${Math.round(rate * 1000) / 10}%`;
}

function resolvePlayerName(summary, player) {
  if (player === "host") return summary.hostName;
  if (player === "guest") return summary.guestName;
  return player ?? "Player";
}

function resolveServeType(type) {
  if (!type) return "other";
  const normalized = type.toLowerCase();
  if (normalized.includes("first")) return "first";
  if (normalized.includes("second")) return "second";
  return "other";
}

function formatMatchLabel(summary) {
  return `${summary.hostName} vs ${summary.guestName}`;
}

function computeDominantSurface(matches) {
  const counts = new Map();
  for (const m of matches) {
    const key = m.surface ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "hard";
}

function samplePooledShots(matches, cap = 600) {
  const all = matches.flatMap((m) => m.shotPreview ?? []);
  if (all.length <= cap) return all;
  const step = Math.ceil(all.length / cap);
  return all.filter((_, index) => index % step === 0).slice(0, cap);
}

function computeBenchRecords(summary, enrichedShots, momentumPts) {
  let fastestServe = null;
  let longestRally = null;
  let bestBreakConv = null;
  let topPointsWon = null;

  const matchLabel = formatMatchLabel(summary);

  const serveSpeeds = shots
    .filter((s) => s.stroke === "Serve" && s.speedKmh != null)
    .map((s) => s.speedKmh);
  const plausibleSpeeds = filterPlausibleServeSpeeds(serveSpeeds);

  for (const shot of shots) {
    if (shot.stroke !== "Serve" || shot.speedKmh == null) continue;
    if (!plausibleSpeeds.includes(shot.speedKmh)) continue;
    if (!fastestServe || shot.speedKmh > fastestServe.valueNumeric) {
      fastestServe = {
        labelKey: "fastestServe",
        matchLabel,
        playerName: resolvePlayerName(summary, shot.player),
        serveType: resolveServeType(shot.type),
        slug: summary.slug,
        value: String(Math.round(shot.speedKmh)),
        valueNumeric: shot.speedKmh,
      };
    }
  }

  const rallyByPoint = new Map();
  for (const shot of shots) {
    const key = `${shot.setNumber}-${shot.gameNumber}-${shot.pointNumber}`;
    rallyByPoint.set(key, Math.max(rallyByPoint.get(key) ?? 0, shot.shotNumber));
  }
  for (const [key, rallyLength] of rallyByPoint) {
    if (!longestRally || rallyLength > longestRally.valueNumeric) {
      const [setNumber, gameNumber] = key.split("-");
      longestRally = {
        labelKey: "longestRally",
        matchLabel,
        rallyGame: Number(gameNumber),
        rallySet: Number(setNumber),
        slug: summary.slug,
        value: String(rallyLength),
        valueNumeric: rallyLength,
      };
    }
  }

  for (const player of ["host", "guest"]) {
    const playerName = resolvePlayerName(summary, player);
    const pointsRate = computePointsWonRate(momentumPts, player);
    const pointsPct = pointsRate.rate * 100;
    if (pointsRate.total > 0 && (!topPointsWon || pointsPct > topPointsWon.valueNumeric)) {
      topPointsWon = {
        context: summary.setScore,
        labelKey: "topPointsWon",
        matchLabel,
        playerName,
        slug: summary.slug,
        value: pctValue(pointsRate.rate),
        valueNumeric: pointsPct,
      };
    }

    const breakRate = computeBreakPointConversion(enrichedShots, player);
    const breakPct = breakRate.rate * 100;
    if (breakRate.total > 0 && (!bestBreakConv || breakPct > bestBreakConv.valueNumeric)) {
      bestBreakConv = {
        context: summary.setScore,
        labelKey: "bestBreakConv",
        matchLabel,
        playerName,
        slug: summary.slug,
        value: pctValue(breakRate.rate),
        valueNumeric: breakPct,
      };
    }
  }

  return [fastestServe, longestRally, bestBreakConv, topPointsWon].filter(
    (r) => r != null,
  );
}

function main() {
  const setScore = sets.map((s) => `${s.hostScore}-${s.guestScore}`).join(" · ");
  const hostSetsWon = sets.filter((s) => s.hostScore > s.guestScore).length;
  const guestSetsWon = sets.filter((s) => s.guestScore > s.hostScore).length;
  const shotPreview = toShotPreview();

  const enrichedShotsData = enrichShots(shots, points);
  const momentumPts = extractPointsForMomentum(points);

  const pointsRate = computePointsWonRate(momentumPts, "host");
  const firstServeRate = computeFirstServeInRate(enrichedShotsData, "host");
  const breakRate = computeBreakPointConversion(enrichedShotsData, "host");

  const summary = {
    guestName,
    guestSetsWon,
    headline: "Quevedo's court patterns defined the match on clay",
    heroStats: [
      { key: "points_won_pct", label: "Points won", value: pctValue(pointsRate.rate) },
      { key: "first_serve_pct", label: "1st serve in", value: pctValue(firstServeRate.rate) },
      { key: "break_points_converted_pct", label: "Break conv.", value: pctValue(breakRate.rate) },
      { key: "total_shots", label: "Tracked shots", value: String(shots.length) },
    ],
    hostName,
    hostSetsWon,
    id: match.id,
    isDoubles: false,
    matchDate: matchDate || "2025-04-09",
    processedAt: new Date().toISOString(),
    setScore,
    shotCount: shots.length,
    shotPreview,
    slug: "demo-boluda-clay-2025-04-09",
    source: "swingvision",
    surface: surface ?? "clay",
    totalPoints: points.length,
  };

  const records = computeBenchRecords(summary, enrichedShotsData, momentumPts);

  const fixture = {
    aggregates: {
      dominantSurface: computeDominantSurface([summary]),
      publishedCount: 1,
      totalMatches: 1,
      totalPoints: points.length,
      totalShots: shots.length,
      matchesWithVideo: 1,
    },
    featured: summary,
    matches: [summary],
    pooledShots: samplePooledShots([summary]),
    records,
  };

  const outPath = path.resolve(__dirname, "..", "packages", "data", "src", "fixtures", "bench-landing.json");
  fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2), "utf-8");

  const hash = require("crypto").createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 12);
  console.log(`✅ Frozen fixture written to ${outPath}`);
  console.log(`   Fixture hash: ${hash}`);
  console.log(`   Records: ${records.map((r) => r.labelKey).join(", ")}`);
  console.log(`   Aggregates: ${JSON.stringify(fixture.aggregates)}`);
}

main();
