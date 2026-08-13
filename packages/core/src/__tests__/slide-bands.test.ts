import { describe, expect, it } from "vitest";
import { SLIDE_BANDS } from "../slide-bands";

describe("slide-bands", () => {
  it("exports a non-null object", () => {
    expect(SLIDE_BANDS).toBeDefined();
    expect(typeof SLIDE_BANDS).toBe("object");
  });

  it("has coach card layout constants", () => {
    expect(SLIDE_BANDS.coachCardGap).toBeGreaterThan(0);
    expect(SLIDE_BANDS.coachCardMinH).toBeGreaterThan(0);
    expect(SLIDE_BANDS.coachCardMaxH).toBeGreaterThan(SLIDE_BANDS.coachCardMinH);
    expect(SLIDE_BANDS.coachCardStartY).toBeGreaterThanOrEqual(0);
  });

  it("has dual court gap constant", () => {
    expect(SLIDE_BANDS.dualCourtGap).toBeGreaterThan(0);
  });

  it("has consistent value types", () => {
    for (const value of Object.values(SLIDE_BANDS)) {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});
