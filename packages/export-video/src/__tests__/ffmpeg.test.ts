import { describe, expect, it } from "vitest";
import { runSeekExport } from "../ffmpeg";

describe("runSeekExport", () => {
  it("invokes onFrame for each frame", async () => {
    const frames: number[] = [];
    await runSeekExport({
      fps: 30,
      totalFrames: 5,
      onFrame: (f) => {
        frames.push(f);
      },
    });
    expect(frames).toEqual([0, 1, 2, 3, 4]);
  });
});
