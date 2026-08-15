import { createContext, useContext } from "react";
import type { CourtvizTheme } from "@courtviz/themes";
import { ppdDark, ppdSocial } from "@courtviz/themes";

const SceneThemeContext = createContext<CourtvizTheme>(ppdDark);

export function getSceneTheme(variant: "broadcast" | "social" = "broadcast"): CourtvizTheme {
  return variant === "social" ? ppdSocial : ppdDark;
}

export function useSceneTheme(): CourtvizTheme {
  return useContext(SceneThemeContext);
}

export { SceneThemeContext };
