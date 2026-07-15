# Courtviz Deep Review

In-depth review of the courtviz library: architecture, visual quality, brand distinctiveness, and technology recommendations (Three.js, D3, Remotion) — benchmarked against The Analyst (theanalyst.com) and The Athletic.

Reviewed: July 2026 · All 108+ tests passing across 6 packages at time of review.

---

## Scorecard

| Area | Score | Verdict |
|------|-------|---------|
| Architecture & package design | 9/10 | Excellent — token-driven, clean layering, framework-agnostic core |
| Data pipeline & correctness | 8.5/10 | Strong — Zod validation, true shots↔points join, good test coverage |
| React component library | 8/10 | Solid — 18 components, memoized, tested; minor issues |
| Brand system | 7/10 | Good foundation, but not yet *distinctive* |
| Video / motion design | 6.5/10 | Technically sound, creatively conventional |
| Interactive experience | 5/10 | Demo is functional but far from The Analyst's interactivity |
| Quality gates (CI, visual regression) | 4/10 | Unit tests only — no CI config, no visual regression |
| **Overall** | **7.5/10** | Strong engineering, brand craft is the gap |

---

## 1. What's genuinely great

- **Single source of truth actually works.** `@ppd/tokens` → `@ppd/brand` adapters → `@courtviz/themes` → components → Remotion → export pipeline. Very few teams get this right. The `toCourtvizTheme()` adapter pattern (`packages/brand/src/adapters/courtviz-theme.ts`) means one palette change propagates to every video, poster, and web page.
- **The data layer is honest.** The shots↔points join in `packages/data/src/enrich.ts` replaced the `is_terminal` approximation with true point-winner attribution — including graceful fallbacks (derived rally lengths, null-safe joins). Zod schemas validate everything at the boundary.
- **D3 is already used where it matters.** Contrary to the "should we add D3?" question — `@courtviz/core` already uses `d3-scale` (scales.ts), `d3-hexbin` (hexbin.ts), and `d3-interpolate` (color ramps). The hexbin index-carrying fix (hexbin.ts:77–80) shows real care for correctness.
- **Dual-encoded hexbins** (size = frequency, color = win rate, shared efficiency domains for side-by-side comparability) are editorially sophisticated — this is SprawlBall-grade thinking.
- **The export pipeline is a real content factory.** Deck (13 slides), captions, posters, and two mp4s from one command, with caching and `--force-video`.
- **Test health**: 108+ passing tests across core, data, react, themes, brand, render. Component tests assert rendered SVG markup, stats tests cover momentum/serve/zone math edge cases.

---

## 2. Gap analysis vs. The Analyst / The Athletic

What makes those brands instantly recognizable, and where courtviz stands:

| Signature element | The Analyst / Athletic | Courtviz today |
|---|---|---|
| **Ownable color** | Opta's electric gradients; Athletic's cream + black | Navy + `#2563EB` blue — competent but generic "dashboard blue"; looks like Tailwind defaults |
| **Typography with a point of view** | Athletic's custom serif headlines; Analyst's heavy grotesk | Barlow Condensed + Inter — free Google fonts, widely used, low distinctiveness |
| **Signature graphic device** | Opta's radial gauges & win-probability strips; Athletic's rule lines + drop caps | Hexbins are close to a signature — but they're borrowed from basketball viz |
| **Motion identity** | Consistent branded stingers, kinetic numbers, one recognizable easing feel | Stock Remotion fade/slide/wipe transitions (`match-recap.tsx`) — no ownable motion language |
| **Editorial voice** | Headline-first, one insight per graphic | `buildMatchStory()` already generates standfirst/insight/coach-interpretation — this is a genuine strength; the *rendering* undersells it |

**Key insight: the pipeline is better than the paint.** The system architecture rivals professional shops; the visual output is one tier below because color, type, and motion choices are safe defaults.

---

## 3. Technology verdicts

### Remotion — KEEP. Do not switch.

