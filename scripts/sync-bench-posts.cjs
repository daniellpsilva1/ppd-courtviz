/**
 * Sync exported bench post PNGs + manifest to the app's public directory.
 */

const fs = require("fs");
const path = require("path");

const sourceDir = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "bench-posts");
const destDir = path.resolve(__dirname, "..", "..", "PeakPerformanceData", "peak_performance_data", "public", "tennis-bench", "posts");

if (!fs.existsSync(sourceDir)) {
  console.error(`Source not found: ${sourceDir}\nRun "pnpm export:bench-posts" first.`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".png") || f.endsWith(".json"));
for (const file of files) {
  fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
}

console.log(`✅ Synced ${files.length} files to ${destDir}`);
