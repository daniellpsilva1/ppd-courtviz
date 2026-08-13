#!/usr/bin/env tsx
/**
 * Non-Remotion social export: point-by-point 2D replay → PNG sequence → ffmpeg.
 *
 * Usage:
 *   pnpm replay:export
 *   pnpm replay:export -- --quick
 *   pnpm replay:export -- --points=3
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import {
  buildMatchPlayback,
  createCourtScales,
  curvedPath,
  resolvePlaybackAt,
} from "@courtviz/core";
import { enrichedShots, guestName, hostName, surface } from "@courtviz/data";
import { CourtSurface } from "@courtviz/react";
import { encodePngSequenceToMp4, STORY_9x16 } from "@courtviz/export-video";
import { getPlayerColor, ppd } from "@courtviz/themes";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "exports/spike/point-replay");
const framesDir = join(outDir, "frames");

const quick = process.argv.includes("--quick");
const pointsArg = process.argv.find((a) => a.startsWith("--points="));
const maxPoints = pointsArg ? Number(pointsArg.split("=")[1]) : quick ? 2 : 4;

const preset = STORY_9x16;
const width = preset.width;
const height = preset.height;
const fps = preset.fps;

async function main() {
  const preview = enrichedShots.filter(
    (s) => s.setNumber === 1 && s.gameNumber <= Math.max(1, maxPoints),
  );
  const shots = preview.length > 0 ? preview : enrichedShots.slice(0, 40);
  const playback = buildMatchPlayback(shots, { fps });
  const totalFrames = quick
    ? Math.min(90, playback.totalFrames)
    : Math.min(playback.totalFrames, fps * 20);

  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  const courtW = 720;
  const courtH = 960;
  const scales = createCourtScales({
    width: courtW,
    height: courtH,
    half: "full",
    margin: 1.2,
  });
  const theme = ppd;

  for (let frame = 0; frame < totalFrames; frame++) {
    const timeSec = frame / fps;
    const state = resolvePlaybackAt({ playback, timeSec });
    const ep = state.episode;
    const trails =
      ep?.shots.map((s, i) => {
        const color = getPlayerColor(s.shot.player, theme);
        const active = i === state.shotIndex;
        const done = i < state.shotIndex || (i === state.shotIndex && state.shotProgress >= 1);
        const d = curvedPath(
          scales.x(s.hitX),
          scales.y(s.hitY),
          scales.x(s.bounceX),
          scales.y(s.bounceY),
          0.12,
        );
        return { d, color, active, done, s };
      }) ?? [];

    const ball = state.ball;
    const svgInner = createElement(
      CourtSurface,
      {
        surface,
        theme,
        width: courtW,
        height: courtH,
      },
      createElement(
        "g",
        null,
        ...trails.map((t, i) =>
          createElement(
            "g",
            { key: i },
            createElement("path", {
              d: t.d,
              fill: "none",
              stroke: t.color,
              strokeWidth: t.active ? 3 : 1.75,
              strokeOpacity: t.done || t.active ? (t.active ? 0.95 : 0.4) : 0.15,
              strokeLinecap: "round",
            }),
            createElement("circle", {
              cx: scales.x(t.s.bounceX),
              cy: scales.y(t.s.bounceY),
              r: t.done || t.active ? 5 : 2.5,
              fill: t.color,
              opacity: t.done || t.active ? 0.9 : 0.25,
            }),
          ),
        ),
        ball
          ? createElement("circle", {
              cx: scales.x(ball.x),
              cy: scales.y(ball.y),
              r: 7,
              fill: "#F8FAFC",
              stroke: theme.playerHost,
              strokeWidth: 2,
            })
          : null,
      ),
    );

    const courtMarkup = renderToStaticMarkup(svgInner);
    const score = state.score;
    const label = ep
      ? `SET ${ep.setNumber}  G${ep.gameNumber}  P${ep.pointNumber}`
      : "";

    const html = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${theme.background}"/>
  <text x="64" y="120" fill="${theme.ink}" font-family="Barlow Condensed, sans-serif" font-size="52" font-weight="700" letter-spacing="0.06em">POINT REPLAY</text>
  <text x="64" y="168" fill="${theme.inkMuted}" font-family="Barlow Condensed, sans-serif" font-size="28" letter-spacing="0.08em">${escapeXml(hostName)} vs ${escapeXml(guestName)}</text>
  <text x="64" y="210" fill="${theme.inkMuted}" font-family="Inter, sans-serif" font-size="20">${escapeXml(label)} · ${escapeXml(score.pointLabel)} · reconstructed pace</text>
  <g transform="translate(${(width - courtW) / 2}, 260)">${courtMarkup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>
  <rect x="64" y="${height - preset.bottomSafeInset - 72}" width="${width - 128}" height="64" fill="${theme.background}" stroke="${theme.border}" stroke-width="2"/>
  <text x="88" y="${height - preset.bottomSafeInset - 32}" fill="${theme.playerHost}" font-family="Barlow Condensed, sans-serif" font-size="28" font-weight="700">${escapeXml(hostName.slice(0, 14))}  ${score.hostPoints === "AD" ? "AD" : score.hostPoints}  ${score.hostGames}  ${score.hostSets}</text>
  <text x="${width / 2 + 24}" y="${height - preset.bottomSafeInset - 32}" fill="${theme.playerGuest}" font-family="Barlow Condensed, sans-serif" font-size="28" font-weight="700">${escapeXml(guestName.slice(0, 14))}  ${score.guestPoints === "AD" ? "AD" : score.guestPoints}  ${score.guestGames}  ${score.guestSets}</text>
  <rect x="0" y="${height - 4}" width="${width * 0.12}" height="4" fill="${theme.playerHost}"/>
  <rect x="${width * 0.12}" y="${height - 4}" width="${width * 0.88}" height="4" fill="${theme.inkMuted}"/>
</svg>`;

    const png = await sharp(Buffer.from(html)).png().toBuffer();
    const name = `frame-${String(frame).padStart(5, "0")}.png`;
    await writeFile(join(framesDir, name), png);
    if (frame % 30 === 0) {
      console.log(`frame ${frame}/${totalFrames}`);
    }
  }

  const mp4 = join(outDir, "point-replay-9x16.mp4");
  await encodePngSequenceToMp4({
    fps,
    width,
    height,
    crf: preset.crf,
    outputPath: mp4,
    inputPattern: join(framesDir, "frame-%05d.png"),
  });

  await writeFile(
    join(outDir, "manifest.json"),
    JSON.stringify(
      {
        engine: "@courtviz/core PlaybackClock + CourtSurface SSR + ffmpeg",
        note: "No Remotion. Reconstructed pace from distance/speed.",
        preset: preset.id,
        frames: totalFrames,
        fps,
        width,
        height,
        hostName,
        guestName,
        output: mp4,
      },
      null,
      2,
    ),
  );
  console.log(`Wrote ${mp4}`);
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
