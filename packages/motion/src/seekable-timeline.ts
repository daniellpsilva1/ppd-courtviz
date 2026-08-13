import gsap from "gsap";

export interface SeekableTimeline {
  timeline: gsap.core.Timeline;
  fps: number;
  durationSec: number;
  seekToFrame(frame: number): void;
  seekToTime(seconds: number): void;
  totalFrames(): number;
}

export interface CreateSeekableTimelineOptions {
  fps?: number;
  durationSec?: number;
}

/**
 * Paused GSAP timeline for deterministic frame seeking during video export.
 */
export function createSeekableTimeline(
  options: CreateSeekableTimelineOptions = {},
): SeekableTimeline {
  const fps = options.fps ?? 30;
  const durationSec = options.durationSec ?? 10;
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.inOut" },
  });

  return {
    timeline,
    fps,
    durationSec,
    seekToFrame(frame: number) {
      const clamped = Math.max(0, Math.min(frame, Math.ceil(durationSec * fps)));
      timeline.time(clamped / fps);
    },
    seekToTime(seconds: number) {
      timeline.time(Math.max(0, Math.min(seconds, durationSec)));
    },
    totalFrames() {
      return Math.ceil(durationSec * fps);
    },
  };
}

export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

export function timeToFrame(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}
