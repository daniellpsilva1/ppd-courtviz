import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { SLIDE_IDS } = require("../deck-slides.cjs");
const exportsRoot = path.resolve(__dirname, "../../apps/demo/public/exports");

describe("export artifacts", () => {
  it("tracks vertical story deck exports in a flat deck folder", () => {
    const manifestPath = path.join(exportsRoot, "deck", "manifest.json");
    expect(fs.existsSync(manifestPath), "missing deck/manifest.json").toBe(true);

    for (const slideId of SLIDE_IDS) {
      const pngPath = path.join(exportsRoot, "deck", `${slideId}.png`);
      expect(fs.existsSync(pngPath), `missing deck/${slideId}.png`).toBe(true);
    }

    expect(fs.existsSync(path.join(exportsRoot, "deck", "story"))).toBe(false);
    expect(fs.existsSync(path.join(exportsRoot, "deck", "portrait"))).toBe(false);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.slides?.length).toBe(SLIDE_IDS.length);
    expect(manifest.aspectRatio).toBe("9:16");
    expect(manifest.format).toBe("story");
    expect(manifest.platforms).toContain("instagram");
    expect(manifest.platforms).toContain("tiktok");
    expect(manifest.slides[0]).toMatchObject({
      id: SLIDE_IDS[0],
      index: 0,
      png: expect.stringMatching(/\.png$/),
    });
  });

  it("tracks video exports when rendered", () => {
    const landscapePath = path.join(exportsRoot, "video", "match-recap-landscape.mp4");
    const socialPath = path.join(exportsRoot, "video", "match-recap-social.mp4");
    if (fs.existsSync(landscapePath)) {
      expect(fs.statSync(landscapePath).size).toBeGreaterThan(100_000);
    }
    if (fs.existsSync(socialPath)) {
      expect(fs.statSync(socialPath).size).toBeGreaterThan(100_000);
    }
  });

  it("tracks deck caption manifest when generated", () => {
    const captionsPath = path.join(exportsRoot, "captions", "captions.json");
    if (fs.existsSync(captionsPath)) {
      const manifest = JSON.parse(fs.readFileSync(captionsPath, "utf-8"));
      expect(manifest.platforms?.instagram).toBeTruthy();
      expect(manifest.deckSlideCount).toBe(SLIDE_IDS.length);
      expect(manifest.platforms?.linkedin).toBeUndefined();
    }
  });
});
