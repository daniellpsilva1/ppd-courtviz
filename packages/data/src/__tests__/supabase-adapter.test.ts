import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  adaptMatchRow,
  adaptSetRow,
  adaptShotRow,
  adaptStatRow,
  adaptSupabaseMatchData,
} from "../adapters/supabase";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const rawDir = join(repoRoot, "data/raw");
const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

const BOLUDA_MATCH_ID = "f6cd7d61-fc69-4dfc-8336-2c90a4ced93a";

describe("supabase adapter", () => {
  it("maps shot rows like generate-fixtures.cjs", () => {
    const rawShots = JSON.parse(
      readFileSync(join(rawDir, "shots_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];
    const fixtureShots = JSON.parse(
      readFileSync(join(fixtureDir, "shots_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];

    const adapted = adaptShotRow(rawShots[0]!, BOLUDA_MATCH_ID);
    const expected = fixtureShots[0]!;

    expect(adapted.matchId).toBe(expected.matchId);
    expect(adapted.setNumber).toBe(expected.setNumber);
    expect(adapted.bounceX).toBe(expected.bounceX);
    expect(adapted.bounceY).toBe(expected.bounceY);
    expect(adapted.speedKmh).toBe(expected.speedKmh);
    expect(adapted.isTerminal).toBe(expected.isTerminal);
  });

  it("maps set and stat rows from snake_case", () => {
    const rawSets = JSON.parse(
      readFileSync(join(rawDir, "sets_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];
    const fixtureSets = JSON.parse(
      readFileSync(join(fixtureDir, "sets_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];

    const adapted = adaptSetRow(rawSets[0]!, BOLUDA_MATCH_ID);
    expect(adapted.hostScore).toBe(fixtureSets[0]!.hostScore);
    expect(adapted.guestScore).toBe(fixtureSets[0]!.guestScore);

    const rawStats = JSON.parse(
      readFileSync(join(rawDir, "stats_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];
    const fixtureStats = JSON.parse(
      readFileSync(join(fixtureDir, "stats_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];

    const stat = adaptStatRow(rawStats[0]!);
    expect(stat.statName).toBe(fixtureStats[0]!.statName);
    expect(stat.statValue).toBe(fixtureStats[0]!.statValue);
  });

  it("maps match meta from snake_case", () => {
    const meta = JSON.parse(
      readFileSync(join(rawDir, "match_boluda_meta.json"), "utf-8"),
    ) as Record<string, unknown>;
    const fixtureMatch = JSON.parse(
      readFileSync(join(fixtureDir, "match_boluda.json"), "utf-8"),
    ) as Record<string, unknown>;

    const adapted = adaptMatchRow(meta);
    expect(adapted.id).toBe(fixtureMatch.id);
    expect(adapted.hostPlayerNames).toEqual(fixtureMatch.hostPlayerNames);
    expect(adapted.surface).toBe(fixtureMatch.surface);
  });

  it("parses full bundle when points are already camelCase", () => {
    const meta = JSON.parse(
      readFileSync(join(rawDir, "match_boluda_meta.json"), "utf-8"),
    ) as Record<string, unknown>;
    const sets = JSON.parse(
      readFileSync(join(rawDir, "sets_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];
    const points = JSON.parse(
      readFileSync(join(rawDir, "points_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];
    const shots = JSON.parse(
      readFileSync(join(rawDir, "shots_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];
    const stats = JSON.parse(
      readFileSync(join(rawDir, "stats_boluda.json"), "utf-8"),
    ) as Record<string, unknown>[];

    const data = adaptSupabaseMatchData({
      match: meta,
      sets,
      games: [],
      points,
      shots,
      stats,
    });

    expect(data.match.id).toBe(BOLUDA_MATCH_ID);
    expect(data.sets.length).toBeGreaterThan(0);
    expect(data.shots.length).toBe(shots.length);
    expect(data.points.length).toBe(points.length);
  });
});
