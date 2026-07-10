# Merge Notes — Fable + GPT → courtviz

This document describes the unified merge of benchmark candidates `courtviz-fable` and `courtviz-gpt` into canonical `courtviz`.

## What came from each fork

### From courtviz-fable

- `@ppd/tokens` package and `integration/` artifacts
- `resolveFrameLayout()` in `@courtviz/core`
- `BrandMark`, branded `FigureFrame` with multi-format layouts
- `ppd` default theme (with `ppdLight`, deprecated `ppdDark` alias, legacy `sprawlball`)
- `export:social` pipeline (7 posters × 4 formats × SVG+PNG)
- `/brand` demo route
- Tests: tokens, frame-layout, brand-mark, figure-frame

### From courtviz-gpt

- `@ppd/brand` package (refactored to depend on `@ppd/tokens`)
- Composable court: `CourtSurface`, `CourtScalesProvider`, `FigureDocument`, `ZoneBarChart`
- `/benchmark/story` and `/benchmark/app` demo routes
- `export:editorial` warm-paper narrative social cards
- `BenchmarkStorySocial` Remotion composition
- `buildBoludaStory()` with Zod-validated `BenchmarkStorySchema`

## Breaking API changes

| Area | Before | After |
|------|--------|-------|
| Default theme | `sprawlball` | `ppd` |
| `getTheme()` default | `"sprawlball"` | `"ppd"` |
| `FigureFrame` | Fixed 1080×1080, no branding | `format` prop + optional `branding` footer |
| `CourtvizTheme` | No `border` | Required `border`; optional `brand` |
| `ppdDark` | Standalone dark theme | Deprecated alias of `ppd` |

## Migration guide

### Theme usage

```tsx
// Before
import { sprawlball, ppdDark } from "@courtviz/themes";

// After (recommended)
import { ppd, ppdLight } from "@courtviz/themes";

// Legacy still available
import { sprawlball } from "@courtviz/themes";
```

### Branded social exports

```tsx
import { FigureFrame } from "@courtviz/react";
import { ppd } from "@courtviz/themes";

<FigureFrame
  format="story"
  theme={ppd}
  title="Shot Frequency & Efficiency"
  branding={{ handle: "@peakperformancedata", logo: true }}
>
  {/* court content */}
</FigureFrame>
```

### Editorial match stories

```tsx
import { buildBoludaStory, toCourtvizTheme } from "@ppd/brand";

const story = buildBoludaStory();
const editorialTheme = toCourtvizTheme("editorial");
// story.title, story.insight, story.frozenMetrics, etc.
```

### PPD app integration

Copy or import from `integration/`:

- `integration/css/ppd-variables.css` → Next.js globals
- `integration/tailwind/preset.cjs` → Tailwind config
- `integration/python/style_generated.py` → Python viz scripts

Regenerate: `pnpm --filter @ppd/tokens build`

## Verification commands

```bash
pnpm build
pnpm test
pnpm export:static
pnpm export:social
pnpm export:editorial
pnpm --filter demo dev
pnpm --filter @courtviz/video render:benchmark-smoke
```

## Deprecation

The isolated benchmark workspaces `courtviz-fable` and `courtviz-gpt` are superseded by this merge. Do not extend those forks; use canonical `courtviz` on branch `feat/merge-fable-gpt` (or `main` after promotion).
