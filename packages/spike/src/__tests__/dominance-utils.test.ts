import { describe, expect, it } from "vitest";
import { combinedEfficiencyDomain } from "../dominance-utils";
import { enrichedShots } from "@courtviz/data";

describe("dominance utils", () => {
  it("computes shared efficiency domain for Boluda fixture", () => {
    const domain = combinedEfficiencyDomain(enrichedShots, ["host", "guest"]);
    expect(domain.vmax).toBeGreaterThanOrEqual(domain.vmin);
    expect(domain.vmax).toBeLessThanOrEqual(1);
  });
});
