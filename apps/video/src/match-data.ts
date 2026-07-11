import type { EnrichedShot } from "@courtviz/core";
import type { Point, PlayerStat, SetSummary } from "@courtviz/data";
import {
  enrichedShots as fixtureEnrichedShots,
  guestName as fixtureGuestName,
  hostName as fixtureHostName,
  matchDate as fixtureMatchDate,
  momentumPoints as fixtureMomentumPoints,
  points as fixturePoints,
  sets as fixtureSets,
  stats,
  surface as fixtureSurface,
} from "@courtviz/data/fixtures";

import generatedContext from "./generated/match-context.json";

export interface VideoMatchContext {
  enrichedShots: EnrichedShot[];
  guestName: string;
  hostName: string;
  matchDate: string;
  momentumPoints: Array<{
    setNumber: number;
    gameNumber: number;
    pointWinner: string;
    isBreakPoint: boolean;
    isSetPoint: boolean;
    isMatchPoint: boolean;
  }>;
  points: Point[];
  sets: SetSummary[];
  stats?: PlayerStat[];
  surface: "clay" | "hard" | "grass";
}

const fixtureContext: VideoMatchContext = {
  enrichedShots: fixtureEnrichedShots,
  guestName: fixtureGuestName,
  hostName: fixtureHostName,
  matchDate: fixtureMatchDate,
  momentumPoints: fixtureMomentumPoints,
  points: fixturePoints,
  sets: fixtureSets,
  stats,
  surface: fixtureSurface as "clay" | "hard" | "grass",
};

function isValidContext(value: unknown): value is VideoMatchContext {
  if (!value || typeof value !== "object") return false;
  const ctx = value as VideoMatchContext;
  return Boolean(
    ctx.hostName &&
    ctx.guestName &&
    Array.isArray(ctx.enrichedShots) &&
    ctx.enrichedShots.length > 0,
  );
}

export function getVideoMatchContext(): VideoMatchContext {
  return isValidContext(generatedContext) ? generatedContext : fixtureContext;
}
