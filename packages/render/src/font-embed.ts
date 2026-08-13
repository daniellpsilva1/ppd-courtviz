/**
 * Font embedding utilities for SVG exports.
 *
 * Sharp does not have access to system-installed fonts, so SVGs rendered
 * to PNG via Sharp fall back to generic sans-serif. By embedding WOFF2
 * fonts as base64 @font-face declarations inside a <style> tag, the
 * Sharp SVG renderer picks up the correct fonts.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { writeFileSync, existsSync } from "node:fs";

interface FontSpec {
  family: string;
  weight: number;
  style: string;
  url: string;
  localPath?: string;
}

const FONTS_DIR = typeof __dirname !== "undefined"
  ? join(__dirname, "..", "fonts")
  : join(dirname(fileURLToPath(import.meta.url)), "..", "fonts");

const FONT_SPECS: FontSpec[] = [
  {
    family: "Barlow Condensed",
    localPath: "barlow-condensed-400.woff2",
    style: "normal",
    url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTx3L3I-JCGChYJ8VI-L6OO_au7B2xPZ3Xn2.woff2",
    weight: 400,
  },
  {
    family: "Barlow Condensed",
    localPath: "barlow-condensed-600.woff2",
    style: "normal",
    url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B4873_3TcvqED.woff2",
    weight: 600,
  },
  {
    family: "Barlow Condensed",
    localPath: "barlow-condensed-700.woff2",
    style: "normal",
    url: "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2_3TcvqED.woff2",
    weight: 700,
  },
  {
    family: "Inter",
    localPath: "inter-400.woff2",
    style: "normal",
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files/inter-latin-400-normal.woff2",
    weight: 400,
  },
  {
    family: "Inter",
    localPath: "inter-500.woff2",
    style: "normal",
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files/inter-latin-500-normal.woff2",
    weight: 500,
  },
  {
    family: "Inter",
    localPath: "inter-600.woff2",
    style: "normal",
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files/inter-latin-600-normal.woff2",
    weight: 600,
  },
];

const CACHE_DIR = join(tmpdir(), "courtviz-fonts");

function fontCachePath(spec: FontSpec): string {
  const safeName = `${spec.family.replace(/\s+/g, "-")}-${spec.weight}-${spec.style}`;
  return join(CACHE_DIR, `${safeName}.woff2`);
}

async function fetchFont(spec: FontSpec): Promise<Buffer> {
  if (spec.localPath) {
    const localFile = join(FONTS_DIR, spec.localPath);
    if (existsSync(localFile)) {
      return readFileSync(localFile);
    }
  }

  const cachePath = fontCachePath(spec);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }

  const res = await fetch(spec.url);
  if (!res.ok) {
    throw new Error(`Failed to fetch font: ${spec.url} (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  try {
    writeFileSync(cachePath, buf);
  } catch {
    // Cache write failure is non-fatal
  }
  return buf;
}

let cachedFontCss: string | null = null;

async function buildEmbeddedFontCss(): Promise<string> {
  if (cachedFontCss) return cachedFontCss;

  const faces: string[] = [];
  for (const spec of FONT_SPECS) {
    let buf: Buffer;
    try {
      buf = await fetchFont(spec);
    } catch (error) {
      throw new Error(
        `Font embed failed for "${spec.family}" ${spec.weight}: ${error instanceof Error ? error.message : String(error)}. Exports must not silently fall back to a different weight.`,
      );
    }
    const base64 = buf.toString("base64");
    faces.push(
      `@font-face{font-family:"${spec.family}";font-style:${spec.style};font-weight:${spec.weight};src:url(data:font/woff2;base64,${base64}) format("woff2");}`,
    );
  }

  cachedFontCss = faces.join("");
  return cachedFontCss;
}

/**
 * Inject embedded @font-face declarations into an SVG string.
 * The <style> tag is inserted right after the opening <svg> tag.
 */
export async function embedFontsInSvg(svg: string): Promise<string> {
  const css = await buildEmbeddedFontCss();
  if (!css) return svg;

  return svg.replace(/(<svg[^>]*>)/, `$1<style>${css}</style>`);
}
