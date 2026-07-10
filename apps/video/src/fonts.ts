import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { typography } from "@ppd/tokens";

const barlow = loadBarlowCondensed("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

const inter = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const condensedFont = barlow.fontFamily;
export const bodyFont = inter.fontFamily;

/** Token-defined display family (for reference in compositions) */
export const displayFamilyToken = typography.families.condensed;
