import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { SLIDE_IDS, deckFileName } = require("../deck-slides.cjs");
const { BENCH_POSTS_SLIDE_IDS, benchPostFileName } = require("../bench-posts-slides.cjs");
const exportsRoot = path.resolve(__dirname, "../../apps/demo/public/exports");

describe("export artifacts", () => {
  it("tracks vertical story deck exports in a flat deck folder", () => {
    const manifestPath = path.join(exportsRoot, "deck", "manifest.json");
    expect(fs.existsSync(manifestPath), "missing deck/manifest.json").toBe(true);

    for (const [index, slideId] of SLIDE_IDS.entries()) {
      const pngPath = path.join(exportsRoot, "deck", deckFileName(index, slideId, "png"));
      expect(fs.existsSync(pngPath), `missing deck/${deckFileName(index, slideId, "png")}`).toBe(true);
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
      png: expect.stringMatching(/^\d{2}-.*\.png$/),
    });
  });

  it("embeds @font-face declarations in deck SVGs", () => {
    const firstSvgPath = path.join(exportsRoot, "deck", deckFileName(0, SLIDE_IDS[0], "svg"));
    if (!fs.existsSync(firstSvgPath)) return;

    const svg = fs.readFileSync(firstSvgPath, "utf-8");
    expect(svg).toContain("@font-face");
    expect(svg).toContain("Barlow Condensed");
    expect(svg).toContain("Inter");
    expect(svg).toContain("data:font/woff2;base64,");
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

describe("scene count integrity", () => {
  it("deck SLIDE_IDS count matches expected slide count", () => {
    expect(SLIDE_IDS.length).toBe(10);
  });

  it("bench posts SLIDE_IDS count matches expected slide count", () => {
    expect(BENCH_POSTS_SLIDE_IDS.length).toBe(10);
  });
});

describe("bench posts export artifacts", () => {
  const benchPostsRoot = path.join(exportsRoot, "bench-posts");

  it("tracks portrait bench post exports with manifest", () => {
    const manifestPath = path.join(benchPostsRoot, "manifest.json");
    expect(fs.existsSync(manifestPath), "missing bench-posts/manifest.json").toBe(true);

    for (const [index, slideId] of BENCH_POSTS_SLIDE_IDS.entries()) {
      const pngPath = path.join(benchPostsRoot, benchPostFileName(index, slideId, "png"));
      expect(fs.existsSync(pngPath), `missing bench-posts/${benchPostFileName(index, slideId, "png")}`).toBe(true);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.slides?.length).toBe(BENCH_POSTS_SLIDE_IDS.length);
    expect(manifest.aspectRatio).toBe("4:5");
    expect(manifest.format).toBe("portrait");
    expect(manifest.width).toBe(1080);
    expect(manifest.height).toBe(1350);
    expect(manifest.platforms).toContain("instagram");
    expect(manifest.slides[0]).toMatchObject({
      id: BENCH_POSTS_SLIDE_IDS[0],
      index: 0,
      png: expect.stringMatching(/^\d{2}-.*\.png$/),
    });
  });

  it("each bench post PNG is non-empty", () => {
    for (const [index, slideId] of BENCH_POSTS_SLIDE_IDS.entries()) {
      const pngPath = path.join(benchPostsRoot, benchPostFileName(index, slideId, "png"));
      if (!fs.existsSync(pngPath)) continue;
      expect(fs.statSync(pngPath).size).toBeGreaterThan(5_000);
    }
  });
});
