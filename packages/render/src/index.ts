/**
 * Server-side rendering utilities for courtviz.
 */

import { renderToStaticMarkup } from "react-dom/server";

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
  const svg = renderToSVGDocument(element);
  await saveSVG(filePath, svg);
  return svg;
}

export interface SvgToPngOptions {
  width?: number;
  height?: number;
  density?: number;
}

export async function svgToPNG(svg: string, options?: SvgToPngOptions): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(Buffer.from(svg), { density: options?.density ?? 144 });
    if (options?.width || options?.height) {
      pipeline = pipeline.resize(options.width, options.height);
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
  },
): Promise<void> {
  const svg = await renderAndSaveSVG(options.svgPath, element);

  if (options.pngPath) {
    const png = await svgToPNG(svg, {
      density: options.pngDensity,
      height: options.pngHeight,
      width: options.pngWidth,
    });
    const fs = await import("node:fs/promises");
    await fs.writeFile(options.pngPath, png);
  }
}
