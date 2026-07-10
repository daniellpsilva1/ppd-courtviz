import { type PpdBrandModeName, ppdBrand } from "../tokens";

/** CSS custom properties for demo / editorial shell styling */
export function toCssVars(mode: PpdBrandModeName = "editorial"): Record<string, string> {
  const m = ppdBrand.modes[mode];
  const s = ppdBrand.semantics;
  const t = ppdBrand.typography;

  return {
    "--ppd-bg": m.background,
    "--ppd-surface": m.surface,
    "--ppd-surface-raised": m.surfaceRaised,
    "--ppd-border": m.border,
    "--ppd-ink": m.ink,
    "--ppd-ink-muted": m.inkMuted,
    "--ppd-accent": m.accent,
    "--ppd-accent-muted": m.accentMuted,
    "--ppd-player-host": s.playerHost,
    "--ppd-player-guest": s.playerGuest,
    "--ppd-positive": s.positive,
    "--ppd-negative": s.negative,
    "--font-display": `"${t.displayFamily}", ${t.displayFallback}`,
    "--font-body": `"${t.bodyFamily}", ${t.bodyFallback}`,
  };
}

export function cssVarsBlock(mode: PpdBrandModeName = "editorial"): string {
  const vars = toCssVars(mode);
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n  ");
}
