"use client";

import type { ReactNode } from "react";
import type { Surface } from "@courtviz/core";
import type { CourtvizTheme } from "@courtviz/themes";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CourtMesh } from "./court-mesh";

export interface CourtStageProps {
  theme: CourtvizTheme;
  surface?: Surface;
  children?: ReactNode;
  /** Disable orbit for export / deterministic camera */
  enableOrbit?: boolean;
  /** When false, caller supplies camera via children */
  useDefaultCamera?: boolean;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  frameloop?: "always" | "demand" | "never";
  className?: string;
  style?: React.CSSProperties;
}

export function CourtStage({
  theme,
  surface = "hard",
  children,
  enableOrbit = true,
  useDefaultCamera = true,
  cameraPosition = [0, 14, 8],
  cameraFov = 42,
  frameloop = "always",
  className,
  style,
}: CourtStageProps) {
  return (
    <Canvas
      className={className}
      style={{ background: theme.background, ...style }}
      frameloop={frameloop}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <color attach="background" args={[theme.background]} />
      {useDefaultCamera ? (
        <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} />
      ) : null}
      <ambientLight intensity={0.55} />
      <directionalLight intensity={0.9} position={[6, 18, 4]} />
      <CourtMesh half="near" surface={surface} theme={theme} />
      {children}
      {enableOrbit ? <OrbitControls maxPolarAngle={Math.PI / 2.1} target={[0, 0, 6]} /> : null}
    </Canvas>
  );
}
