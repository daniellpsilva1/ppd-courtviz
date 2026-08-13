import type { Surface } from "@courtviz/core";
import type { CourtvizTheme } from "@courtviz/themes";

export function surfaceFillColor(
  surface: Surface,
  theme: CourtvizTheme,
): string {
  return theme.surfaceColors[surface] ?? theme.surfaceColors.hard;
}

export function surfaceLineColor(theme: CourtvizTheme): string {
  return theme.courtLine;
}

export function playerMarkerColor(
  player: string,
  theme: CourtvizTheme,
): string {
  return player === "host" ? theme.playerHost : theme.playerGuest;
}
