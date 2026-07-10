# Peak Performance Data — Brand System

Unified dark "data brand" identity for app, court graphics, social exports, and video.

## Identity

- **Canvas**: deep navy (`#0F172A`)
- **Primary**: electric blue (`#3B82F6` on dark, `#2563EB` on light)
- **Marketing**: landing blue (`#0047FF`)
- **Accent**: emerald (`#10B981`)
- **Display**: Barlow Condensed · **Body**: Inter

## Logo

- **Icon**: mountain peak + waveform in circle (inline SVG via `@ppd/tokens/logo`)
- **Lockup**: icon + "PEAK PERFORMANCE / DATA" wordmark

## Social formats

| Format | Size | Use |
|--------|------|-----|
| square | 1080×1080 | Feed posts |
| portrait | 1080×1350 | Instagram portrait |
| story | 1080×1920 | Stories, Reels, TikTok |
| landscape | 1920×1080 | X, YouTube thumbnails |

## Branding on exports

- BrandMark (PPD logo icon) bottom-left
- `@peakperformancedata` center-right
- Source line bottom-right

## Integration

Regenerate cross-project artifacts: `pnpm --filter @ppd/tokens build`

Outputs: `integration/css/ppd-variables.css`, `integration/tailwind/preset.cjs`, `integration/brand.json`, `integration/python/style_generated.py`
