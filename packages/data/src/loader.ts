/**
 * Data loaders for tennis match data.
 *
 * Supports loading from Supabase or from local JSON cache files.
 * The cache format is versioned for forward compatibility.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adaptSupabaseMatchData } from "./adapters/supabase";
import { MatchDataSchema, type MatchData } from "./schema";

const CACHE_VERSION = 1;

export interface LoadOptions {
  /** Supabase URL (required for live loading) */
  supabaseUrl?: string;
  /** Supabase anon key */
  supabaseKey?: string;
  /** Existing Supabase client */
  supabaseClient?: SupabaseClient;
  /** Path to local cache directory */
  cacheDir?: string;
}

/**
 * Load a match with all related data from Supabase.
 *
 * Fetches: match, sets, games, points, shots, stats.
 * Returns validated, typed data.
 */
export async function loadMatch(
  matchId: string,
  options: LoadOptions,
): Promise<MatchData> {
  const client = options.supabaseClient ?? createClient(
    options.supabaseUrl ?? "",
    options.supabaseKey ?? "",
  );

  const [matchRow, setsRows, gamesRows, pointsRows, shotsRows, statsRows] =
    await Promise.all([
      fetchMatchRow(client, matchId),
      fetchSetRows(client, matchId),
      fetchGameRows(client, matchId),
      fetchPointRows(client, matchId),
      fetchShotRows(client, matchId),
      fetchStatRows(client, matchId),
    ]);

  const adapted = adaptSupabaseMatchData({
    match: matchRow,
    sets: setsRows,
    games: gamesRows,
    points: pointsRows,
    shots: shotsRows,
    stats: statsRows,
  });
  return MatchDataSchema.parse(adapted);
}

/**
 * Load a match from a local JSON cache file.
 *
 * Cache format: { version, matchId, match, sets, games, points, shots, stats }
 */
export async function loadMatchFromCache(
  filePath: string,
): Promise<MatchData> {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (parsed.version !== CACHE_VERSION) {
    console.warn(`Cache version mismatch: expected ${CACHE_VERSION}, got ${parsed.version}`);
  }

  return MatchDataSchema.parse({
    match: parsed.match,
    sets: parsed.sets,
    games: parsed.games,
    points: parsed.points,
    shots: parsed.shots,
    stats: parsed.stats,
  });
}

/**
 * Save match data to a local JSON cache file.
 */
export async function saveMatchToCache(
  filePath: string,
  data: MatchData,
): Promise<void> {
  const fs = await import("node:fs/promises");
  const cache = {
    version: CACHE_VERSION,
    matchId: data.match.id,
    ...data,
  };
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf-8");
}

// --- Supabase fetchers ---

type DbRow = Record<string, unknown>;

async function fetchMatchRow(
  client: SupabaseClient,
  matchId: string,
): Promise<DbRow> {
  const { data, error } = await client
    .from("tennis_matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (error) throw new Error(`Failed to fetch match: ${error.message}`);
  return data as DbRow;
}

async function fetchSetRows(
  client: SupabaseClient,
  matchId: string,
): Promise<DbRow[]> {
  const { data, error } = await client
    .from("tennis_match_sets")
    .select("*")
    .eq("match_id", matchId)
    .order("set_number");
  if (error) throw new Error(`Failed to fetch sets: ${error.message}`);
  return (data ?? []) as DbRow[];
}

async function fetchGameRows(
  client: SupabaseClient,
  matchId: string,
): Promise<DbRow[]> {
  const { data, error } = await client
    .from("tennis_match_games")
    .select("*")
    .eq("match_id", matchId)
    .order("set_number, game_number");
  if (error) throw new Error(`Failed to fetch games: ${error.message}`);
  return (data ?? []) as DbRow[];
}

async function fetchPointRows(
  client: SupabaseClient,
  matchId: string,
): Promise<DbRow[]> {
  const { data, error } = await client
    .from("tennis_match_points")
    .select("*")
    .eq("match_id", matchId)
    .order("set_number, game_number, point_number");
  if (error) throw new Error(`Failed to fetch points: ${error.message}`);
  return (data ?? []) as DbRow[];
}

async function fetchShotRows(
  client: SupabaseClient,
  matchId: string,
): Promise<DbRow[]> {
  const { data, error } = await client
    .from("tennis_match_shots")
    .select("*")
    .eq("match_id", matchId)
    .order("set_number, game_number, point_number, shot_number");
  if (error) throw new Error(`Failed to fetch shots: ${error.message}`);
  return (data ?? []) as DbRow[];
}

async function fetchStatRows(
  client: SupabaseClient,
  matchId: string,
): Promise<DbRow[]> {
  const { data, error } = await client
    .from("tennis_match_stats")
    .select("*")
    .eq("match_id", matchId);
  if (error) throw new Error(`Failed to fetch stats: ${error.message}`);
  return (data ?? []) as DbRow[];
}
