/**
 * Server-side rendering utilities for courtviz.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { embedFontsInSvg } from "./font-embed";

export { embedFontsInSvg } from "./font-embed";

export function renderToSVG(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

export function renderToSVGDocument(element: React.ReactElement): string {
  const markup = renderToStaticMarkup(element);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}

export async function saveSVG(filePath: string, svg: string): Promise<void> {
  const fs = await import("node:fs/promises");
  await fs.writeFile(filePath, svg, "utf-8");
}

export async function renderAndSaveSVG(
  filePath: string,
  element: React.ReactElement,
): Promise<string> {
  const rawSvg = renderToSVGDocument(element);
  const svg = await embedFontsInSvg(rawSvg);
  await saveSVG(filePath, svg);
  return svg;
}

export interface SvgToPngOptions {
  width?: number;
  height?: number;
  density?: number;
  /** Background color to flatten transparency onto (e.g. "#EEF4FF"). */
  background?: string;
  /** Mild unsharp mask after rasterize (sigma / m1 / m2). */
  sharpen?: { sigma: number; m1?: number; m2?: number } | false;
}

export async function svgToPNG(svg: string, options?: SvgToPngOptions): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(Buffer.from(svg), { density: options?.density ?? 144 });
    if (options?.background) {
      pipeline = pipeline.flatten({ background: options.background });
    }
    if (options?.width || options?.height) {
      pipeline = pipeline.resize(options.width, options.height);
    }
    if (options?.sharpen) {
      pipeline = pipeline.sharpen({
        m1: options.sharpen.m1 ?? 0.5,
        m2: options.sharpen.m2 ?? 0.35,
        sigma: options.sharpen.sigma,
      });
    }
    return await pipeline.png().toBuffer();
  } catch {
    throw new Error(
      "sharp is required for PNG export. Install it with: pnpm add sharp",
    );
  }
}

export async function exportGraphic(
  element: React.ReactElement,
  options: {
    svgPath: string;
    pngPath?: string;
    pngWidth?: number;
    pngHeight?: number;
    pngDensity?: number;
    pngBackground?: string;
    pngSharpen?: { sigma: number; m1?: number; m2?: number } | false;
  },
): Promise<void> {
  const rawSvg = renderToSVGDocument(element);
  const svg = await embedFontsInSvg(rawSvg);
  await saveSVG(options.svgPath, svg);

  if (options.pngPath) {
    const png = await svgToPNG(svg, {
      background: options.pngBackground,
      density: options.pngDensity,
      height: options.pngHeight,
      sharpen: options.pngSharpen,
      width: options.pngWidth,
    });
    const fs = await import("node:fs/promises");
    await fs.writeFile(options.pngPath, png);
  }
}
