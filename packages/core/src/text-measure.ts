/**
 * Text measurement and fitting utilities for SVG export pipeline.
 *
 * In Node, uses node-canvas with the actual Inter / Barlow Condensed faces
 * registered from packages/core/fonts so measurements match exported glyphs.
 * In the browser, uses a DOM canvas (real page fonts). The char-ratio
 * heuristic remains only as a last resort when no canvas is available.
 */

const FONT_FILES: Array<{ family: string; file: string; weight: string }> = [
  { family: "Barlow Condensed", file: "barlow-condensed-400.ttf", weight: "400" },
  { family: "Barlow Condensed", file: "barlow-condensed-600.ttf", weight: "600" },
  { family: "Barlow Condensed", file: "barlow-condensed-700.ttf", weight: "700" },
  { family: "Inter", file: "inter-400.ttf", weight: "400" },
  { family: "Inter", file: "inter-500.ttf", weight: "500" },
  { family: "Inter", file: "inter-600.ttf", weight: "600" },
];

type MeasureContext = {
  font: string;
  measureText(text: string): { width: number };
};

let canvasCtx: MeasureContext | null | undefined = undefined;

function resolveNodeRequire(): NodeRequire | null {
  // CJS build: require is in scope.
  if (typeof require === "function") return require;
  // ESM under Node >=20.16: obtain createRequire without static node imports
  // so browser bundles never try to resolve "canvas".
  const getBuiltin = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } })
    .process?.getBuiltinModule;
  if (typeof getBuiltin === "function") {
    const mod = getBuiltin("module") as typeof import("node:module") | undefined;
    if (mod?.createRequire) {
      return mod.createRequire(import.meta.url);
    }
  }
  return null;
}

function getNodeCanvasContext(): MeasureContext | null {
  try {
    const req = resolveNodeRequire();
    if (!req) return null;
    const canvasModule = req("canvas");
    const nodePath = req("node:path") as typeof import("node:path");
    const nodeFs = req("node:fs") as typeof import("node:fs");
    const nodeUrl = req("node:url") as typeof import("node:url");

    const here =
      typeof __dirname !== "undefined"
        ? __dirname
        : nodePath.dirname(nodeUrl.fileURLToPath(import.meta.url));
    const candidates = [
      // dist/index.cjs and src/ (vitest) -> ../fonts
      nodePath.join(here, "..", "fonts"),
      nodePath.join(here, "..", "..", "fonts"),
    ];
    const fontsDir = candidates.find((dir) => nodeFs.existsSync(dir));
    if (fontsDir) {
      for (const spec of FONT_FILES) {
        const file = nodePath.join(fontsDir, spec.file);
        if (nodeFs.existsSync(file)) {
          canvasModule.registerFont(file, { family: spec.family, weight: spec.weight });
        }
      }
    }
    return canvasModule.createCanvas(1, 1).getContext("2d") as MeasureContext;
  } catch {
    return null;
  }
}

function getCanvasContext(): MeasureContext | null {
  if (canvasCtx !== undefined) return canvasCtx ?? null;
  if (typeof document !== "undefined") {
    canvasCtx = document.createElement("canvas").getContext("2d") as MeasureContext | null;
  } else {
    canvasCtx = getNodeCanvasContext();
  }
  return canvasCtx ?? null;
}

export interface TextMeasureOptions {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
}

/**
 * Measure the width of a text string in pixels.
 * Uses canvas.measureText() when available; falls back to char-count heuristic.
 */
export function measureSvgText(text: string, opts: TextMeasureOptions): number {
  const ctx = getCanvasContext();
  if (ctx) {
    ctx.font = `${opts.fontWeight ?? 400} ${opts.fontSize}px "${opts.fontFamily}"`;
    return ctx.measureText(text).width;
  }
  return text.length * opts.fontSize * 0.52;
}

/** True when accurate canvas-based measurement is available. */
export function hasAccurateTextMeasure(): boolean {
  return getCanvasContext() !== null;
}

/**
 * Wrap text into lines that fit within maxWidth using accurate measurement.
 */
