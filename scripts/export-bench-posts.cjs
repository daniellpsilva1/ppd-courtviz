/**
 * Bench social posts exporter — 13 portrait 4:5 (2160×2700) PNG slides.
 *
 * Usage:
 *   node scripts/export-bench-posts.cjs
 *   node scripts/export-bench-posts.cjs --svg-only
 */

const fs = require("fs");
const path = require("path");

const demoNodeModules = path.resolve(__dirname, "..", "apps", "demo", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "node_modules");
module.paths = [demoNodeModules, rootNodeModules, ...(module.paths || [])];

const { exportGraphic } = require("@courtviz/render");
const sharp = require("sharp");
const { socialFormats } = require("@ppd/tokens");
const { BENCH_POSTS_FORMAT, BENCH_POSTS_SLIDES, benchPostFileName } = require("./bench-posts-slides.cjs");
const { buildSlide, resolveBranding, BENCH_BG_MID } = require("./bench-post-helpers.cjs");

const SERVE_SLIDE_IDS = new Set([
  "serve-map-host", "serve-map-guest", "serve-zones-heat",
  "serve-1st-vs-2nd", "serve-speed-court-host", "serve-speed-court-guest",
  "serve-plus-one", "return-placement", "fastest-serve",
]);

const FLOW_SLIDE_IDS = new Set([
  "crosscourt-flows", "down-the-line-flows", "inside-out-in", "depth-angle",
]);

async function runAlphaCheck(outRoot, exportedSlides) {
  const sampleIds = [exportedSlides[0], exportedSlides[Math.floor(exportedSlides.length / 2)], exportedSlides[exportedSlides.length - 1]].filter(Boolean);
  let failures = 0;
  for (const slide of sampleIds) {
    if (!slide.png) continue;
    const pngPath = path.join(outRoot, slide.png);
    if (!fs.existsSync(pngPath)) continue;
    const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    if (channels < 4) continue;
    const w = info.width;
    const h = info.height;
    const pixels = [
      [0, 0],
      [Math.floor(w / 2), 0],
      [Math.floor(w / 2), Math.floor(h / 2)],
      [0, Math.floor(h / 2)],
      [Math.floor(w / 2), h - 1],
    ];
    for (const [px, py] of pixels) {
      const idx = (py * w + px) * channels;
      const alpha = data[idx + 3];
      if (alpha < 255) {
        console.warn(`  ⚠ Alpha check failed: ${slide.png} pixel (${px},${py}) alpha=${alpha}`);
        failures++;
      }
    }
  }
  if (failures === 0) {
    console.log("✅ Alpha-channel check passed (no transparent pixels in sample slides)");
  } else {
    console.warn(`⚠️  Alpha-channel check: ${failures} transparent pixel(s) found`);
  }
}

function runQaAsserts(fixture, matchCtx) {
  const errors = [];
  const enriched = matchCtx.enrichedShots || [];

  for (const s of enriched) {
    if (s.hitY != null && (s.hitY < -5 || s.hitY > 29)) {
      errors.push(`Outlier hitY=${s.hitY} on shot ${s.shotNumber} (set ${s.setNumber}, game ${s.gameNumber})`);
    }
    if (s.bounceY != null && (s.bounceY < -5 || s.bounceY > 29)) {
      errors.push(`Outlier bounceY=${s.bounceY} on shot ${s.shotNumber} (set ${s.setNumber}, game ${s.gameNumber})`);
    }
  }

  const serveShots = enriched.filter((s) => s.stroke === "Serve");
  if (serveShots.length === 0) {
    errors.push("No serve shots found in enriched data — serve slides will be empty");
  }

  const flowShots = enriched.filter((s) => s.result === "In");
  if (flowShots.length === 0) {
    errors.push("No 'In' result shots found — flow slides will be empty");
  }

  const depthClassifiable = enriched.filter((s) => s.bounceY != null && s.result === "In");
  if (depthClassifiable.length === 0) {
    errors.push("No In shots with bounceY for depth classification");
  }

  if (errors.length > 0) {
    console.warn("\n⚠️  QA asserts failed:");
    for (const e of errors.slice(0, 10)) {
      console.warn(`   - ${e}`);
    }
    if (errors.length > 10) {
      console.warn(`   ... and ${errors.length - 10} more`);
    }
  } else {
    console.log("✅ QA asserts passed (outliers, serve-only, flow In filter)");
  }

  return errors.length;
}

