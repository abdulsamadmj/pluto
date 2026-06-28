import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Preload, useGLTF, useTexture } from "@react-three/drei";
import { type MotionValue } from "framer-motion";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { PhoneChoreography } from "./usePhoneChoreography";

const MODEL_URL = "/models/iphone.glb";
useGLTF.preload(MODEL_URL);

const CASE_COLOR = "#e879b9"; // Pluto magenta
const TARGET_HEIGHT = 4.3; // world units the phone should occupy

// Portrait screens shown per scroll chapter, then the landscape app screen.
const SCREEN_URLS = [
  "/screens/01-catalog.png",
  "/screens/02-alerts.png",
  "/screens/03-timeline.png",
  "/screens/app-landscape.png",
];

function PhoneModel({
  choreo,
  progress,
}: {
  choreo: PhoneChoreography;
  progress: MotionValue<number>;
}) {
  const outer = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const { scene } = useGLTF(MODEL_URL);
  const textures = useTexture(SCREEN_URLS);

  // Clone, center, scale, and tint the metallic frame to the brand color.
  const { node, screen } = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        // Tint the solid metallic frame/back (no texture) → magenta "case".
        if (mat && "metalness" in mat && mat.metalness > 0.2 && !mat.map) {
          mat.color = new THREE.Color(CASE_COLOR);
        }
      });
    });

    const box = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = TARGET_HEIGHT / size.y;
    // Center at origin, then scale about origin (center stays centered).
    s.position.sub(center);
    s.scale.setScalar(scale);

    // Screen overlay sized/placed against the front face (in world units).
    const screen = {
      w: size.x * scale * 0.9,
      h: size.y * scale * 0.94,
      z: (size.z * scale) / 2 + 0.02,
    };
    return { node: s, screen };
  }, [scene]);

  textures.forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  useLayoutEffect(() => {
    if (screenMat.current) screenMat.current.map = textures[0];
  }, [textures]);

  useFrame(({ clock }) => {
    const g = outer.current;
    if (!g) return;
    g.position.x = choreo.x.get();
    g.position.y = choreo.y.get() + Math.sin(clock.elapsedTime) * 0.04;
    g.rotation.y = choreo.rotY.get();
    g.rotation.z = choreo.rotZ.get();
    const sc = choreo.scale.get();
    g.scale.set(sc, sc, sc);

    // Swap screen texture by scroll chapter (last = landscape app screen).
    const p = progress.get();
    const idx = p < 0.24 ? 0 : p < 0.4 ? 1 : p < 0.52 ? 2 : 3;
    if (screenMat.current && screenMat.current.map !== textures[idx]) {
      screenMat.current.map = textures[idx];
      screenMat.current.needsUpdate = true;
    }
  });

  return (
    <group ref={outer}>
      <primitive object={node} />
      {/* Overlay screen — child of the same group so it rotates to landscape too */}
      <mesh ref={screenRef} position={[0, 0, screen.z]}>
        <planeGeometry args={[screen.w, screen.h]} />
        <meshBasicMaterial ref={screenMat} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Phone3D({
  choreo,
  progress,
}: {
  choreo: PhoneChoreography;
  progress: MotionValue<number>;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 10], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight color="#ec4899" position={[-4, -2, -3]} intensity={3} />
      <PhoneModel choreo={choreo} progress={progress} />
      <Preload all />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
