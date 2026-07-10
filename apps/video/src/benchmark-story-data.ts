import { getMatchStoryTheme, matchStory, buildBoludaStory, buildMatchStory, toCourtvizTheme } from "./match-story-context";

export const benchmarkStory = matchStory;
export const benchmarkProductTheme = getMatchStoryTheme("product");

export { buildBoludaStory, buildMatchStory, getMatchStoryTheme, toCourtvizTheme };
