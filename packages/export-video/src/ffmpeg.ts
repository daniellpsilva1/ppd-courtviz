import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface FfmpegEncodeOptions {
  fps: number;
  width: number;
  height: number;
  crf?: number;
  outputPath: string;
  inputPattern: string;
}

/**
 * Encode a numbered PNG sequence to H.264 MP4 (yuv420p for broad compatibility).
 */
export function encodePngSequenceToMp4(
  options: FfmpegEncodeOptions,
): Promise<void> {
  const {
    fps,
    width,
    height,
    crf = 16,
    outputPath,
    inputPattern,
  } = options;

  return new Promise(async (resolve, reject) => {
    await mkdir(dirname(outputPath), { recursive: true });
    const args = [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      inputPattern,
      "-vf",
      `scale=${width}:${height}`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      String(crf),
      outputPath,
    ];
    const proc = spawn("ffmpeg", args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

export interface SeekExportPlan {
  totalFrames: number;
  fps: number;
  onFrame: (frame: number) => void | Promise<void>;
}

/**
 * Drive a seekable export loop (caller captures each frame after seek).
 */
export async function runSeekExport(plan: SeekExportPlan): Promise<void> {
  for (let frame = 0; frame < plan.totalFrames; frame++) {
    await plan.onFrame(frame);
  }
}

export interface PlaywrightCaptureOptions {
  url: string;
  outputDir: string;
  totalFrames: number;
  fps: number;
  width: number;
  height: number;
  /** Global hook: window.__courtvizSeekToFrame(n) */
  seekGlobal?: string;
}

/**
 * Capture frames via Playwright (Linux CI). Requires playwright optional dep + ffmpeg on PATH.
 */
export async function captureFramesWithPlaywright(
  options: PlaywrightCaptureOptions,
): Promise<void> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "playwright is not installed. Add it to run headless frame capture.",
    );
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
  });
  await page.goto(options.url, { waitUntil: "networkidle" });
  const seekFn = options.seekGlobal ?? "__courtvizSeekToFrame";
  await mkdir(options.outputDir, { recursive: true });

  for (let frame = 0; frame < options.totalFrames; frame++) {
    await page.evaluate(
      ([fn, f]) => {
        const seek = (globalThis as Record<string, unknown>)[fn as string];
        if (typeof seek === "function") {
          (seek as (n: number) => void)(f as number);
        }
      },
      [seekFn, frame] as const,
    );
    await page.waitForTimeout(16);
    const path = `${options.outputDir}/frame-${String(frame).padStart(5, "0")}.png`;
    await page.screenshot({ path, type: "png" });
  }

  await browser.close();
}
