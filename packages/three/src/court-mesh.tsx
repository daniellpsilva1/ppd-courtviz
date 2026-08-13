"use client";

import { useMemo } from "react";
import {
  COURT_LENGTH,
  DOUBLES_WIDTH,
  type CourtHalf,
  type Surface,
  courtLines,
} from "@courtviz/core";
import type { CourtvizTheme } from "@courtviz/themes";
import { Line } from "@react-three/drei";
import { courtCenterY, courtToThree } from "./court-to-three";
import { surfaceFillColor, surfaceLineColor } from "./surface-materials";

export interface CourtMeshProps {
  half?: CourtHalf;
  surface?: Surface;
  theme: CourtvizTheme;
  lineWidth?: number;
}

export function CourtMesh({
  half = "near",
  surface = "hard",
  theme,
  lineWidth = 1.5,
}: CourtMeshProps) {
  const fill = surfaceFillColor(surface, theme);
  const lineColor = surfaceLineColor(theme);
  const segments = useMemo(() => courtLines(half), [half]);
  const centerZ = courtCenterY(half);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, centerZ]}>
        <planeGeometry args={[DOUBLES_WIDTH, half === "full" ? COURT_LENGTH : COURT_LENGTH / 2]} />
        <meshStandardMaterial color={fill} roughness={0.85} metalness={0.05} />
      </mesh>
      {segments.map(([x1, y1, x2, y2], i) => {
        const [ax, , az] = courtToThree(x1, y1, 0.02);
        const [bx, , bz] = courtToThree(x2, y2, 0.02);
        return (
          <Line
            key={i}
            points={[
              [ax, 0.02, az],
              [bx, 0.02, bz],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
          />
        );
      })}
      <mesh position={[0, -0.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DOUBLES_WIDTH + 4, (half === "full" ? COURT_LENGTH : COURT_LENGTH / 2) + 4]} />
        <meshStandardMaterial color={theme.surroundColors[surface]} roughness={1} />
      </mesh>
    </group>
  );
}
