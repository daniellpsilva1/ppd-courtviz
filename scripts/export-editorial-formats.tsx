/**
 * Editorial social cards across all 4 platform formats.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildBoludaStory, toCourtvizTheme } from "@ppd/brand";
import { CourtSurface, HexbinLayer, useCourtScales } from "@courtviz/react";
import { FigureDocument } from "@courtviz/react";
import { enrichedShots } from "@courtviz/data/fixtures";
import { getSocialPreset, type SocialFormat } from "@ppd/tokens";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(__dirname, "../apps/demo/public/exports/editorial");
const story = buildBoludaStory();
const editorialTheme = toCourtvizTheme("editorial");

function HostHexbin() {
  const scales = useCourtScales();
  return (
    <HexbinLayer
      gridsize={6}
      half="full"
      player="host"
      scales={scales}
      shots={enrichedShots}
      theme={editorialTheme}
    />
  );
}

function EditorialCard({ format }: { format: SocialFormat }) {
  const preset = getSocialPreset(format);
  const courtSize = Math.min(preset.width - 120, preset.height * 0.45);

  return (
    <FigureDocument
      accessibleSummary={story.accessibleSummary}
      height={preset.height}
      id={`editorial-${format}`}
      source={story.source}
      subtitle={story.insight}
      theme={editorialTheme}
      title={story.title}
      width={preset.width}
    >
      <text
        fill={editorialTheme.inkMuted}
        fontFamily={`${editorialTheme.fonts.condensedFont}, ${editorialTheme.fonts.condensedFontFallback}`}
        fontSize={14}
        fontWeight={700}
        letterSpacing={3}
        x={60}
        y={-8}
      >
        PPD INSIGHTS
      </text>
      <CourtSurface
        height={courtSize}
        idPrefix={`editorial-court-${format}`}
        offsetX={(preset.width - courtSize) / 2}
        offsetY={20}
        surface={story.surface}
        theme={editorialTheme}
        width={courtSize}
      >
        <HostHexbin />
      </CourtSurface>
      <text
        fill={editorialTheme.playerHost}
        fontFamily={`${editorialTheme.fonts.condensedFont}, ${editorialTheme.fonts.condensedFontFallback}`}
        fontSize={format === "story" ? 42 : 32}
        fontWeight={700}
        x={60}
        y={courtSize + 80}
      >
        {story.frozenMetrics.hostTopZoneWinPct}% deuce-side win rate
      </text>
      <text
        fill={editorialTheme.inkMuted}
        fontFamily={`${editorialTheme.fonts.bodyFont}, ${editorialTheme.fonts.bodyFontFallback}`}
        fontSize={18}
        x={60}
        y={courtSize + 120}
      >
        {story.hostName} def. {story.guestName} · {story.setScore}
      </text>
    </FigureDocument>
  );
}

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
  const formats: SocialFormat[] = ["square", "portrait", "story", "landscape"];

  for (const format of formats) {
    const preset = getSocialPreset(format);
    const dir = path.join(outRoot, format);
    fs.mkdirSync(dir, { recursive: true });

    const svg = renderSvg(React.createElement(EditorialCard, { format }));
    const svgPath = path.join(dir, "social-card.svg");
    const pngPath = path.join(dir, "social-card.png");
    fs.writeFileSync(svgPath, svg, "utf-8");
    await svgToPng(svg, pngPath, preset.width, preset.height);
    console.log(`✓ editorial/${format}/social-card.svg + .png`);
  }

  console.log(`\nEditorial format matrix → ${outRoot}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
