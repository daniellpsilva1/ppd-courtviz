/**
 * Unified export CLI — deck, captions, videos, and optional posters.
 *
 * Usage:
 *   tsx scripts/export.ts
 *   tsx scripts/export.ts --mode=deck --matchId=<uuid>
 *   tsx scripts/export.ts --mode=posters
 *   tsx scripts/export.ts --mode=video-render
 *   tsx scripts/export.ts --mode=all
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function parseArg(prefix: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`${prefix}=`))?.split("=")[1];
}

function run(cmd: string) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function copyVideosToExports() {
  const videoOut = path.join(root, "apps", "video", "out");
  const exportVideoDir = path.join(root, "apps", "demo", "public", "exports", "video");
  fs.mkdirSync(exportVideoDir, { recursive: true });

  const copies = [
    { dest: "match-recap-landscape.mp4", src: "match-recap.mp4" },
    { dest: "match-recap-social.mp4", src: "match-recap-social.mp4" },
  ];

  for (const { dest, src } of copies) {
    const sourcePath = path.join(videoOut, src);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Missing video output: ${sourcePath}`);
      continue;
    }
    fs.copyFileSync(sourcePath, path.join(exportVideoDir, dest));
    console.log(`  ✓ exports/video/${dest}`);
  }
}

async function main() {
  const mode = parseArg("--mode") ?? "default";
  const forward = process.argv
    .slice(2)
    .filter((a) => !a.startsWith("--mode="))
    .join(" ");

  const runDeck = mode === "default" || mode === "deck" || mode === "carousel" || mode === "all";
  const runPosters = mode === "posters" || mode === "product" || mode === "all";
  const runCaptions = mode === "default" || mode === "captions" || mode === "all";
  const runVideoData = mode === "video-data" || mode === "video-render" || mode === "all";
  const runVideoRender = mode === "video-render" || mode === "all";

  if (runDeck) {
    console.log("\n📱 Deck export (portrait + story)\n");
    run(`node scripts/export-carousel.cjs ${forward}`);
  }

  if (runPosters) {
    console.log("\n📦 Poster export (optional formats)\n");
    run(`node scripts/export-social.cjs ${forward}`);
  }

  if (runCaptions) {
    console.log("\n📝 Caption export\n");
    run(`node scripts/generate-captions.cjs ${forward}`);
  }

  if (runVideoData) {
    console.log("\n🎬 Prepare video match context\n");
    run(`node scripts/prepare-video-data.cjs ${forward}`);
  }

  if (runVideoRender) {
    const videoOut = path.join(root, "apps", "video", "out");
    const landscapePath = path.join(videoOut, "match-recap.mp4");
    const socialPath = path.join(videoOut, "match-recap-social.mp4");
    const forceVideo = process.argv.includes("--force-video");
    const hasVideos = fs.existsSync(landscapePath) && fs.existsSync(socialPath);

    if (hasVideos && !forceVideo) {
      console.log("\n🎥 Reusing existing video renders (pass --force-video to re-render)\n");
    } else {
      console.log("\n🎥 Render landscape + social videos\n");
      run("pnpm --filter @courtviz/video render");
      run("pnpm --filter @courtviz/video render:social");
    }

    console.log("\n📁 Copy videos to exports/video\n");
    copyVideosToExports();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
