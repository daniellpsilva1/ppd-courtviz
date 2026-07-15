import { ThreeCanvas } from "@remotion/three";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PPD, theme } from "../ppd-tokens";

const COURT_W = 10.97;
const COURT_H = 23.77;
const NET_H = 0.914;

function CourtPlane() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[COURT_W, COURT_H]} />
      <meshStandardMaterial color={PPD.surface} metalness={0.1} roughness={0.8} />
    </mesh>
  );
}

function CourtLines() {
  const lineMat = <meshBasicMaterial color={PPD.border} />;
  const halfW = COURT_W / 2;
  const halfH = COURT_H / 2;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Outer boundary */}
      <mesh position={[0, 0, halfH]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[COURT_W, 0.05]} />
        {lineMat}
      </mesh>
      <mesh position={[0, 0, -halfH]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[COURT_W, 0.05]} />
        {lineMat}
      </mesh>
      <mesh position={[halfW, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, COURT_H]} />
        {lineMat}
      </mesh>
      <mesh position={[-halfW, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, COURT_H]} />
        {lineMat}
      </mesh>
      {/* Net */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[COURT_W, 0.05]} />
        <meshBasicMaterial color={theme.playerHost} />
      </mesh>
      {/* Service lines */}
      {[-5.485, 5.485].map((z) => (
        <mesh key={`service-${z}`} position={[0, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[COURT_W, 0.04]} />
          {lineMat}
        </mesh>
      ))}
      {/* Center service line */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 10.97]} />
        {lineMat}
      </mesh>
    </group>
  );
}

function Net() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[COURT_W / 2, NET_H / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, NET_H, 8]} />
        <meshStandardMaterial color={PPD.border} />
      </mesh>
      <mesh position={[-COURT_W / 2, NET_H / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, NET_H, 8]} />
        <meshStandardMaterial color={PPD.border} />
      </mesh>
      <mesh position={[0, NET_H, 0]}>
        <boxGeometry args={[COURT_W, 0.04, 0.04]} />
        <meshStandardMaterial color={PPD.border} />
      </mesh>
    </group>
  );
}

function TennisBall({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.33, 32, 32]} />
      <meshStandardMaterial color="#CCFF00" emissive="#88AA00" emissiveIntensity={0.15} roughness={0.6} />
    </mesh>
  );
}

export function CourtHero3D() {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  const cameraHeight = interpolate(frame, [0, 120], [14, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cameraDistance = interpolate(frame, [0, 120], [18, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ballY = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.33, 3],
  );
  const ballZ = interpolate(
    Math.cos(frame * 0.05),
    [-1, 1],
    [-8, 8],
  );
  const ballX = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    [-3, 3],
  );

  return (
    <ThreeCanvas
      camera={{
        fov: 50,
        position: [0, cameraHeight, cameraDistance],
      }}
      height={height}
      width={width}
    >
      <ambientLight intensity={0.5} />
      <directionalLight intensity={0.7} position={[5, 10, 5]} />
      <directionalLight intensity={0.3} position={[-5, 5, -5]} />

      <CourtPlane />
      <CourtLines />
      <Net />
      <TennisBall position={[ballX, ballY, ballZ]} />
    </ThreeCanvas>
  );
}
