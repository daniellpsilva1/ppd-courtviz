import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportsRoot = path.resolve(__dirname, "../../apps/demo/public/exports");

const EXPECTED_DECK_SLIDES = [
  "slide-cover",
  "slide-serve",
  "slide-placement",
  "slide-zones",
  "slide-patterns",
  "slide-rally",
  "slide-momentum",
  "slide-match-numbers",
  "slide-shotmaking",
  "slide-errors",
  "slide-density",
  "slide-coach",
  "slide-cta",
];

const EXPECTED_DECK_FORMATS = ["portrait", "story"];

describe("export artifacts", () => {
  it("tracks coach deck exports in portrait and story formats", () => {
    const manifestPath = path.join(exportsRoot, "deck", "manifest.json");
    expect(fs.existsSync(manifestPath), "missing deck/manifest.json").toBe(true);

    for (const format of EXPECTED_DECK_FORMATS) {
      for (const slideId of EXPECTED_DECK_SLIDES) {
        const pngPath = path.join(exportsRoot, "deck", format, `${slideId}.png`);
        expect(fs.existsSync(pngPath), `missing deck/${format}/${slideId}.png`).toBe(true);
      }
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.slides?.length).toBe(EXPECTED_DECK_SLIDES.length);
    expect(manifest.formats?.portrait?.platforms).toContain("instagram");
    expect(manifest.formats?.story?.platforms).toContain("tiktok");
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

  it("tracks carousel caption manifest when generated", () => {
    const captionsPath = path.join(exportsRoot, "captions", "captions.json");
    if (fs.existsSync(captionsPath)) {
      const manifest = JSON.parse(fs.readFileSync(captionsPath, "utf-8"));
      expect(manifest.platforms?.instagram).toBeTruthy();
      expect(manifest.platforms?.linkedin).toBeUndefined();
    }
  });
});
