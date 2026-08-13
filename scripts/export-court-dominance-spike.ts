#!/usr/bin/env tsx
/**
 * Seekable Court Dominance export (1080×1920, no Remotion).
 * Requires: built packages, ffmpeg on PATH, optional Playwright for capture.
 *
 * Usage:
 *   pnpm --filter courtviz spike:export
 *   pnpm --filter courtviz spike:export -- --frames-only
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCourtDominanceTimeline } from "@courtviz/motion";
import { encodePngSequenceToMp4, runSeekExport } from "@courtviz/export-video";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "exports/spike/court-dominance");
const fps = 30;
const durationSec = 10;
const width = 1080;
const height = 1920;

const framesOnly = process.argv.includes("--frames-only");

async function main() {
  const timeline = buildCourtDominanceTimeline({ fps, durationSec });
  const framesDir = join(outDir, "frames");
  await mkdir(framesDir, { recursive: true });

  const manifest = {
    fps,
    width,
    height,
    durationSec,
    totalFrames: timeline.totalFrames(),
    seekGlobal: "__courtvizSeekToFrame",
    galleryStory: "Spike — Court Dominance (2D + Three)",
    note: "Open Ladle spike story with ?seek= export page or wire Playwright URL when demo route exists.",
  };
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  await runSeekExport({
    fps,
    totalFrames: timeline.totalFrames(),
    onFrame: async (frame) => {
      timeline.seekToFrame(frame);
      const cam = timeline.getCameraState();
      const meta = { frame, camera: cam };
      await writeFile(
        join(framesDir, `frame-${String(frame).padStart(5, "0")}.json`),
        JSON.stringify(meta),
      );
    },
  });

  if (framesOnly) {
    console.log(`Wrote ${timeline.totalFrames()} frame metadata files to ${framesDir}`);
    return;
  }

  const pattern = join(framesDir, "frame-%05d.png");
  try {
    await encodePngSequenceToMp4({
      fps,
      width,
      height,
      inputPattern: pattern,
      outputPath: join(outDir, "court-dominance-9x16.mp4"),
    });
    console.log(`Encoded ${join(outDir, "court-dominance-9x16.mp4")}`);
  } catch (err) {
    console.warn(
      "PNG sequence missing — run Playwright capture against gallery export URL, then re-run encode.",
      err,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
