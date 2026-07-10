/**
 * Generates integration artifacts from @ppd/tokens for external consumers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chartPalette,
  chartPaletteLight,
  colorPrimitives,
  hexToHsl,
  semanticColors,
  sportColors,
  tokens,
  typography,
} from "../dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../../integration");

function hslVar(hex) {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  ✓ ${path.relative(outDir, filePath)}`);
}

ensureDir(outDir);

write(path.join(outDir, "tokens.json"), JSON.stringify(tokens, null, 2));

const light = semanticColors.light;
const dark = semanticColors.dark;

const css = `/* Generated from @ppd/tokens */
:root {
  --radius: 0.75rem;
  --primary-rgb: 37, 99, 235;
  --background: ${hslVar(light.background)};
  --foreground: ${hslVar(light.ink)};
  --primary: ${hslVar(light.primary)};
  --accent: ${hslVar(light.accent)};
  --border: ${hslVar(light.border)};
  --chart-1: ${hslVar(chartPaletteLight[0])};
  --chart-2: ${hslVar(chartPaletteLight[1])};
  --chart-3: ${hslVar(chartPaletteLight[2])};
  --chart-4: ${hslVar(chartPaletteLight[3])};
  --chart-5: ${hslVar(chartPaletteLight[4])};
}

.dark {
  --primary-rgb: 59, 130, 246;
  --background: ${hslVar(dark.background)};
  --foreground: ${hslVar(dark.ink)};
  --primary: ${hslVar(dark.primary)};
  --accent: 225 30% 25%;
  --border: ${hslVar(dark.border)};
  --chart-1: ${hslVar(chartPalette[0])};
  --chart-2: ${hslVar(chartPalette[1])};
  --chart-3: ${hslVar(chartPalette[2])};
  --chart-4: ${hslVar(chartPalette[3])};
  --chart-5: ${hslVar(chartPalette[4])};
}
`;

write(path.join(outDir, "css", "ppd-variables.css"), css);

const preset = `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ppd: {
          background: "${dark.background}",
          surface: "${dark.surface}",
          primary: "${dark.primary}",
          accent: "${dark.accent}",
          ink: "${dark.ink}",
        },
      },
      fontFamily: {
        condensed: ["${typography.families.condensed}", "sans-serif"],
        sans: ["${typography.families.body}", "sans-serif"],
      },
    },
  },
};
`;

write(path.join(outDir, "tailwind", "preset.cjs"), preset);

write(path.join(outDir, "brand.json"), JSON.stringify({
  _comment: "Generated from @ppd/tokens",
  name: tokens.brand.productName,
  colors: {
    primary: colorPrimitives.primary,
    accent: colorPrimitives.accent,
    backgroundDark: dark.background,
    chartPalette: [...chartPaletteLight],
  },
  fonts: {
    heading: typography.families.body,
    display: typography.families.condensed,
  },
}, null, 2));

const py = `"""Generated from @ppd/tokens."""
BG_COLOR = "${dark.background}"
INK = "${dark.ink}"
COURT_CLAY = "${sportColors.surface.clay}"
PLAYER_HOST = "${sportColors.playerHost}"
PLAYER_GUEST = "${sportColors.playerGuest}"
DIV_LOW = "${sportColors.diverging.low}"
DIV_PEAK = "${sportColors.diverging.peak}"
`;

write(path.join(outDir, "python", "style_generated.py"), py);

write(path.join(outDir, "README.md"), `# Integration Artifacts

Generated from \`@ppd/tokens\`. See each file for install targets.

Regenerate: \`pnpm --filter @ppd/tokens build\`
`);

console.log(`\n✅ Integration artifacts written to ${outDir}\n`);
