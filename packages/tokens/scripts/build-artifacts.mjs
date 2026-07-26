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

function rgbStr(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
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
  --radius: 0.5rem;
  --primary-rgb: ${rgbStr(colorPrimitives.primary)};
  --background: ${hslVar(light.background)};
  --foreground: ${hslVar(light.ink)};
  --card: ${hslVar(light.surface)};
  --card-foreground: ${hslVar(light.ink)};
  --popover: ${hslVar(light.surface)};
  --popover-foreground: ${hslVar(light.ink)};
  --surface: ${hslVar(light.surface)};
  --surface-raised: ${hslVar(light.surfaceRaised)};
  --primary: ${hslVar(light.primary)};
  --primary-foreground: 0 0% 100%;
  --secondary: ${hslVar(light.surfaceRaised)};
  --secondary-foreground: ${hslVar(light.ink)};
  --muted: ${hslVar(light.surfaceRaised)};
  --muted-foreground: ${hslVar(light.inkMuted)};
  --accent: ${hslVar(light.accent)};
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --success: ${hslVar(light.positive)};
  --success-foreground: 0 0% 100%;
  --warning: ${hslVar(light.warning)};
  --warning-foreground: 0 0% 100%;
  --border: ${hslVar(light.border)};
  --input: ${hslVar(light.border)};
  --ring: ${hslVar(light.primary)};
  --elevation: 0 0% 0%;
  --chart-1: ${hslVar(chartPaletteLight[0])};
  --chart-2: ${hslVar(chartPaletteLight[1])};
  --chart-3: ${hslVar(chartPaletteLight[2])};
  --chart-4: ${hslVar(chartPaletteLight[3])};
  --chart-5: ${hslVar(chartPaletteLight[4])};
  --chart-6: ${hslVar(chartPaletteLight[5])};
}

.dark {
  --primary-rgb: ${rgbStr(colorPrimitives.primary)};
  --background: ${hslVar(dark.background)};
  --foreground: ${hslVar(dark.ink)};
  --card: ${hslVar(dark.surface)};
  --card-foreground: ${hslVar(dark.ink)};
  --popover: ${hslVar(dark.surface)};
  --popover-foreground: ${hslVar(dark.ink)};
  --surface: ${hslVar(dark.surface)};
  --surface-raised: ${hslVar(dark.surfaceRaised)};
  --primary: ${hslVar(dark.primary)};
  --primary-foreground: 0 0% 100%;
  --secondary: ${hslVar(dark.surfaceRaised)};
  --secondary-foreground: ${hslVar(dark.ink)};
  --muted: ${hslVar(dark.surfaceRaised)};
  --muted-foreground: ${hslVar(dark.inkMuted)};
  --accent: ${hslVar(dark.accent)};
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --success: ${hslVar(dark.positive)};
  --success-foreground: 0 0% 100%;
  --warning: ${hslVar(dark.warning)};
  --warning-foreground: 0 0% 100%;
  --border: ${hslVar(dark.border)};
  --input: ${hslVar(dark.border)};
  --ring: ${hslVar(dark.primary)};
  --elevation: 0 0% 0%;
  --chart-1: ${hslVar(chartPalette[0])};
  --chart-2: ${hslVar(chartPalette[1])};
  --chart-3: ${hslVar(chartPalette[2])};
  --chart-4: ${hslVar(chartPalette[3])};
  --chart-5: ${hslVar(chartPalette[4])};
  --chart-6: ${hslVar(chartPalette[5])};
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
  _comment: "Generated from @ppd/tokens — do not edit by hand",
  _generatedFrom: "@ppd/tokens",
  name: tokens.brand.productName,
  tagline: tokens.brand.tagline,
  website: tokens.brand.website,
  colors: {
    primary: colorPrimitives.primary,
    primaryBright: colorPrimitives.primaryBright,
    primaryDark: colorPrimitives.primaryDark,
    marketing: colorPrimitives.marketing,
    accent: colorPrimitives.accent,
    accentDark: colorPrimitives.accentDark,
    backgroundDark: dark.background,
    backgroundLight: light.background,
    chartPalette: [...chartPaletteLight],
    chartPaletteDark: [...chartPalette],
  },
  fonts: {
    heading: typography.families.body,
    body: typography.families.body,
    display: typography.families.condensed,
  },
}, null, 2));

const py = `"""Generated from @ppd/tokens — do not edit by hand."""
BG_COLOR = "${dark.background}"
INK = "${dark.ink}"
INK_MUTED = "${dark.inkMuted}"
PRIMARY = "${colorPrimitives.primary}"
PRIMARY_BRIGHT = "${colorPrimitives.primaryBright}"
ACCENT = "${colorPrimitives.accent}"
COURT_CLAY = "${sportColors.surface.clay}"
PLAYER_HOST = "${sportColors.playerHost}"
PLAYER_GUEST = "${sportColors.playerGuest}"
DIV_LOW = "${sportColors.diverging.low}"
DIV_PEAK = "${sportColors.diverging.peak}"
DISPLAY_FONT = "${typography.families.condensed}"
BODY_FONT = "${typography.families.body}"
`;

write(path.join(outDir, "python", "style_generated.py"), py);

write(path.join(outDir, "README.md"), `# Integration Artifacts

Generated from \`@ppd/tokens\`. See each file for install targets.

Regenerate: \`pnpm --filter @ppd/tokens build\`
`);

console.log(`\n✅ Integration artifacts written to ${outDir}\n`);
