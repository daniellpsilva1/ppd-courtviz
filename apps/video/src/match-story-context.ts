/**
 * Shared match story payload for Remotion compositions.
 */

import { buildBoludaStory, buildMatchStory, toCourtvizTheme, type BenchmarkStory } from "@ppd/brand";

export type MatchStoryThemeMode = "product" | "broadcast" | "editorial";

export function getMatchStoryTheme(mode: MatchStoryThemeMode = "product") {
  if (mode === "broadcast") return toCourtvizTheme("broadcast");
  if (mode === "editorial") return toCourtvizTheme("editorial");
  return toCourtvizTheme("product");
}

/** Default benchmark story — use buildMatchStory() for other fixtures */
export const matchStory: BenchmarkStory = buildBoludaStory();

export { buildBoludaStory, buildMatchStory, toCourtvizTheme };
export type { BenchmarkStory };
