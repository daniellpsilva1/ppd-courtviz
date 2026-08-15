import { describe, expect, it } from "vitest";

const { selectSlides, computeEligibility, MAX_SLIDES } = require("../select-slides.cjs");

function makeShot(overrides = {}) {
  return {
    bounceY: null,
    bounceZone: null,
    direction: null,
    isTerminal: false,
    player: "host",
    result: "In",
    speedKmh: null,
    stroke: "Forehand",
    ...overrides,
  };
}

function makePoint(overrides = {}) {
  return {
    isBreakPoint: false,
    isMatchPoint: false,
    isSetPoint: false,
    rallyLength: 4,
    ...overrides,
  };
}

function makeSet(overrides = {}) {
  return {
    guestScore: 4,
    hostScore: 6,
    setNumber: 1,
    ...overrides,
  };
}

const richContext = {
  enrichedShots: [
    ...Array.from({ length: 20 }, (_, i) => makeShot({ bounceY: 10 + i * 0.1, bounceZone: "deep", player: i % 2 ? "host" : "guest", speedKmh: 150, stroke: "Serve" })),
    ...Array.from({ length: 20 }, (_, i) => makeShot({ bounceY: 9 + i * 0.1, bounceZone: "mid", direction: "crosscourt", player: i % 2 ? "host" : "guest", stroke: "Forehand" })),
    ...Array.from({ length: 10 }, (_, i) => makeShot({ bounceY: 8 + i * 0.1, bounceZone: "shallow", direction: "downTheLine", player: i % 2 ? "host" : "guest", stroke: "Backhand" })),
    ...Array.from({ length: 5 }, () => makeShot({ player: "host", stroke: "Volley" })),
    ...Array.from({ length: 5 }, () => makeShot({ player: "guest", result: "Out", stroke: "Forehand" })),
    ...Array.from({ length: 3 }, () => makeShot({ player: "host", result: "Net", stroke: "Forehand" })),
  ],
  points: [
    ...Array.from({ length: 10 }, (_, i) => makePoint({ rallyLength: 2 + i % 3 })),
    ...Array.from({ length: 8 }, (_, i) => makePoint({ rallyLength: 5, isBreakPoint: i === 0 })),
    ...Array.from({ length: 4 }, (_, i) => makePoint({ rallyLength: 8, isSetPoint: i === 0 })),
  ],
  sets: [makeSet(), makeSet({ guestScore: 6, hostScore: 3, setNumber: 2 }), makeSet({ guestScore: 3, hostScore: 6, setNumber: 3 })],
};

const sparseContext = {
  enrichedShots: [
    ...Array.from({ length: 3 }, () => makeShot({ stroke: "Serve" })),
    makeShot({ stroke: "Forehand" }),
  ],
  points: [makePoint(), makePoint({ rallyLength: 2 })],
  sets: [makeSet()],
};

describe("selectSlides", () => {
  it("returns ≤12 slides", () => {
    const result = selectSlides(richContext);
    expect(result.length).toBeLessThanOrEqual(MAX_SLIDES);
  });

  it("always includes cover and cta", () => {
    const result = selectSlides(richContext);
    expect(result).toContain("cover");
    expect(result).toContain("cta");
  });

  it("returns slides in catalog order", () => {
    const result = selectSlides(richContext);
    const { BENCH_POSTS_SLIDES } = require("../bench-posts-slides.cjs");
    const catalogIds = BENCH_POSTS_SLIDES.map((s: { id: string }) => s.id);
    let lastIndex = -1;
    for (const id of result) {
      const idx = catalogIds.indexOf(id);
      expect(idx).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("gates out serve slides when insufficient serves", () => {
    const eligibility = computeEligibility(sparseContext);
    expect(eligibility["serve-map-host"]).toBe(false);
    expect(eligibility["serve-map-guest"]).toBe(false);
    expect(eligibility["serve-1st-vs-2nd"]).toBe(false);
  });

  it("gates out volley slides when insufficient volleys", () => {
    const eligibility = computeEligibility(sparseContext);
    expect(eligibility["volley-map"]).toBe(false);
    expect(eligibility["approach-net"]).toBe(false);
  });

  it("gates out zone-win slides when insufficient zone data", () => {
    const eligibility = computeEligibility(sparseContext);
    expect(eligibility["zone-win-host"]).toBe(false);
    expect(eligibility["zone-win-guest"]).toBe(false);
  });

  it("includes serve slides when data is rich", () => {
    const eligibility = computeEligibility(richContext);
    expect(eligibility["serve-map-host"]).toBe(true);
    expect(eligibility["serve-1st-vs-2nd"]).toBe(true);
  });

  it("penalizes slides used in previous decks", () => {
    const withoutPrev = selectSlides(richContext);
    const withPrev = selectSlides(richContext, {
      previousDecks: [withoutPrev],
    });
    // The result should still be valid
    expect(withPrev.length).toBeLessThanOrEqual(MAX_SLIDES);
    // At least one slide should differ
    const diff = withPrev.filter((id: string) => !withoutPrev.includes(id));
    expect(diff.length).toBeGreaterThan(0);
  });

  it("handles empty context gracefully", () => {
    const result = selectSlides({ enrichedShots: [], points: [], sets: [] });
    expect(result).toContain("cover");
    expect(result).toContain("cta");
    expect(result.length).toBeLessThanOrEqual(MAX_SLIDES);
  });
});
