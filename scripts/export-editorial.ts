/**
 * Editorial artifact export — warm-paper narrative social cards (SVG + PNG).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SocialPortraitCard, SocialSquareCard } from "../apps/demo/src/benchmark/social-cards";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../apps/demo/public/exports/editorial");

function renderSvg(element: React.ReactElement): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${renderToStaticMarkup(element)}`;
}

async function svgToPng(svg: string, outPath: string, width: number, height: number) {
  const sharp = (await import("sharp")).default;
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(width, height)
    .png()
    .toFile(outPath);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const exports = [
    { element: React.createElement(SocialPortraitCard), h: 1350, name: "social-portrait", w: 1080 },
    { element: React.createElement(SocialSquareCard), h: 1080, name: "social-square", w: 1080 },
  ] as const;

  for (const item of exports) {
    const svg = renderSvg(item.element);
    fs.writeFileSync(path.join(outDir, `${item.name}.svg`), svg, "utf-8");
    console.log(`✓ editorial/${item.name}.svg`);
    const pngPath = path.join(outDir, `${item.name}.png`);
    await svgToPng(svg, pngPath, item.w, item.h);
    console.log(`✓ editorial/${item.name}.png`);
  }

  console.log(`\nEditorial exports → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
