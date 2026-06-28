import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Preload,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import type { PhoneChoreography } from "./usePhoneChoreography";

function PhoneMesh({ choreo }: { choreo: PhoneChoreography }) {
  const group = useRef<THREE.Group>(null);
  const tex = useTexture("/app-screen.png");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    // Scroll-driven base transform + a gentle idle float to feel "alive".
    g.position.x = choreo.x.get();
    g.position.y = choreo.y.get() + Math.sin(clock.elapsedTime) * 0.04;
    g.rotation.y = choreo.rotY.get();
    g.rotation.z = choreo.rotZ.get();
    const s = choreo.scale.get();
    g.scale.set(s, s, s);
  });

  return (
    <group ref={group}>
      {/* Aluminium body */}
      <RoundedBox args={[2, 4, 0.22]} radius={0.18} smoothness={8}>
        <meshStandardMaterial color="#16161c" metalness={0.4} roughness={0.5} />
      </RoundedBox>
      {/* Screen (unlit so the screenshot keeps its true colors) */}
      <mesh position={[0, 0, 0.121]}>
        <planeGeometry args={[1.78, 3.78]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* Notch */}
      <mesh position={[0, 1.7, 0.13]}>
        <capsuleGeometry args={[0.05, 0.35, 4, 8]} />
        <meshStandardMaterial color="#050507" />
      </mesh>
    </group>
  );
}

export default function Phone3D({ choreo }: { choreo: PhoneChoreography }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 10], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <pointLight color="#ec4899" position={[-4, -2, -3]} intensity={3} />
      <Suspense fallback={null}>
        <PhoneMesh choreo={choreo} />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
