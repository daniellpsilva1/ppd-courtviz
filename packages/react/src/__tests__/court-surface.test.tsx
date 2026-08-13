import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CourtScalesProvider } from "../court-scales-context";
import { CourtSurface } from "../court-surface";
import { createCourtScales } from "@courtviz/core";
import { ppd } from "@courtviz/themes";

describe("CourtSurface", () => {
  it("renders court geometry as a group", () => {
    const scales = createCourtScales({ half: "near", height: 400, width: 400 });
    const html = renderToStaticMarkup(
      <CourtScalesProvider scales={scales}>
        <CourtSurface height={400} surface="clay" theme={ppd} width={400} />
      </CourtScalesProvider>,
    );
    expect(html).toContain("<g");
    expect(html).not.toContain("<svg");
  });

  it("omits drop-shadow filter when disableShadow is set", () => {
    const withShadow = renderToStaticMarkup(
      <CourtSurface height={400} surface="clay" theme={ppd} width={400} />,
    );
    const withoutShadow = renderToStaticMarkup(
      <CourtSurface disableShadow height={400} surface="clay" theme={ppd} width={400} />,
    );
    expect(withShadow).toContain("feDropShadow");
    expect(withoutShadow).not.toContain("feDropShadow");
  });
});
