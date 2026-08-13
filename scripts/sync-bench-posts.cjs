/**
 * Sync exported bench post PNGs + manifest to the app's public directory.
 * Prunes destination PNGs/SVGs that are no longer in the export set.
 */

const fs = require("fs");
const path = require("path");

const sourceDir = path.resolve(__dirname, "..", "apps", "demo", "public", "exports", "bench-posts");
const destDir = path.resolve(__dirname, "..", "..", "..", "PeakPerformanceData", "peak_performance_data", "public", "tennis-bench", "posts");

if (!fs.existsSync(sourceDir)) {
  console.error(`Source not found: ${sourceDir}\nRun "pnpm export:bench-posts" first.`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

const sourceFiles = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".png") || f.endsWith(".json"));
const keepSet = new Set(sourceFiles);

for (const file of sourceFiles) {
  fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
}

let pruned = 0;
for (const file of fs.readdirSync(destDir)) {
  if (!/\.(png|svg|json)$/.test(file)) continue;
  if (keepSet.has(file)) continue;
  fs.unlinkSync(path.join(destDir, file));
  pruned++;
}

console.log(`✅ Synced ${sourceFiles.length} files to ${destDir}${pruned ? ` (pruned ${pruned} stale)` : ""}`);
