import {
  createSeekableTimeline,
  type SeekableTimeline,
} from "./seekable-timeline";

export interface DominanceCameraState {
  position: [number, number, number];
  fov: number;
  hexOpacity: number;
}

export interface BuildDominanceTimelineOptions {
  fps?: number;
  durationSec?: number;
}

/**
 * Camera ease overhead → 3/4 for Court Dominance cinematic export.
 */
export function buildCourtDominanceTimeline(
  options: BuildDominanceTimelineOptions = {},
): SeekableTimeline & {
  getCameraState(): DominanceCameraState;
} {
  const fps = options.fps ?? 30;
  const durationSec = options.durationSec ?? 10;
  const state = {
    px: 0,
    py: 22,
    pz: 2,
    fov: 38,
    hexOpacity: 0,
  };

  const seekable = createSeekableTimeline({ fps, durationSec });
  seekable.timeline.to(state, {
    duration: durationSec * 0.65,
    px: 0,
    py: 12,
    pz: 10,
    fov: 42,
    hexOpacity: 1,
  });

  return {
    ...seekable,
    getCameraState(): DominanceCameraState {
      return {
        position: [state.px, state.py, state.pz],
        fov: state.fov,
        hexOpacity: state.hexOpacity,
      };
    },
  };
}
