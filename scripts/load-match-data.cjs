/**
 * Load match data for export/video pipelines.
 * Defaults to Boluda fixtures; supports --matchId (Supabase) or --cache (JSON).
 */

const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const { enrichShots, extractPointsForMomentum } = require("@courtviz/data");

function parseArg(prefix) {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return arg ? arg.split("=")[1] : undefined;
}

function normalizeSurface(surface) {
  const value = (surface ?? "hard").toLowerCase();
  if (value === "clay" || value === "grass" || value === "hard") return value;
  return "hard";
}

function loadFromBoludaFixtures() {
  const fixtures = require("@courtviz/data");
  console.warn(
    "[courtviz] Using Boluda fixture data. Pass --matchId or --cache for a live match.",
  );
  return {
    enrichedShots: fixtures.enrichedShots,
    guestName: fixtures.guestName,
    hostName: fixtures.hostName,
    matchDate: fixtures.matchDate,
    matchId: fixtures.match.id,
    momentumPoints: fixtures.momentumPoints,
    points: fixtures.points,
    sets: fixtures.sets,
    shots: fixtures.shots,
    stats: fixtures.stats ?? [],
    surface: normalizeSurface(fixtures.surface),
    usingFixture: true,
  };
}

async function loadFromCache(cachePath) {
  const { loadMatchFromCache } = require("@courtviz/data");
  const data = await loadMatchFromCache(cachePath);
  return toExportContext(data);
}

async function loadFromSupabase(matchId) {
  const { loadMatch } = require("@courtviz/data");
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key) required for --matchId");
  }
  const data = await loadMatch(matchId, { supabaseKey: key, supabaseUrl: url });
  return toExportContext(data);
}

function toExportContext(data) {
  const hostName = data.match.hostPlayerNames?.[0] ?? "Host";
  const guestName = data.match.guestPlayerNames?.[0] ?? "Guest";
  const enrichedShots = enrichShots(data.shots, data.points);
  const momentumPoints = extractPointsForMomentum(data.points);

  return {
    enrichedShots,
    guestName,
    hostName,
    matchDate: data.match.matchDate ?? "",
    matchId: data.match.id,
    momentumPoints,
    points: data.points,
    sets: data.sets,
    shots: data.shots,
    stats: data.stats ?? [],
    surface: normalizeSurface(data.match.surface),
    usingFixture: false,
  };
}

async function loadMatchContext() {
  const matchId = parseArg("--matchId");
  const cachePath = parseArg("--cache");

  if (cachePath) return loadFromCache(path.resolve(cachePath));
  if (matchId) return loadFromSupabase(matchId);
  return loadFromBoludaFixtures();
}

module.exports = { loadMatchContext, normalizeSurface };
