import { linearTiming, springTiming } from "@remotion/transitions";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_SCENES = 10;

export const SCENE_DURATIONS = {
  title: 4 * FPS,
  shotRain: 8 * FPS,
  hexbinReveal: 8 * FPS,
  shotTrajectories: 9 * FPS,
  servePlacement: 8 * FPS,
  shotPatterns: 7 * FPS,
  coachInsights: 6 * FPS,
  momentum: 4 * FPS,
  statsSpotlight: 7 * FPS,
  outro: 4 * FPS,
} as const;

export const FADE_TRANSITION = linearTiming({ durationInFrames: 18 });
export const SPRING_TRANSITION = springTiming({
  config: { damping: 200 },
  durationInFrames: 22,
});

export const TOTAL_DURATION =
  SCENE_DURATIONS.title +
  SCENE_DURATIONS.shotRain +
  SCENE_DURATIONS.hexbinReveal +
  SCENE_DURATIONS.shotTrajectories +
  SCENE_DURATIONS.servePlacement +
  SCENE_DURATIONS.shotPatterns +
  SCENE_DURATIONS.coachInsights +
  SCENE_DURATIONS.momentum +
  SCENE_DURATIONS.statsSpotlight +
  SCENE_DURATIONS.outro -
  9 * FADE_TRANSITION.getDurationInFrames({ fps: FPS });
