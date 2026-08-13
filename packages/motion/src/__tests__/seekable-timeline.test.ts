import { describe, expect, it } from "vitest";
import { buildCourtDominanceTimeline } from "../dominance-timeline";
import { createSeekableTimeline, timeToFrame } from "../seekable-timeline";

describe("seekable timeline", () => {
  it("seeks by frame index", () => {
    const tl = createSeekableTimeline({ fps: 30, durationSec: 2 });
    tl.timeline.to({ x: 0 }, { duration: 2, x: 1 });
    tl.seekToFrame(30);
    expect(tl.timeline.time()).toBeCloseTo(1);
    expect(timeToFrame(1, 30)).toBe(30);
  });

  it("animates dominance camera state", () => {
    const tl = buildCourtDominanceTimeline({ fps: 30, durationSec: 10 });
    tl.seekToFrame(tl.totalFrames() - 1);
    const cam = tl.getCameraState();
    expect(cam.position[1]).toBeLessThan(22);
    expect(cam.hexOpacity).toBeGreaterThan(0.9);
  });
});
