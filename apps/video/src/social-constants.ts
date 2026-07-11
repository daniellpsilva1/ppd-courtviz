import { linearTiming } from "@remotion/transitions";

export const SOCIAL_FPS = 30;
export const SOCIAL_WIDTH = 1080;
export const SOCIAL_HEIGHT = 1920;
export const SOCIAL_TRANSITION = linearTiming({ durationInFrames: 12 });

export const SOCIAL_DURATIONS = {
  title: 2 * SOCIAL_FPS,
  hexbin: Math.round(3.5 * SOCIAL_FPS),
  trajectories: Math.round(4 * SOCIAL_FPS),
  patterns: Math.round(3.5 * SOCIAL_FPS),
  stats: Math.round(3.5 * SOCIAL_FPS),
  breakpoints: Math.round(3 * SOCIAL_FPS),
  serveSpeed: Math.round(3 * SOCIAL_FPS),
  setBySet: Math.round(2.5 * SOCIAL_FPS),
  coach: Math.round(3.5 * SOCIAL_FPS),
  momentum: Math.round(3 * SOCIAL_FPS),
  outro: 2 * SOCIAL_FPS,
} as const;

const SOCIAL_TRANSITION_FRAMES = SOCIAL_TRANSITION.getDurationInFrames({ fps: SOCIAL_FPS });
const SOCIAL_SCENE_COUNT = 11;

export const SOCIAL_TOTAL_DURATION =
  SOCIAL_DURATIONS.title +
  SOCIAL_DURATIONS.hexbin +
  SOCIAL_DURATIONS.trajectories +
  SOCIAL_DURATIONS.patterns +
  SOCIAL_DURATIONS.stats +
  SOCIAL_DURATIONS.breakpoints +
  SOCIAL_DURATIONS.serveSpeed +
  SOCIAL_DURATIONS.setBySet +
  SOCIAL_DURATIONS.coach +
  SOCIAL_DURATIONS.momentum +
  SOCIAL_DURATIONS.outro -
  (SOCIAL_SCENE_COUNT - 1) * SOCIAL_TRANSITION_FRAMES;
