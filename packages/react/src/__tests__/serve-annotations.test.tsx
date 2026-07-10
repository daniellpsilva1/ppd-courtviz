import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { ServeAnnotations } from "../serve-annotations";
import { StatCallout } from "../stat-callout";
import { createCourtScales, type ServeZoneStat } from "@courtviz/core";
import { ppd } from "@courtviz/themes";

const scales = createCourtScales({ half: "near", height: 600, margin: 1.5, width: 600 });

const sampleZones: ServeZoneStat[] = [
  {
    count: 12,
    inCount: 10,
    inRate: 0.83,
    meanX: 2,
    meanY: 6,
    side: "deuce",
    winRate: 0.67,
    zone: "T",
  },
];

describe("ServeAnnotations", () => {
  it("renders callout for top zone", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ServeAnnotations, { scales, theme: ppd, zones: sampleZones }),
    );
    expect(markup).toContain("serve-annotations");
    expect(markup).toContain("83%");
    expect(markup).toContain("DEUCE T");
  });

  it("renders nothing when zones empty", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ServeAnnotations, { scales, theme: ppd, zones: [] }),
    );
    expect(markup).toBe("");
  });
});

describe("StatCallout", () => {
  it("renders value and uppercase label", () => {
    const markup = renderToStaticMarkup(
      React.createElement(StatCallout, {
        label: "deuce zone win rate",
        theme: ppd,
        value: "72%",
        x: 40,
        y: 60,
      }),
    );
    expect(markup).toContain("72%");
    expect(markup).toContain("DEUCE ZONE WIN RATE");
  });
});