export function wrapText(
  text: string,
  opts: TextMeasureOptions & { maxWidth: number },
): string[] {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureSvgText(candidate, opts) > opts.maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Fit text on exactly N lines within maxWidth.
 * Binary-searches the font size that fits, or truncates with "…" if minimum size is reached.
 */
export function fitTextOnNLines(
  text: string,
  opts: TextMeasureOptions & { maxWidth: number; maxLines: number; minFontSize?: number },
): { fontSize: number; lines: string[] } {
  const minFontSize = opts.minFontSize ?? 10;
  let lo = minFontSize;
  let hi = opts.fontSize;
  let best: { fontSize: number; lines: string[] } | null = null;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const lines = wrapText(text, { ...opts, fontSize: mid });
    const fits = lines.length <= opts.maxLines &&
      lines.every((line) => measureSvgText(line, { ...opts, fontSize: mid }) <= opts.maxWidth);

    if (fits) {
      best = { fontSize: mid, lines };
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (best) return best;

  const lines = wrapText(text, { ...opts, fontSize: minFontSize }).slice(0, opts.maxLines);
  if (lines.length > 0) {
    const last = lines[lines.length - 1]!;
    const truncated = `${last.slice(0, -1)}…`;
    if (measureSvgText(truncated, { ...opts, fontSize: minFontSize }) <= opts.maxWidth) {
      lines[lines.length - 1] = truncated;
    } else {
      lines[lines.length - 1] = `${last.slice(0, -3)}…`;
    }
  }
  return { fontSize: minFontSize, lines };
}

export type FitTextMode = "shrink" | "truncate" | "wrap";

export interface FitSvgTextOptions extends TextMeasureOptions {
  maxWidth: number;
  maxLines?: number;
  minFontSize?: number;
  mode?: FitTextMode;
}

export interface FitSvgTextResult {
  fontSize: number;
  lines: string[];
  /** Widest measured line at the resolved font size, in px. */
  width: number;
  /** Total height assuming a 1.25 line-height, in px. */
  height: number;
}

/**
 * Single text-fitting API used by every renderer.
 *
 * - `shrink` (default): wrap into <= maxLines, binary-searching font size down
 *   to minFontSize, truncating with "…" as a last resort.
 * - `wrap`: keep the requested font size, wrap, truncate the last line if the
 *   text exceeds maxLines.
 * - `truncate`: keep the requested font size, single line, truncate with "…".
 */
export function fitSvgText(text: string, opts: FitSvgTextOptions): FitSvgTextResult {
  const maxLines = opts.maxLines ?? 1;
  const mode = opts.mode ?? "shrink";
  const base: TextMeasureOptions & { maxWidth: number } = {
    fontFamily: opts.fontFamily,
    fontSize: opts.fontSize,
    fontWeight: opts.fontWeight,
    maxWidth: opts.maxWidth,
  };

  let fontSize = opts.fontSize;
  let lines: string[];

  if (mode === "truncate") {
    lines = [truncateText(text, base)];
  } else if (mode === "wrap") {
    lines = wrapText(text, base);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      const rest = lines.slice(maxLines - 1).join(" ");
      kept[maxLines - 1] = truncateText(rest, base);
      lines = kept;
    }
  } else {
    const fitted = fitTextOnNLines(text, {
      ...base,
      maxLines,
      minFontSize: opts.minFontSize,
    });
    fontSize = fitted.fontSize;
    lines = fitted.lines;
  }

  const measure = { ...base, fontSize };
  const width = lines.reduce((max, line) => Math.max(max, measureSvgText(line, measure)), 0);
  return { fontSize, height: lines.length * fontSize * 1.25, lines, width };
}

/**
 * Truncate text to fit within maxWidth, appending "…" if truncated.
 */
export function truncateText(
  text: string,
  opts: TextMeasureOptions & { maxWidth: number },
): string {
  if (measureSvgText(text, opts) <= opts.maxWidth) return text;
  const ellipsis = "…";
  const ellipsisWidth = measureSvgText(ellipsis, opts);
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const candidate = text.slice(0, mid);
    if (measureSvgText(candidate, opts) + ellipsisWidth <= opts.maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo > 0 ? `${text.slice(0, lo)}${ellipsis}` : ellipsis;
}