function loadMatchContext() {
  const data = require("@courtviz/data");
  return {
    enrichedShots: data.enrichedShots,
    guestName: data.guestName,
    hostName: data.hostName,
    matchDate: data.matchDate,
    momentumPoints: data.momentumPoints,
    points: data.points,
    sets: data.sets,
    shots: data.shots,
    surface: data.surface,
  };
}

function parseArgs() {
  const svgOnly = process.argv.includes("--svg-only");
  return { svgOnly };
}

function cleanOutput(outRoot) {
  if (fs.existsSync(outRoot)) {
    fs.rmSync(outRoot, { force: true, recursive: true });
  }
  fs.mkdirSync(outRoot, { recursive: true });
}

function loadFixture() {
  const fixturePath = path.resolve(__dirname, "..", "packages", "data", "src", "fixtures", "bench-landing.json");
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}\nRun "node scripts/generate-bench-fixture.cjs" first.`);
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
}

function computeFixtureHash(fixture) {
  return require("crypto").createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 12);
}

async function main() {
  const { svgOnly } = parseArgs();
  const fixture = loadFixture();
  const fixtureHash = computeFixtureHash(fixture);
  const matchCtx = loadMatchContext();

  runQaAsserts(fixture, matchCtx);

  const branding = resolveBranding();
  const outRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "bench-posts");
  cleanOutput(outRoot);

  const distExports = path.resolve(__dirname, "..", "apps", "demo", "dist", "exports", "bench-posts");
  if (fs.existsSync(distExports)) {
    fs.rmSync(distExports, { force: true, recursive: true });
  }

  const preset = socialFormats[BENCH_POSTS_FORMAT];
  const exportScale = 3;
  const pngWidth = preset.width * exportScale;
  const pngHeight = preset.height * exportScale;
  console.log(`\n📸 Bench posts export — portrait 4:5 (${pngWidth}×${pngHeight}, ${exportScale}× supersampled)\n`);

  const exportedSlides = [];

  for (const [index, slide] of BENCH_POSTS_SLIDES.entries()) {
    const element = buildSlide(slide.id, fixture, branding, index, BENCH_POSTS_SLIDES.length, matchCtx);
    const svgPath = path.join(outRoot, benchPostFileName(index, slide.id, "svg"));
    const pngPath = svgOnly ? undefined : path.join(outRoot, benchPostFileName(index, slide.id, "png"));

    await exportGraphic(element, {
      // Native 3× raster (72×3) + light sharpen; avoid 288→Lanczos downscale mush.
      pngBackground: BENCH_BG_MID,
      pngDensity: 216,
      pngHeight: pngHeight,
      pngPath,
      pngSharpen: { m1: 0.5, m2: 0.35, sigma: 0.55 },
      pngWidth: pngWidth,
      svgPath,
    });

    exportedSlides.push({
      id: slide.id,
      index,
      png: pngPath ? path.basename(pngPath) : null,
      section: slide.section || null,
      subtitle: slide.subtitle,
      svg: path.basename(svgPath),
      title: slide.title,
    });

    console.log(`  ✓ bench-posts/${benchPostFileName(index, slide.id, svgOnly ? "svg" : "png")}`);
  }

  const manifest = {
    aspectRatio: preset.aspectRatio,
    exportScale,
    fixtureHash,
    format: BENCH_POSTS_FORMAT,
    generatedAt: new Date().toISOString(),
    height: pngHeight,
    platforms: ["instagram", "tiktok", "x", "linkedin"],
    schemaVersion: 1,
    slides: exportedSlides,
    width: pngWidth,
  };

  fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n✅ Bench posts exported to ${outRoot}`);
  console.log(`   Fixture hash: ${fixtureHash}`);
  console.log(`   Slides: ${exportedSlides.length}\n`);

  if (!svgOnly) {
    await runAlphaCheck(outRoot, exportedSlides);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
