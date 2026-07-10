import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportsRoot = path.resolve(__dirname, "../../apps/demo/public/exports");

describe("export artifacts", () => {
  it("tracks legacy root SVG exports", () => {
    const legacyNames = [
      "dotdensity.svg",
      "hexbin-dark.svg",
      "hexbin-guest.svg",
      "hexbin-host.svg",
      "momentum.svg",
      "rays-host.svg",
      "serve-host.svg",
    ];
    for (const name of legacyNames) {
      expect(fs.existsSync(path.join(exportsRoot, name))).toBe(true);
    }
  });
});