- Remotion is the correct choice: same React components power video, web, and static export — that reuse is the whole strategic advantage of this codebase. Motion Canvas, After Effects, or Lottie would fork the codebase into a second visual language.
- The problem is not the tool, it's the craft. `MatchRecap` uses off-the-shelf `fade()`/`slide()`/`wipe()` transitions and uniform spring configs (`damping: 28, stiffness: 200` and `damping: 200` everywhere). Nothing about the motion says "PPD".
- Already present but underused: `film-grain.tsx`, `vignette.tsx`, `set-flash.tsx`, `sfx-cues.tsx`, audio bed — the ingredients for a signature look exist.

### D3 — Already adopted where it counts. Expand selectively.

- Keep the current pattern: **D3 for math, React for rendering**. Do not adopt D3's DOM manipulation (`select`/`enter`/`exit`) — it fights React and Remotion.
- Worth adding:
  - `d3-shape` — replace hand-built path strings in `momentum-chart.tsx` (lines 75–105) with `area()`/`line()` + `curveMonotoneX` for smoother editorial curves.
  - `d3-contour` — smooth density fields as an alternative/companion to hexbins (The Analyst uses smoothed heat surfaces heavily).
  - `d3-force` — collision-free smart label placement for annotations.
  - `d3-scale-chromatic` only as reference; keep custom PPD ramps for brand ownership.

### Three.js — YES, but narrowly: hero moments only.

- Do **not** rewrite the 2D system. SVG is the right substrate for editorial graphics, print-quality export, and accessibility.
- Add a new `@courtviz/three` package (React Three Fiber) for three specific hero visuals:
  1. **3D court flyover intro** — camera sweep over a lit court for video titles; instantly differentiates from every flat tennis graphic on social.
  2. **Ball trajectory arcs** — `hitX/hitY/hitZ → bounceX/bounceY` data already exists in the schema; true 3D parabolic arcs with motion trails are something SwingVision data can support that competitors can't show.
  3. **Shot-rain particles** — upgrade `shot-rain.tsx` to instanced-mesh particles with depth-of-field.
- Integration is proven: `@remotion/three` renders R3F inside Remotion compositions; the same scenes embed in the Vite demo app.
- Risk control: keep it isolated in one package, hero scenes only, always with a 2D fallback.

---

## 4. Detailed findings

### Architecture (9/10)
- Clean dependency DAG: tokens → themes/brand → core → react → apps. No circular deps observed.
- `integration/` artifacts (CSS vars, Tailwind preset, brand.json, Python constants) extend the token system beyond JS — unusually thorough.
- Minor: README calls the demo "Next.js components" but `apps/demo` is a Vite SPA (`vite.config.ts`). Update docs or migrate — a Next.js demo would help SEO/shareability of interactive pieces.

