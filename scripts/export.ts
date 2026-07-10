/**
 * Unified export CLI — product, editorial, and legacy modes.
 *
 * Usage:
 *   tsx scripts/export.ts --mode=product
 *   tsx scripts/export.ts --mode=editorial
 *   tsx scripts/export.ts --mode=legacy
 *   tsx scripts/export.ts --mode=all
 */

import { execSync } from "node:child_process";
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

async function main() {
  const mode = parseArg("--mode") ?? "all";
  const forward = process.argv
    .slice(2)
    .filter((a) => !a.startsWith("--mode="))
    .join(" ");

  if (mode === "product" || mode === "all") {
    console.log("\n📦 Product export (dark branded social matrix)\n");
    run(`node scripts/export-social.cjs ${forward}`);
  }

  if (mode === "editorial" || mode === "all") {
    console.log("\n📰 Editorial export (warm narrative cards)\n");
    run(`pnpm --filter demo exec tsx ../../scripts/export-editorial.ts ${forward}`);
    run(`pnpm --filter demo exec tsx ../../scripts/export-editorial-formats.tsx ${forward}`);
  }

  if (mode === "legacy" || mode === "all") {
    console.log("\n📄 Legacy export (root flat SVGs)\n");
    run(`pnpm --filter demo exec node ../../scripts/export-static.cjs ${forward}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
