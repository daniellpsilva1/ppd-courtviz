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
- **True point-winner attribution**: Shots↔points join replaces the old `is_terminal` approximation
- **Supabase integration**: Direct loading from SwingVision match data
- **Static + animated + interactive**: Single codebase powers editorial graphics, Remotion videos, and Next.js components

## Packages

| Package | Description |
|---------|-------------|
| `@ppd/tokens` | Canonical PPD design tokens (colors, typography, social formats) |
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
| `pnpm export` / `pnpm export:deck` | Coach deck in portrait + story (`exports/deck/`) |
| `pnpm export:posters` | Optional standalone posters × 4 formats |
| `pnpm export:captions` | Platform captions + hashtags (`exports/captions/`) |
| `pnpm export:all` | Deck + posters + captions + video |

Coach deck lands in `apps/demo/public/exports/deck/{portrait,story}/` with `manifest.json`.
Optional posters land in `apps/demo/public/exports/{square,portrait,story,landscape}/`.

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
