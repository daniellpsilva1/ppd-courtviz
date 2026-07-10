import {
  enrichedShots,
  guestName,
  hostName,
  match,
  matchDate,
  momentumPoints,
  points,
  sets,
  surface,
} from "@courtviz/data/fixtures";
import { buildMatchStory, type StoryNarrativeOverrides } from "./build-match-story";
import type { BenchmarkStory } from "./schema";

const boludaNarrative: StoryNarrativeOverrides = {
  storyId: "boluda-territorial-advantage",
  title: "Quevedo's Deuce-Court Pressure Defined the Match",
  standfirst: `${hostName} won 2–0 on clay by controlling the deuce-side patterns that converted into break-point pressure — not by dominating first-serve percentage alone.`,
  editorialQuestion:
    "Where did the host player create the clearest territorial and point-winning advantage, and how should a coach interpret it?",
  insight: undefined,
  coachInterpretation:
    "Reinforce deuce-side serve-plus-one patterns in practice. When returning, prioritize denying guest access to the ad alley on short balls — the host's edge came from pattern repetition, not raw speed.",
};

/** Build the frozen Boluda benchmark story from fixture data */
export function buildBoludaStory(): BenchmarkStory {
  const metrics = buildMatchStory(
    {
      enrichedShots,
      guestName,
      hostName,
      matchDate,
      matchId: match.id,
      momentumPoints,
      points,
      sets,
      surface: surface as "clay" | "hard" | "grass",
    },
    boludaNarrative,
  );

  return metrics;
}

export { buildMatchStory, computeStoryMetrics } from "./build-match-story";
export type { MatchStoryFixtures, StoryNarrativeOverrides } from "./build-match-story";
