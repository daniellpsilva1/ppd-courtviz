# courtviz

A professional tennis data visualization library for React.

Inspired by [The SprawlBall](https://www.basketballanalyticsbook.com/) and [Hoop Atlas](https://hoopatlas.com/) — bringing the same editorial-quality visual language to tennis.

## Features

- **Framework-agnostic core**: Court geometry, coordinate normalization, hexbin, stats, and multi-format frame layout
- **Unified PPD brand system**: `@ppd/tokens` design tokens with drop-in integration artifacts
- **Editorial storytelling**: `@ppd/brand` match story builder with Zod-validated payloads
- **React SVG components**: `<Court>`, composable `<CourtSurface>`, branded `<FigureFrame>`, layers, charts
- **Themes**: `ppd` (default dark), `ppdLight`, `broadcast`, legacy `sprawlball`
- **Dual-encoded hexbins**: Size = frequency, color = efficiency (win rate vs. corpus baseline)
- **KDE density contours**: `<DensityLayer>` with d3-contour for shot concentration heatmaps
- **Smart annotations**: `<CentroidAnnotation>` auto-places labels at polygon centroids using d3-polygon
- **Motion identity**: Named spring presets (snappy, smooth, bouncy, gentle) in `@ppd/tokens` for consistent animation
- **Kinetic numbers**: `<KineticNumber>` / `<KineticStat>` count-up animated statistics for video scenes
- **Branded stinger**: `<BrandedStinger>` intro/outro animation with logo and baseline-rule sweep
- **True point-winner attribution**: Shots↔points join replaces the old `is_terminal` approximation
- **Supabase integration**: Direct loading from SwingVision match data
- **Static + animated + interactive**: Single codebase powers editorial graphics, Remotion videos, and Vite demo components

## Packages

| Package | Description |
|---------|-------------|
| `@ppd/tokens` | Canonical PPD design tokens (colors, typography, social formats, motion, signature devices) |
| `@ppd/brand` | Editorial modes, theme adapters, match story builder |
| `@courtviz/core` | Court geometry, scales, stats, `resolveFrameLayout()` |
| `@courtviz/data` | Zod schemas, Supabase loader, shots↔points join |
| `@courtviz/themes` | Courtviz themes derived from `@ppd/tokens` |
| `@courtviz/react` | React SVG components (`Court`, `FigureFrame`, layers) |
| `@courtviz/render` | Server-side SVG/PNG export |

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

### Demo app

```bash
pnpm --filter demo dev
```

Routes: `/brand`, `/benchmark/story`, `/benchmark/app`, plus viz pages (`/hexmap`, `/momentum`, etc.).

### Gallery (Ladle)

```bash
pnpm --filter @courtviz/gallery dev
```

### Usage

```tsx
import { Court, FigureFrame, BrandMark } from "@courtviz/react";
import { ppd } from "@courtviz/themes";
import { resolveFrameLayout } from "@courtviz/core";
import { buildBoludaStory, toCourtvizTheme } from "@ppd/brand";

const story = buildBoludaStory();
const editorial = toCourtvizTheme("editorial");

<Court surface="clay" theme={ppd} width={1080} height={1080} />
```

## Export pipelines

| Command | Output |
|---------|--------|
| `pnpm export` / `pnpm export:deck` | Vertical post deck — 13 slides, 9:16 (`exports/deck/`) |
| `pnpm export:posters` | Optional standalone posters × 4 formats (not part of default export) |
| `pnpm export:captions` | Platform captions + hashtags (`exports/captions/`) |
| `pnpm export:all` | Deck + captions + video (add `--force-video` to re-render) |

Default deliverables: `apps/demo/public/exports/video/` (2 mp4s), `apps/demo/public/exports/deck/` (13 vertical slides + `manifest.json`), and `apps/demo/public/exports/captions/`.

Preview everything locally with `open apps/demo/public/exports/gallery.html` after running `pnpm export`.
Optional posters land in `apps/demo/public/exports/{square,portrait,story,landscape}/` only when you run `pnpm export:posters`.

Pass `--matchId=<uuid>` or `--cache=path/to/match.json` to export a specific match (requires Supabase env for matchId).

## Video (Remotion)

```bash
pnpm video:prepare
pnpm video:render:social
pnpm --filter @courtviz/video render
pnpm --filter @courtviz/video render:benchmark
```

Compositions: `MatchRecap` (landscape broadcast), `MatchRecapSocial` (9:16), `BenchmarkStorySocial`.

`MatchRecapSocial` scenes: title → heatmaps → trajectories → shot patterns → key stats → coach insights → momentum (short) → outro.

### Motion tokens

All spring animations use named presets from `@ppd/tokens`:

```ts
import { motionTokens } from "@ppd/tokens";

spring({ config: motionTokens.springs.snappy, fps, frame });
```

Presets: `snappy` (damping 200), `smooth` (damping 28, stiffness 200), `bouncy` (damping 14, stiffness 120), `gentle` (damping 18, stiffness 80).

### Visual regression

```bash
pnpm --filter @courtviz/gallery test:visual
```

Playwright snapshots are stored in `apps/gallery/visual-snapshots/`. Run `test:visual:update` to regenerate.

## Architecture

```
@ppd/tokens (single source of truth)
  ├── @courtviz/themes (ppd, ppdLight, broadcast, sprawlball)
  ├── @courtviz/core (resolveFrameLayout for 4 social formats)
  ├── @courtviz/react (BrandMark + branded FigureFrame)
  ├── @ppd/brand (editorial modes + match story builder)
  └── integration/ (CSS, Tailwind preset, brand.json, Python constants)
```

See [MERGE.md](./MERGE.md) for migration notes from the Fable/GPT benchmark forks.

Brand spec: [packages/tokens/BRAND.md](./packages/tokens/BRAND.md)

## License

MIT
