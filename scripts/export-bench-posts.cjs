/**
 * Bench social posts exporter — 10 portrait 4:5 (1080×1350) PNG slides.
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
const { socialFormats } = require("@ppd/tokens");
const { getLogoDataUri } = require("./logo-data.cjs");
const { BENCH_POSTS_FORMAT, BENCH_POSTS_SLIDES, benchPostFileName } = require("./bench-posts-slides.cjs");
const { buildSlide, resolveBranding } = require("./bench-post-helpers.cjs");

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

  const branding = resolveBranding(getLogoDataUri());
  const outRoot = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "bench-posts");
  cleanOutput(outRoot);

  const distExports = path.resolve(__dirname, "..", "apps", "demo", "dist", "exports", "bench-posts");
  if (fs.existsSync(distExports)) {
    fs.rmSync(distExports, { force: true, recursive: true });
  }

  const preset = socialFormats[BENCH_POSTS_FORMAT];
  console.log(`\n📸 Bench posts export — portrait 4:5 (${preset.width}×${preset.height})\n`);

  const exportedSlides = [];

  for (const [index, slide] of BENCH_POSTS_SLIDES.entries()) {
    const element = buildSlide(slide.id, fixture, branding, index, BENCH_POSTS_SLIDES.length);
    const svgPath = path.join(outRoot, benchPostFileName(index, slide.id, "svg"));
    const pngPath = svgOnly ? undefined : path.join(outRoot, benchPostFileName(index, slide.id, "png"));

    await exportGraphic(element, {
      pngHeight: preset.height,
      pngPath,
      pngWidth: preset.width,
      svgPath,
    });

    exportedSlides.push({
      id: slide.id,
      index,
      png: pngPath ? path.basename(pngPath) : null,
      subtitle: slide.subtitle,
      svg: path.basename(svgPath),
      title: slide.title,
    });

    console.log(`  ✓ bench-posts/${benchPostFileName(index, slide.id, svgOnly ? "svg" : "png")}`);
  }

  const manifest = {
    aspectRatio: preset.aspectRatio,
    fixtureHash,
    format: BENCH_POSTS_FORMAT,
    generatedAt: new Date().toISOString(),
    height: preset.height,
    platforms: ["instagram", "tiktok", "x", "linkedin"],
    schemaVersion: 1,
    slides: exportedSlides,
    width: preset.width,
  };

  fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n✅ Bench posts exported to ${outRoot}`);
  console.log(`   Fixture hash: ${fixtureHash}`);
  console.log(`   Slides: ${exportedSlides.length}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
