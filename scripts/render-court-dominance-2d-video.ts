#!/usr/bin/env tsx
/**
 * Reliable Court Dominance 9:16 MP4 from @courtviz/react HexbinLayer (SSR → sharp → ffmpeg).
 * No Ladle chrome, no headless WebGL. This is the testable spike deliverable.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { createCourtScales, wrapText } from "@courtviz/core";
import {
  enrichedShots,
  guestName,
  hostName,
  points,
  surface,
} from "@courtviz/data";
import { CourtSurface, HexbinLayer } from "@courtviz/react";
import { encodePngSequenceToMp4 } from "@courtviz/export-video";
import {
  DOMINANCE_GRIDSIZE,
  DOMINANCE_HALF,
  DOMINANCE_HEX_MIN,
  DOMINANCE_SIZE_RANGE,
  combinedEfficiencyDomain,
  singlesExtent,
} from "@courtviz/spike";
import {
  efficiencyColorStops,
  getPlayerColor,
  ppd,
} from "@courtviz/themes";
import { primaryCoachInsight } from "@ppd/brand";
import { buildCourtDominanceTimeline } from "@courtviz/motion";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "exports/spike/court-dominance");
const framesDir = join(outDir, "frames");

const fps = 30;
const durationSec = 10;
const width = 1080;
const height = 1920;
const quick = process.argv.includes("--quick");
const totalFrames = quick ? 90 : Math.ceil(durationSec * fps);

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function frameScene(frame: number) {
  const t = frame / Math.max(totalFrames - 1, 1);
  const timeline = buildCourtDominanceTimeline({ fps, durationSec });
  timeline.seekToFrame(frame);
  const cam = timeline.getCameraState();

  // Beat structure: title → courts fade in → insight
  const titleOpacity = Math.min(1, t / 0.08);
  const courtsOpacity = easeOutCubic(Math.min(1, Math.max(0, (t - 0.08) / 0.35)));
  const legendOpacity = easeOutCubic(Math.min(1, Math.max(0, (t - 0.35) / 0.2)));
  const insightOpacity = easeOutCubic(Math.min(1, Math.max(0, (t - 0.55) / 0.25)));
  const hexAlpha = 0.35 + 0.55 * cam.hexOpacity;

  const theme = ppd;
  const courtW = 420;
  const courtH = 420;
  const scales = createCourtScales({
    half: DOMINANCE_HALF,
    height: courtH,
    margin: 1.5,
    width: courtW,
  });
  const valueDomain = combinedEfficiencyDomain(
    enrichedShots,
    ["host", "guest"],
    DOMINANCE_HALF,
    DOMINANCE_GRIDSIZE,
  );
  const extent = singlesExtent(DOMINANCE_HALF);
  const groundstrokes = enrichedShots.filter((s) => s.stroke !== "Serve");
  const insight = primaryCoachInsight({
    enrichedShots,
    points,
    hostName,
    guestName,
  });
  const stops = efficiencyColorStops(theme);

  const pad = 48;
  const titleY = 96;
  const courtsY = 220;
  const gap = 40;
  const leftX = (width - courtW * 2 - gap) / 2;
  const legendY = courtsY + courtH + 48;
  const insightY = legendY + 80;

  function playerCourt(player: "host" | "guest", x: number) {
    const name = player === "host" ? hostName : guestName;
    return createElement(
      "g",
      { transform: `translate(${x}, ${courtsY})`, opacity: courtsOpacity },
      createElement(
        "text",
        {
          x: 0,
          y: -16,
          fill: getPlayerColor(player, theme),
          fontFamily: theme.fonts.condensedFont,
          fontSize: 28,
          fontWeight: 700,
        },
        name,
      ),
      createElement(
        CourtSurface,
        {
          half: DOMINANCE_HALF,
          height: courtH,
          idPrefix: `dom-${player}-${frame}`,
          surface,
          theme,
          width: courtW,
        },
        createElement(HexbinLayer, {
          colorScale: "efficiency",
          gridsize: DOMINANCE_GRIDSIZE,
          half: DOMINANCE_HALF,
          labelMinCount: 6,
          minCount: DOMINANCE_HEX_MIN,
          player,
          scales,
          shots: groundstrokes,
          sizeRange: DOMINANCE_SIZE_RANGE,
          theme,
          useHalfCourtNormalization: true,
          valueDomain,
          extent,
          alpha: hexAlpha,
          showLabels: t > 0.45,
        }),
      ),
    );
  }

  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
    },
    createElement("rect", { width, height, fill: theme.background }),
    createElement(
      "g",
      { opacity: titleOpacity },
      createElement(
        "text",
        {
          x: pad,
          y: titleY,
          fill: theme.ink,
          fontFamily: theme.fonts.condensedFont,
          fontSize: 56,
          fontWeight: 700,
        },
        "Court Dominance",
      ),
      createElement(
        "text",
        {
          x: pad,
          y: titleY + 40,
          fill: theme.inkMuted,
          fontFamily: theme.fonts.bodyFont,
          fontSize: 22,
        },
        `Size = frequency · color = win rate · ${hostName} vs ${guestName}`,
      ),
    ),
    playerCourt("host", leftX),
    playerCourt("guest", leftX + courtW + gap),
    createElement(
      "g",
      { opacity: legendOpacity, transform: `translate(${pad}, ${legendY})` },
      createElement(
        "text",
        {
          x: 0,
          y: 0,
          fill: theme.inkMuted,
          fontFamily: theme.fonts.bodyFont,
          fontSize: 18,
        },
        "Efficiency",
      ),
      stops.map(([_, color], i) =>
        createElement("rect", {
          key: i,
          x: 100 + i * 48,
          y: -16,
          width: 48,
          height: 12,
          fill: color,
          rx: 2,
        }),
      ),
    ),
    createElement(
      "g",
      { opacity: insightOpacity },
      createElement("rect", {
        x: pad,
        y: insightY,
        width: width - pad * 2,
        height: 280,
        rx: 16,
        fill: theme.background,
        stroke: theme.border,
      }),
      createElement(
        "text",
        {
          x: pad + 28,
          y: insightY + 44,
          fill: theme.inkMuted,
          fontFamily: theme.fonts.condensedFont,
          fontSize: 20,
          fontWeight: 700,
        },
        "COACH TAKEAWAY",
      ),
      ...wrapText(insight, {
        maxWidth: width - pad * 2 - 56,
        fontSize: 26,
        fontFamily: theme.fonts.bodyFont,
      }).map((line, i) =>
        createElement(
          "text",
          {
            key: `insight-${i}`,
            x: pad + 28,
            y: insightY + 88 + i * 36,
            fill: theme.ink,
            fontFamily: theme.fonts.bodyFont,
            fontSize: 26,
          },
          line,
        ),
      ),
    ),
  );
}

async function main() {
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  console.log(`Rendering ${totalFrames} HexbinLayer frames at ${width}×${height}…`);

  for (let frame = 0; frame < totalFrames; frame++) {
    const svg = renderToStaticMarkup(frameScene(frame));
    const png = await sharp(Buffer.from(svg), { density: 144 })
      .resize(width, height)
      .png()
      .toBuffer();
    await writeFile(
      join(framesDir, `frame-${String(frame).padStart(5, "0")}.png`),
      png,
    );
    if (frame % 30 === 0) console.log(`  frame ${frame}/${totalFrames}`);
  }

  // Still frame for quick look
  await writeFile(
    join(outDir, "court-dominance-interactive-1080x1920.png"),
    await sharp(
      Buffer.from(renderToStaticMarkup(frameScene(totalFrames - 1))),
      { density: 144 },
    )
      .resize(width, height)
      .png()
      .toBuffer(),
  );

  const mp4Path = join(outDir, "court-dominance-9x16.mp4");
  await encodePngSequenceToMp4({
    fps,
    width,
    height,
    inputPattern: join(framesDir, "frame-%05d.png"),
    outputPath: mp4Path,
    crf: 16,
  });

  await writeFile(
    join(outDir, "manifest.json"),
    JSON.stringify(
      {
        fps,
        width,
        height,
        durationSec: quick ? 3 : durationSec,
        totalFrames,
        engine: "@courtviz/react HexbinLayer SSR + ffmpeg",
        note: "No Remotion. Same layers as interactive gallery story.",
      },
      null,
      2,
    ),
  );

  console.log(`\nWrote ${mp4Path}`);
  console.log(`Open: ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
