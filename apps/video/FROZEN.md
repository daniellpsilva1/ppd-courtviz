# @courtviz/video (Remotion) — archived for match data

**Do not add new match-analytics scenes here.** Legacy `MatchRecap` / social compositions remain for historical renders only.

## Replacement stack

| Need | Use |
|------|-----|
| Point-by-point 2D replay (browser) | `@courtviz/core` `PlaybackClock` + `@courtviz/react` `<PointReplayCourt>` |
| Social / match MP4 | `@courtviz/export-video` + SSR scenes (`pnpm replay:export`, `pnpm spike:export:bundle`) |
| Cinematic 3D chapters | `@courtviz/three` + `@courtviz/motion` seek hooks |
| Brand promo reels (non-match) | `PeakPerformanceDataMarketing/Remotion` |

Pacing for replay is **reconstructed** from distance/`speedKmh` when `videoTimeSec` is null — label exports accordingly.
