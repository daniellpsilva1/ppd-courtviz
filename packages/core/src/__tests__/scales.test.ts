import { describe, expect, it } from "vitest";
import { COURT_LENGTH, DOUBLES_HALF, NET_Y } from "../geometry";
import { createCourtScales } from "../scales";

describe("createCourtScales", () => {
  it("round-trips court meters through pixel space (full court)", () => {
    const scales = createCourtScales({ width: 1080, height: 1080, half: "full" });
    const samples = [
      { x: 0, y: 0 },
      { x: 0, y: NET_Y },
      { x: 0, y: COURT_LENGTH },
      { x: -DOUBLES_HALF, y: NET_Y },
      { x: DOUBLES_HALF, y: NET_Y },
    ];
    for (const sample of samples) {
      const px = scales.x(sample.x);
      const py = scales.y(sample.y);
      expect(scales.xInvert(px)).toBeCloseTo(sample.x, 5);
      expect(scales.yInvert(py)).toBeCloseTo(sample.y, 5);
    }
  });

  it("keeps equal meter aspect (meterWidth === meterHeight)", () => {
    const scales = createCourtScales({ width: 800, height: 1200, margin: 1 });
    expect(scales.meterWidth).toBeCloseTo(scales.meterHeight, 8);
  });

  it("flips Y so far baseline has smaller SVG y than near baseline", () => {
    const scales = createCourtScales({ width: 600, height: 900 });
    expect(scales.y(COURT_LENGTH)).toBeLessThan(scales.y(0));
  });

  it("maps near half without including far baseline in domain invert range", () => {
    const scales = createCourtScales({
      width: 540,
      height: 540,
      half: "near",
      margin: 0.5,
    });
    expect(scales.y(0)).toBeGreaterThan(scales.y(NET_Y));
    expect(scales.xInvert(scales.x(0))).toBeCloseTo(0, 5);
  });
});
