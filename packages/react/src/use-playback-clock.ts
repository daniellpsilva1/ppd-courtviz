"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildMatchPlayback,
  createPlaybackClock,
  type EnrichedShot,
  type MatchPlayback,
  type PlaybackClockState,
  type PlaybackTimingConfig,
} from "@courtviz/core";

export interface UsePlaybackClockOptions {
  shots: EnrichedShot[];
  timing?: PlaybackTimingConfig;
  /** Autoplay on mount */
  autoPlay?: boolean;
}

export interface UsePlaybackClockResult {
  playback: MatchPlayback;
  state: PlaybackClockState;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (sec: number) => void;
  stepShot: (delta: 1 | -1) => void;
  stepPoint: (delta: 1 | -1) => void;
  isPlaying: boolean;
}

/**
 * React binding for the framework-agnostic PlaybackClock.
 * Uses rAF while playing; seeks are synchronous.
 */
export function usePlaybackClock(
  options: UsePlaybackClockOptions,
): UsePlaybackClockResult {
  const playback = useMemo(
    () => buildMatchPlayback(options.shots, options.timing),
    [options.shots, options.timing],
  );

  const clockRef = useRef(createPlaybackClock(playback));
  const playbackKey = `${playback.totalFrames}-${playback.episodes.length}-${playback.totalDurationSec}`;
  const [state, setState] = useState<PlaybackClockState>(() =>
    clockRef.current.getState(),
  );
  const [isPlaying, setIsPlaying] = useState(Boolean(options.autoPlay));

  useEffect(() => {
    clockRef.current = createPlaybackClock(playback);
    if (options.autoPlay) clockRef.current.play();
    setState(clockRef.current.getState());
    setIsPlaying(clockRef.current.isPlaying());
  }, [playback, playbackKey, options.autoPlay]);

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = clockRef.current.tick(dt);
      setState(next);
      setIsPlaying(clockRef.current.isPlaying());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const play = useCallback(() => {
    clockRef.current.play();
    setIsPlaying(true);
    setState(clockRef.current.getState());
  }, []);

  const pause = useCallback(() => {
    clockRef.current.pause();
    setIsPlaying(false);
    setState(clockRef.current.getState());
  }, []);

  const toggle = useCallback(() => {
    clockRef.current.toggle();
    setIsPlaying(clockRef.current.isPlaying());
    setState(clockRef.current.getState());
  }, []);

  const seek = useCallback((sec: number) => {
    clockRef.current.seek(sec);
    setState(clockRef.current.getState());
  }, []);

  const stepShot = useCallback((delta: 1 | -1) => {
    clockRef.current.stepShot(delta);
    setState(clockRef.current.getState());
  }, []);

  const stepPoint = useCallback((delta: 1 | -1) => {
    clockRef.current.stepPoint(delta);
    setState(clockRef.current.getState());
  }, []);

  return {
    playback,
    state,
    play,
    pause,
    toggle,
    seek,
    stepShot,
    stepPoint,
    isPlaying,
  };
}
