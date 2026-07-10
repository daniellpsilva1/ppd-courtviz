import { describe, expect, it } from "vitest";
import { resolveFrameLayout } from "../frame-layout";

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
    expect(layout.safeArea.y).toBe(220);
  });
});
