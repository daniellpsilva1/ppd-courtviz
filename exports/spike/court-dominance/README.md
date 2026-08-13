# Court Dominance spike exports

Generated for local testing of the interactive-first viz engine.

| File | Description |
|------|-------------|
| `court-dominance-9x16.mp4` | 9:16 cinematic Three.js stage (seekable GSAP camera, no Remotion) |
| `court-dominance-interactive-1080x1920.png` | 2D hexbin + coach takeaway (same tokens as product) |
| `manifest.json` | Export metadata (fps, dimensions, seek hook) |
| `frames/` | PNG sequence used for MP4 |

## Interactive preview (gallery)

```bash
cd PeakPerformanceDataMarketing/courtviz
pnpm --filter @courtviz/gallery dev
```

Stories:
- **Spike — Court Dominance (interactive)** — host/guest toggle, HexbinLayer
- **Spike — Court Dominance (Three stage)** — orbit 3D court
- **Spike — Court Dominance (video export 9:16)** — used for MP4 capture

## Re-export

```bash
pnpm spike:export:bundle        # full 10s @ 30fps
pnpm spike:export:bundle -- --quick   # 3s preview
```
