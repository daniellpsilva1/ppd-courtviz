import { linearTiming } from "@remotion/transitions";

export const BENCHMARK_FPS = 30;
export const BENCHMARK_WIDTH = 1080;
export const BENCHMARK_HEIGHT = 1920;

export const BENCHMARK_TRANSITION = linearTiming({ durationInFrames: 15 });

export const BENCHMARK_DURATIONS = {
  hook: 4 * BENCHMARK_FPS,
  hexbin: 8 * BENCHMARK_FPS,
  insight: 5 * BENCHMARK_FPS,
  outro: 3 * BENCHMARK_FPS,
} as const;

const transitionFrames = BENCHMARK_TRANSITION.getDurationInFrames({ fps: BENCHMARK_FPS });

export const BENCHMARK_TOTAL_DURATION =
  BENCHMARK_DURATIONS.hook +
  BENCHMARK_DURATIONS.hexbin +
  BENCHMARK_DURATIONS.insight +
  BENCHMARK_DURATIONS.outro -
  3 * transitionFrames;
