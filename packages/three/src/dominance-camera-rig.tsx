"use client";

import { useEffect, useMemo } from "react";
import { buildCourtDominanceTimeline } from "@courtviz/motion";
import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCamera as ThreePerspectiveCamera } from "three";

export interface DominanceCameraRigProps {
  frame?: number;
  fps?: number;
  durationSec?: number;
}

export function DominanceCameraRig({
  frame = 0,
  fps = 30,
  durationSec = 10,
}: DominanceCameraRigProps) {
  const timeline = useMemo(
    () => buildCourtDominanceTimeline({ fps, durationSec }),
    [fps, durationSec],
  );
  const { camera, invalidate } = useThree();

  useEffect(() => {
    timeline.seekToFrame(frame);
    const { position, fov } = timeline.getCameraState();
    camera.position.set(position[0], position[1], position[2]);
    const persp = camera as ThreePerspectiveCamera;
    persp.fov = fov;
    persp.updateProjectionMatrix();
    invalidate();
  }, [camera, frame, invalidate, timeline]);

  return <PerspectiveCamera makeDefault />;
}
