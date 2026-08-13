import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { BENCH_POSTS_SLIDE_IDS, benchPostFileName } = require("../bench-posts-slides.cjs");
const { measureSvgText } = require("@courtviz/core");
const exportsRoot = path.resolve(__dirname, "../../apps/demo/public/exports");

describe("export artifacts", () => {
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

  it("tracks bench-posts caption manifest when generated", () => {
    const captionsPath = path.join(exportsRoot, "captions", "captions.json");
    if (fs.existsSync(captionsPath)) {
      const manifest = JSON.parse(fs.readFileSync(captionsPath, "utf-8"));
      expect(manifest.platforms?.instagram).toBeTruthy();
      expect(manifest.deckSlideCount).toBe(BENCH_POSTS_SLIDE_IDS.length);
      expect(manifest.platforms?.linkedin).toBeUndefined();
    }
  });
});

describe("scene count integrity", () => {
  it("bench posts SLIDE_IDS count matches expected slide count", () => {
    expect(BENCH_POSTS_SLIDE_IDS.length).toBe(55);
  });

  it("drops legacy bar/histogram slide ids", () => {
    for (const legacyId of ["spin-mix", "serve-speed", "depth-aggression", "rally-buckets", "first-strike", "winners-errors", "break-points"]) {
      expect(BENCH_POSTS_SLIDE_IDS).not.toContain(legacyId);
    }
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
    expect(manifest.width).toBe(3240);
    expect(manifest.height).toBe(4050);
    expect(manifest.platforms).toContain("instagram");
    expect(manifest.slides[0]).toMatchObject({
      id: BENCH_POSTS_SLIDE_IDS[0],
      index: 0,
      png: expect.stringMatching(/^\d{2}-.*\.png$/),
      section: "Open",
    });
    expect(manifest.slides.every((s: { section?: string }) => Boolean(s.section))).toBe(true);
  });

  it("serve-map-host SVG has BrandMark and no serve % callout circles", () => {
    const svgPath = path.join(benchPostsRoot, "06-serve-map-host.svg");
    expect(fs.existsSync(svgPath), "missing 06-serve-map-host.svg").toBe(true);
    const svg = fs.readFileSync(svgPath, "utf-8");
    expect(svg).not.toContain("serve-annotations");
    expect(svg).not.toMatch(/IN\s*[—-]/);
    expect(svg).toContain("brand-mark-icon");
    expect(svg).not.toContain("data:image");
  });

  it("each bench post PNG is non-empty", () => {
    for (const [index, slideId] of BENCH_POSTS_SLIDE_IDS.entries()) {
      const pngPath = path.join(benchPostsRoot, benchPostFileName(index, slideId, "png"));
      if (!fs.existsSync(pngPath)) continue;
      expect(fs.statSync(pngPath).size).toBeGreaterThan(5_000);
    }
  });
});

describe("legendRow horizontal spacing", () => {
  it("horizontal legend items do not overlap — x offsets strictly increase by measured label width", () => {
    const fontFamily = "Inter, Helvetica Neue, Arial, sans-serif";
    const fontSize = 12;
    const fontWeight = 500;
    const swatch = 10;
    const gap = 6;
    const itemGap = 24;

    const items = [
      { color: "#3B82F6", label: "Host shots" },
      { color: "#F97316", label: "Guest shots" },
      { color: "#C97B4E", label: "clay court" },
    ];

    let cursorX = 0;
    const xPositions: number[] = [];
    for (const item of items) {
      xPositions.push(cursorX);
      const labelW = measureSvgText(item.label, { fontFamily, fontSize, fontWeight });
      cursorX += swatch + gap + labelW + itemGap;
    }

    for (let i = 1; i < xPositions.length; i++) {
      expect(xPositions[i]).toBeGreaterThan(xPositions[i - 1]);
      const prevLabelW = measureSvgText(items[i - 1].label, { fontFamily, fontSize, fontWeight });
      const prevItemEnd = xPositions[i - 1] + swatch + gap + prevLabelW;
      expect(xPositions[i]).toBeGreaterThanOrEqual(prevItemEnd);
    }
  });
});
