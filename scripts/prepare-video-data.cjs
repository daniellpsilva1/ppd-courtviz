const fs = require("fs");
const path = require("path");
const { loadMatchContext } = require("./load-match-data.cjs");

async function main() {
  const ctx = await loadMatchContext();
  const outDir = path.resolve(__dirname, "..", "apps", "video", "src", "generated");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "match-context.json");
  fs.writeFileSync(outPath, JSON.stringify(ctx, null, 2), "utf-8");
  console.log(`✅ Video match context written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
