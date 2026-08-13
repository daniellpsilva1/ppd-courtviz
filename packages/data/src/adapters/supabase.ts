/**
 * Map Supabase tennis_match_* rows (snake_case) to CourtViz Zod schemas (camelCase).
 * Logic aligned with scripts/generate-fixtures.cjs.
 */

import {
  GameSchema,
  MatchSchema,
  PlayerStatSchema,
  PointSchema,
  SetSummarySchema,
  ShotSchema,
  type Game,
  type Match,
  type PlayerStat,
  type Point,
  type SetSummary,
  type Shot,
} from "../schema";

type Row = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function pickString(row: Row, snake: string, camel: string): string | undefined {
  const v = row[camel] ?? row[snake];
  return v != null ? String(v) : undefined;
}

function pickNullableString(row: Row, snake: string, camel: string): string | null {
  const v = row[camel] ?? row[snake];
  if (v == null) return null;
  return String(v);
}

export function adaptMatchRow(row: Row): Match {
  const hostNames = row.hostPlayerNames ?? row.host_player_names;
  const guestNames = row.guestPlayerNames ?? row.guest_player_names;
  return MatchSchema.parse({
    id: row.id,
    hostPlayerNames: Array.isArray(hostNames) ? hostNames : null,
    guestPlayerNames: Array.isArray(guestNames) ? guestNames : null,
    surface: pickString(row, "surface", "surface") ?? "hard",
    matchDate: pickString(row, "match_date", "matchDate"),
    createdAt: pickString(row, "created_at", "createdAt"),
  });
}

export function adaptSetRow(row: Row, matchId: string): SetSummary {
  return SetSummarySchema.parse({
    matchId: pickString(row, "match_id", "matchId") ?? matchId,
    setNumber: Number(row.setNumber ?? row.set_number),
    hostScore: Number(row.hostScore ?? row.host_score),
    guestScore: Number(row.guestScore ?? row.guest_score),
    hostTiebreakScore: toNumber(row.hostTiebreakScore ?? row.host_tiebreak),
    guestTiebreakScore: toNumber(row.guestTiebreakScore ?? row.guest_tiebreak),
  });
}

export function adaptGameRow(row: Row, matchId: string): Game {
  const hostGame =
    row.hostGameScore ??
    row.host_game_score ??
    (row.host_set_score != null ? String(row.host_set_score) : null);
  const guestGame =
    row.guestGameScore ??
    row.guest_game_score ??
    (row.guest_set_score != null ? String(row.guest_set_score) : null);

  return GameSchema.parse({
    matchId: pickString(row, "match_id", "matchId") ?? matchId,
    setNumber: Number(row.setNumber ?? row.set_number),
    gameNumber: Number(row.gameNumber ?? row.game_number),
    hostGameScore: hostGame != null ? String(hostGame) : null,
    guestGameScore: guestGame != null ? String(guestGame) : null,
    matchServer: pickNullableString(row, "match_server", "matchServer") ??
      pickNullableString(row, "server", "server"),
  });
}

export function adaptPointRow(row: Row, matchId: string): Point {
  return PointSchema.parse({
    id: pickString(row, "id", "id"),
    matchId: pickString(row, "match_id", "matchId") ?? matchId,
    setNumber: Number(row.setNumber ?? row.set_number),
    gameNumber: Number(row.gameNumber ?? row.game_number),
    pointNumber: Number(row.pointNumber ?? row.point_number),
    pointWinner: pickNullableString(row, "point_winner", "pointWinner"),
    rallyLength: toNumber(row.rallyLength ?? row.rally_length),
    endedBy: pickNullableString(row, "ended_by", "endedBy"),
    breakPoint: toBool(row.breakPoint ?? row.break_point),
    setPoint: toBool(row.setPoint ?? row.set_point),
    matchPoint: toBool(row.matchPoint ?? row.match_point),
    deuce: toBool(row.deuce),
    tiebreak: toBool(row.tiebreak),
    superTiebreak: toBool(row.superTiebreak ?? row.super_tiebreak),
    serverSide: pickNullableString(row, "server_side", "serverSide"),
    serveAttempt: toNumber(row.serveAttempt ?? row.serve_attempt),
    durationSec: toNumber(row.durationSec ?? row.duration_sec),
    videoTimeSec: toNumber(row.videoTimeSec ?? row.video_time_sec),
  });
}

export function adaptShotRow(row: Row, matchId: string): Shot {
  return ShotSchema.parse({
    id: pickString(row, "id", "id"),
    matchId: pickString(row, "match_id", "matchId") ?? matchId,
    setNumber: Number(row.setNumber ?? row.set_number),
    gameNumber: Number(row.gameNumber ?? row.game_number),
    pointNumber: Number(row.pointNumber ?? row.point_number),
    shotNumber: Number(row.shotNumber ?? row.shot_number),
    player: String(row.player),
    stroke: String(row.stroke),
    type: pickNullableString(row, "type", "type"),
    spin: pickNullableString(row, "spin", "spin"),
    result: String(row.result),
    speedKmh: toNumber(row.speedKmh ?? row.speed_kmh),
    bounceX: toNumber(row.bounceX ?? row.bounce_x),
    bounceY: toNumber(row.bounceY ?? row.bounce_y),
    hitX: toNumber(row.hitX ?? row.hit_x),
    hitY: toNumber(row.hitY ?? row.hit_y),
    hitZ: toNumber(row.hitZ ?? row.hit_z),
    bounceZone: pickNullableString(row, "bounce_zone", "bounceZone"),
    bounceSide: pickNullableString(row, "bounce_side", "bounceSide"),
    bounceDepth: pickNullableString(row, "bounce_depth", "bounceDepth"),
    hitZone: pickNullableString(row, "hit_zone", "hitZone"),
    hitSide: pickNullableString(row, "hit_side", "hitSide"),
    hitDepth: pickNullableString(row, "hit_depth", "hitDepth"),
    direction: pickNullableString(row, "direction", "direction"),
    isTerminal: toBool(row.isTerminal ?? row.is_terminal),
    placementZone: pickNullableString(row, "placement_zone", "placementZone"),
    shotAttribution: pickNullableString(row, "shot_attribution", "shotAttribution"),
    startTime: pickNullableString(row, "start_time", "startTime"),
    videoTimeSec: toNumber(row.videoTimeSec ?? row.video_time_sec),
  });
}

export function adaptStatRow(row: Row): PlayerStat {
  const matchId = String(row.matchId ?? row.match_id);
  return PlayerStatSchema.parse({
    matchId,
    player: String(row.player),
    setNumber: Number(row.setNumber ?? row.set_number),
    statName: String(row.statName ?? row.stat_name),
    statValue: Number(row.statValue ?? row.stat_value),
  });
}

/** Transform raw Supabase fetch result into validated MatchData pieces. */
export function adaptSupabaseMatchData(raw: {
  match: Row;
  sets: Row[];
  games: Row[];
  points: Row[];
  shots: Row[];
  stats: Row[];
}): {
  match: Match;
  sets: SetSummary[];
  games: Game[];
  points: Point[];
  shots: Shot[];
  stats: PlayerStat[];
} {
  const matchId = String(raw.match.id);
  return {
    match: adaptMatchRow(raw.match),
    sets: raw.sets.map((r) => adaptSetRow(r, matchId)),
    games: raw.games.map((r) => adaptGameRow(r, matchId)),
    points: raw.points.map((r) => adaptPointRow(r, matchId)),
    shots: raw.shots.map((r) => adaptShotRow(r, matchId)),
    stats: raw.stats.map((r) => adaptStatRow(r)),
  };
}
