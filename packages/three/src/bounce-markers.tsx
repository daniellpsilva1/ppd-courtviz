"use client";

import type { EnrichedShot } from "@courtviz/core";
import { normalizeShot } from "@courtviz/core";
import type { CourtvizTheme } from "@courtviz/themes";
import { courtToThree } from "./court-to-three";
import { playerMarkerColor } from "./surface-materials";

export interface BounceMarkersProps {
  shots: EnrichedShot[];
  player?: string;
  theme: CourtvizTheme;
  useHalfCourtNormalization?: boolean;
  radius?: number;
  maxMarkers?: number;
}

export function BounceMarkers({
  shots,
  player,
  theme,
  useHalfCourtNormalization = true,
  radius = 0.12,
  maxMarkers = 400,
}: BounceMarkersProps) {
  const filtered = shots
    .filter((s) => (player ? s.player === player : true))
    .filter((s) => s.bounceX != null && s.bounceY != null)
    .slice(0, maxMarkers);

  return (
    <group>
      {filtered.map((shot, i) => {
        const hitY = shot.hitY ?? 0;
        const [bx, by] = useHalfCourtNormalization
          ? normalizeShot(shot.bounceX!, shot.bounceY!, hitY)
          : [shot.bounceX!, shot.bounceY!];
        const [x, y, z] = courtToThree(bx, by);
        const color = playerMarkerColor(shot.player, theme);
        return (
          <mesh key={i} position={[x, y, z]}>
            <cylinderGeometry args={[radius, radius, 0.04, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}