### Core & data (8.5/10)
- `createCourtScales` maintains equal aspect ratio and exposes inverse scales — good for future interactivity (pointer → court meters).
- Hexbin min-count filtering happens after max-count computation — correct ordering.
- Gaps: no property-based tests for `normalizeShot` symmetry; `loader.ts` casts Supabase rows with `as` instead of running Zod parse on fetch (validation exists but verify it's applied on the load path); no data-quality report (e.g., % shots missing bounce coords) surfaced to users.

### React components (8/10)
- 18 components, all `memo`ized, `useMemo` on hot paths, tooltip context avoids provider duplication.
- Issues found:
  - `hexbin-layer.tsx:177` — `r > r * 0.5` is always true for positive r; dead condition, label size gate does nothing.
  - `court.tsx:113–116` — `Math.random()` clip-path ID breaks SSR hydration determinism; use `useId()`.
  - Test warnings: `<linearGradient>`/`<clipPath>`/`<feDropShadow>` casing warnings in legend and court-surface tests — harmless in browser SVG but noisy; likely a test-environment JSX config issue worth silencing properly.
  - Accessibility: no `<title>`/`role="img"`/`aria-label` on chart SVGs despite `accessibleSummary` existing in the story schema — wire it through.

### Video (6.5/10)
- Structure is good: scene components, shared shell (`broadcast-shell.tsx`), layout helpers, SCENE_DURATIONS constants, audio bed + SFX.
- Weaknesses:
  - Stock transitions = zero motion identity (see §3 Remotion).
  - Springs are per-element with hardcoded configs scattered across scenes; no central motion token system (note `@ppd/brand` has `motion.fastMs/normalMs/slowMs` tokens that the video app doesn't use).
  - Insight text appears as static callouts; The Analyst treats numbers as kinetic characters (count-ups, mask reveals, per-glyph staggers).
  - No branded intro/outro stinger — the most-replayed 1.5s of any social video.

### Apps & quality gates (5/10)
- Gallery (Ladle) covers 6 story files — good component development surface.
- No CI workflow files found in the repo. No visual regression testing — for a *visualization* library this is the single highest-leverage quality gap: a color regression would ship silently today.
- `turbo.json` warnings: `test` tasks declare no `outputs` — harmless but noisy.

---

## 5. Improvement roadmap

### Phase 1 — Brand distinctiveness (highest impact, no new tech)
1. **Ownable palette move**: introduce one signature accent that isn't "SaaS blue" (e.g., electric chartreuse or hot coral against the navy) and a signature gradient; encode in `@ppd/tokens` so it propagates everywhere.
2. **Typography upgrade**: replace Barlow Condensed with a licensed display face with real character (or a modified/variable font treatment); keep Inter for body.
3. **Signature graphic device**: define 1–2 ownable devices (e.g., a "baseline rule" motif echoing court lines, corner-notch frames) applied consistently in `FigureFrame`, `BroadcastShell`, and export templates.
4. **Fix quick wins**: `useId()` clip paths, dead label condition, SVG a11y attributes, README demo-framework correction.

### Phase 2 — Motion identity (Remotion craft)
1. Central motion tokens: 2–3 named easing curves + duration scale in `@ppd/tokens`; consume everywhere (replace scattered spring configs).
2. Custom branded transitions (court-line wipe, hexagon mask reveal) replacing stock fade/slide/wipe.
3. Kinetic numbers: count-up + mask-reveal stat components; per-glyph stagger for headlines.
4. Branded 1.5s intro/outro stinger used across all compositions.

### Phase 3 — D3 expansion (math only)
1. `d3-shape` curves in `MomentumChart` (monotone areas/lines).
2. `d3-contour` density layer as new `<DensityContourLayer>` companion to hexbins.
3. `d3-force`-based smart annotation placement.

### Phase 4 — Three.js hero visuals
1. New `@courtviz/three` package (R3F + drei + `@remotion/three`).
2. 3D court model + camera flyover title scene.
3. Ball trajectory arcs from hit/bounce coords with trails.
4. Instanced shot-rain particle upgrade.
5. Embed one interactive 3D piece in the demo app.

### Phase 5 — Quality gates
1. CI workflow: build + typecheck + test on PR.
2. Visual regression: Playwright screenshot tests against gallery stories + Remotion still frames (`remotion still`) — protect the brand programmatically.
3. Apply Zod parsing on the Supabase load path; add a data-quality summary to the loader.
4. Fix `turbo.json` test task outputs.

---

## 6. Bottom line

- **Is it looking great?** The engineering is — architecture, data honesty, and the token system are genuinely strong. The visual output is good-but-generic; nothing yet forces recognition at thumbnail size.
- **Three.js?** Yes — narrowly, for hero moments (flyover, 3D trajectories), in an isolated package. Not a rewrite.
- **D3?** Already in use for the right things; expand math modules (`d3-shape`, `d3-contour`), never its DOM layer.
- **Remotion?** Keep it. It's the strategic backbone of the one-codebase-many-surfaces advantage. Invest in motion *craft*, not a tool change.
- **The single biggest lever** is Phase 1+2: an ownable palette/typeface and a branded motion language. Those two changes cascade through the token system to every deliverable automatically — that's the payoff of the architecture you already built.
