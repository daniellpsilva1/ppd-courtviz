import { describe, expect, it } from "vitest";
import { COURT_LENGTH, NET_Y } from "../geometry";
import { placementZoneCentroid } from "../placement-zones";

describe("placementZoneCentroid", () => {
  it("maps 1–9 to far-half court meters", () => {
    const c5 = placementZoneCentroid("5");
    expect(c5).not.toBeNull();
    expect(c5!.y).toBeGreaterThan(NET_Y);
    expect(c5!.y).toBeLessThan(COURT_LENGTH);
    expect(c5!.x).toBeCloseTo(0, 5);
  });

  it("handles miss zones and unknown", () => {
    expect(placementZoneCentroid("net")?.y).toBeCloseTo(NET_Y, 5);
    expect(placementZoneCentroid("long")?.y).toBeGreaterThan(COURT_LENGTH);
    expect(placementZoneCentroid("nope")).toBeNull();
    expect(placementZoneCentroid(null)).toBeNull();
  });
});
