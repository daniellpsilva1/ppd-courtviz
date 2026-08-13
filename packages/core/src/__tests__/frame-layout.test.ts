import { describe, expect, it } from "vitest";
import { layoutBands, resolveFrameLayout, resolvePosterContentLayout } from "../frame-layout";

describe("resolveFrameLayout", () => {
  it("resolves square layout", () => {
    const layout = resolveFrameLayout("square");
    expect(layout.width).toBe(1080);
    expect(layout.height).toBe(1080);
    expect(layout.content.height).toBeGreaterThan(0);
  });

  it("resolves landscape two-column layout", () => {
    const layout = resolveFrameLayout("landscape");
    expect(layout.width).toBe(1920);
    expect(layout.content.x).toBeGreaterThan(layout.title.x);
  });

  it("reserves story safe areas", () => {
    const layout = resolveFrameLayout("story");
    expect(layout.safeArea.y).toBe(72);
    expect(layout.content.height).toBeGreaterThan(1400);
  });

  it("title region does not overlap content region", () => {
    for (const format of ["square", "portrait", "story"] as const) {
      const layout = resolveFrameLayout(format);
      expect(layout.title.y + layout.title.height).toBeLessThanOrEqual(layout.content.y);
    }
  });

  it("content region does not overlap footer region", () => {
    for (const format of ["square", "portrait", "story"] as const) {
      const layout = resolveFrameLayout(format);
      expect(layout.content.y + layout.content.height).toBeLessThanOrEqual(layout.footer.y);
    }
  });

  it("all regions within safe area", () => {
    for (const format of ["square", "portrait", "story"] as const) {
      const layout = resolveFrameLayout(format);
      expect(layout.title.x).toBeGreaterThanOrEqual(layout.safeArea.x);
      expect(layout.title.y).toBeGreaterThanOrEqual(layout.safeArea.y);
      expect(layout.content.x).toBeGreaterThanOrEqual(layout.safeArea.x);
      expect(layout.content.y).toBeGreaterThanOrEqual(layout.safeArea.y);
      expect(layout.footer.x).toBeGreaterThanOrEqual(layout.safeArea.x);
      expect(layout.footer.y + layout.footer.height).toBeLessThanOrEqual(
        layout.safeArea.y + layout.safeArea.height,
      );
    }
  });

  it("content height is at least 60% of available height", () => {
    for (const format of ["square", "portrait", "story"] as const) {
      const layout = resolveFrameLayout(format);
      const available = layout.safeArea.height;
      expect(layout.content.height).toBeGreaterThanOrEqual(available * 0.6);
    }
  });

  it("accepts titleHeight override", () => {
    const layout = resolveFrameLayout("square", { titleHeight: 140 });
    expect(layout.title.height).toBe(140);
    expect(layout.content.y).toBe(layout.safeArea.y + 140);
  });

  it("accepts footerHeight override", () => {
    const layout = resolveFrameLayout("square", { footerHeight: 80 });
    expect(layout.footer.height).toBe(80);
  });

  it("titleHeight override reduces content height", () => {
    const defaultLayout = resolveFrameLayout("square");
    const taller = resolveFrameLayout("square", { titleHeight: 140 });
    expect(taller.content.height).toBeLessThan(defaultLayout.content.height);
  });
});

describe("resolvePosterContentLayout", () => {
  it("court + analytics + insight bands do not overlap", () => {
    const layout = resolveFrameLayout("portrait");
    const poster = resolvePosterContentLayout(layout, {
      courtAspect: 1,
      analyticsBand: 180,
      insightBand: 80,
    });
    expect(poster.courtY + poster.courtHeight).toBeLessThanOrEqual(poster.analyticsY);
    expect(poster.analyticsY + poster.bands.analyticsBand).toBeLessThanOrEqual(poster.insightY);
  });

  it("court dimensions respect aspect ratio", () => {
    const layout = resolveFrameLayout("square");
    const poster = resolvePosterContentLayout(layout, { courtAspect: 1.5 });
    const ratio = poster.courtWidth / poster.courtHeight;
    expect(ratio).toBeCloseTo(1.5, 0);
  });

  it("analytics band gets remaining space after court", () => {
    const layout = resolveFrameLayout("portrait");
    const poster = resolvePosterContentLayout(layout, {
      courtAspect: 1,
      analyticsBand: 180,
      legendBand: 0,
      insightBand: 80,
    });
    expect(poster.analyticsY).toBeGreaterThan(poster.courtY + poster.courtHeight);
  });
});

describe("layoutBands", () => {
  it("allocates fixed-height bands sequentially", () => {
    const bands = layoutBands(600, [
      { id: "header", height: 100 },
      { id: "body", height: 300 },
      { id: "footer", height: 100 },
    ]);
    expect(bands).toHaveLength(3);
    expect(bands[0]).toMatchObject({ id: "header", y: 0, height: 100 });
    expect(bands[1]).toMatchObject({ id: "body", y: 112, height: 300 });
    expect(bands[2]).toMatchObject({ id: "footer", y: 424, height: 100 });
  });

  it("grow band absorbs leftover height", () => {
    const bands = layoutBands(600, [
      { id: "header", height: 100 },
      { id: "viz", grow: true },
      { id: "footer", height: 80 },
    ]);
    const growBand = bands.find((b) => b.id === "viz");
    expect(growBand?.height).toBe(396);
    const total = bands[bands.length - 1]!.y + bands[bands.length - 1]!.height;
    expect(total).toBeLessThanOrEqual(600);
  });

  it("respects minHeight for grow band", () => {
    const bands = layoutBands(200, [
      { id: "header", height: 180 },
      { id: "viz", grow: true, minHeight: 50 },
    ]);
    const growBand = bands.find((b) => b.id === "viz");
    expect(growBand?.height).toBe(50);
  });

  it("uses custom gap", () => {
    const bands = layoutBands(500, [
      { id: "a", height: 100 },
      { id: "b", height: 100 },
    ], 24);
    expect(bands[1]!.y).toBe(124);
  });

  it("single band with grow fills entire height", () => {
    const bands = layoutBands(800, [{ id: "only", grow: true }]);
    expect(bands[0]).toMatchObject({ id: "only", y: 0, height: 800 });
  });

  it("bands do not overlap", () => {
    const bands = layoutBands(700, [
      { id: "a", height: 120 },
      { id: "b", grow: true },
      { id: "c", height: 80 },
    ]);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]!.y).toBeGreaterThanOrEqual(bands[i - 1]!.y + bands[i - 1]!.height);
    }
  });
});
