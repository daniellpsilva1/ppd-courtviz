#!/usr/bin/env tsx
/**
 * Playwright frame capture for Court Dominance 9:16 MP4.
 * Prereq: pnpm --filter @courtviz/gallery build
 */
import { spawn } from "node:child_process";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodePngSequenceToMp4 } from "@courtviz/export-video";
import { buildCourtDominanceTimeline } from "@courtviz/motion";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "exports/spike/court-dominance");
const framesDir = join(outDir, "frames");
const galleryDir = join(root, "apps/gallery");

const fps = 30;
const durationSec = 10;
const width = 1080;
const height = 1920;
const previewPort = 61001;
const storyId = "court-dominance--spike--court-dominance-video-export-9-16-";
const posterStoryId = "court-dominance--spike--court-dominance-poster-export-";

const quick = process.argv.includes("--quick");
const totalFrames = quick ? 90 : Math.ceil(durationSec * fps);

async function waitForServer(url: string, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Gallery preview did not start at ${url}`);
}

function startPreview(): ReturnType<typeof spawn> {
  return spawn("pnpm", ["exec", "ladle", "preview", "-p", String(previewPort), "-h", "127.0.0.1"], {
    cwd: galleryDir,
    stdio: "pipe",
  });
}

async function captureVideo(): Promise<void> {
  const { chromium } = await import("playwright");
  await mkdir(framesDir, { recursive: true });

  const preview = startPreview();
  const baseUrl = `http://127.0.0.1:${previewPort}`;

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--enable-webgl"],
    });
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    // mode=preview hides Ladle sidebar/chrome — previous export accidentally filmed Storybook UI
    const threeUrl = `${baseUrl}/?mode=preview&story=${storyId}`;
    await page.goto(threeUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("#courtviz-export-root canvas", { timeout: 60_000 });
    await page.waitForTimeout(2500);

    const root = page.locator("#courtviz-export-root");
    if ((await root.count()) === 0) {
      throw new Error(`#courtviz-export-root missing at ${threeUrl}`);
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      await page.evaluate((f) => {
        window.__courtvizSeekToFrame?.(f);
      }, frame);
      await page.waitForTimeout(quick ? 120 : 80);
      const path = join(framesDir, `frame-${String(frame).padStart(5, "0")}.png`);
      await root.screenshot({ path, type: "png" });
      if (frame % 30 === 0) console.log(`Captured frame ${frame}/${totalFrames}`);
    }

    await page.goto(`${baseUrl}/?mode=preview&story=${posterStoryId}`, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector("#courtviz-poster-root", { timeout: 30_000 });
    await page.waitForTimeout(800);
    await page.locator("#courtviz-poster-root").screenshot({
      path: join(outDir, "court-dominance-interactive-1080x1920.png"),
      type: "png",
    });

    await browser.close();
  } finally {
    preview.kill("SIGTERM");
  }

  const pattern = join(framesDir, "frame-%05d.png");
  const mp4Path = join(outDir, "court-dominance-9x16.mp4");
  await encodePngSequenceToMp4({
    fps,
    width,
    height,
    inputPattern: pattern,
    outputPath: mp4Path,
    crf: 16,
  });
  console.log(`Wrote ${mp4Path}`);
}

async function writeBundleReadme(): Promise<void> {
  const readme = `# Court Dominance spike exports

Generated for local testing of the interactive-first viz engine.

| File | Description |
|------|-------------|
| \`court-dominance-9x16.mp4\` | 9:16 cinematic Three.js stage (seekable GSAP camera, no Remotion) |
| \`court-dominance-interactive-1080x1920.png\` | 2D hexbin + coach takeaway (same tokens as product) |
| \`manifest.json\` | Export metadata (fps, dimensions, seek hook) |
| \`frames/\` | PNG sequence used for MP4 |

## Interactive preview (gallery)

\`\`\`bash
cd PeakPerformanceDataMarketing/courtviz
pnpm --filter @courtviz/gallery dev
\`\`\`

Stories:
- **Spike — Court Dominance (interactive)** — host/guest toggle, HexbinLayer
- **Spike — Court Dominance (Three stage)** — orbit 3D court
- **Spike — Court Dominance (video export 9:16)** — used for MP4 capture

## Re-export

\`\`\`bash
pnpm spike:export:bundle        # full 10s @ 30fps
pnpm spike:export:bundle -- --quick   # 3s preview
\`\`\`
`;
  await writeFile(join(outDir, "README.md"), readme, "utf-8");
}

async function copyGallerySnapshot(): Promise<void> {
  const snap = join(
    galleryDir,
    "visual-snapshots/visual.spec.ts/chromium-court-dominance-interactive.png",
  );
  try {
    await copyFile(snap, join(outDir, "court-dominance-interactive-regression.png"));
  } catch {
    console.warn("Visual regression snapshot not found (run gallery visual test first).");
  }
}

async function main() {
  console.log(`Capturing ${totalFrames} frames at ${width}×${height}…`);
  await captureVideo();
  await copyGallerySnapshot();
  await writeBundleReadme();
  console.log(`\nDone. Open folder:\n  ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
