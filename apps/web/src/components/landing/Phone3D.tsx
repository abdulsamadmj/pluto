import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload, useGLTF, useTexture } from "@react-three/drei";
import { animate, type MotionValue, useMotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { PhoneChoreography } from "./usePhoneChoreography";

const MODEL_URL = "/models/iphone.glb";
useGLTF.preload(MODEL_URL);

const CASE_COLOR = "#e879b9"; // Pluto magenta
const TARGET_HEIGHT = 4.3; // world units the phone should occupy

// Even bezel around the screen, as a fraction of device width (world units).
const BEZEL_FRAC = 0.05;

/** Rounded-rectangle plane with UVs remapped to [0,1] for texturing. */
function roundedPlane(w: number, h: number, r: number): THREE.ShapeGeometry {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ShapeGeometry(s, 24);
  const pos = geo.attributes.position;
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    uv.push((pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

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
  reveal,
}: {
  choreo: PhoneChoreography;
  progress: MotionValue<number>;
  reveal: MotionValue<number>;
}) {
  const outer = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const islandMat = useRef<THREE.MeshBasicMaterial>(null);
  const { scene } = useGLTF(MODEL_URL);
  const textures = useTexture(SCREEN_URLS);

  // Clone, center, scale, and tint the metallic frame to the brand color.
  const { node, screen, frameMats } = useMemo(() => {
    // Collect every material so the fade can be driven on the GPU (material
    // opacity) instead of compositing the whole canvas layer via CSS opacity.
    const frameMats: THREE.Material[] = [];
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
        if (mat) {
          mat.transparent = true;
          mat.opacity = 0;
          frameMats.push(mat);
        }
      });
    });

    const box = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = TARGET_HEIGHT / size.y;

    // Center the geometry at the origin (scale 1), then put it in a wrapper that
    // scales and rotates 180° on Y so the SCREEN faces the camera (+z) instead
    // of the back. Wrapping keeps it centered regardless of rotation.
    s.position.sub(center);
    const wrap = new THREE.Group();
    wrap.add(s);
    wrap.scale.setScalar(scale);
    wrap.rotation.y = Math.PI;

    // Screen overlay against the front face (world units), inset by an EQUAL
    // bezel on all four sides so the gap is even in both orientations.
    const bezel = size.x * scale * BEZEL_FRAC;
    const w = size.x * scale - bezel * 2;
    const h = size.y * scale - bezel * 2;
    const z = (size.z * scale) / 2 + 0.015;
    const screenGeo = roundedPlane(w, h, Math.min(w, h) * 0.13);

    // Dynamic Island: a black pill near the top of the screen.
    const islandW = w * 0.3;
    const islandH = w * 0.075;
    const islandGeo = roundedPlane(islandW, islandH, islandH / 2);
    const islandY = h / 2 - islandH / 2 - h * 0.03;

    const screen = { w, h, z, screenGeo, islandGeo, islandY };
    return { node: wrap, screen, frameMats };
  }, [scene]);

  textures.forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  // Full list of materials whose opacity we fade each frame (model + overlays).
  const allMats = useRef<THREE.Material[]>([]);

  useLayoutEffect(() => {
    if (screenMat.current) screenMat.current.map = textures[0];
    const list: THREE.Material[] = [...frameMats];
    if (screenMat.current) {
      screenMat.current.transparent = true;
      screenMat.current.opacity = 0;
      list.push(screenMat.current);
    }
    if (islandMat.current) {
      islandMat.current.transparent = true;
      islandMat.current.opacity = 0;
      list.push(islandMat.current);
    }
    allMats.current = list;
  }, [textures, frameMats]);

  useFrame(() => {
    const g = outer.current;
    if (!g) return;
    g.position.x = choreo.x.get();
    g.position.y = choreo.y.get();
    g.rotation.y = choreo.rotY.get();
    g.rotation.z = choreo.rotZ.get();
    const sc = choreo.scale.get();
    g.scale.set(sc, sc, sc);

    // Initial reveal × scroll-driven fade — applied to material opacity so the
    // canvas itself never needs CSS layer compositing.
    const opacity = reveal.get() * choreo.opacity.get();
    const mats = allMats.current;
    for (let i = 0; i < mats.length; i++) mats[i].opacity = opacity;

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
      {/* Rounded screen overlay — child of the group so it rotates to landscape too */}
      <mesh ref={screenRef} geometry={screen.screenGeo} position={[0, 0, screen.z]}>
        <meshBasicMaterial ref={screenMat} toneMapped={false} />
      </mesh>
      {/* Dynamic Island */}
      <mesh
        geometry={screen.islandGeo}
        position={[0, screen.islandY, screen.z + 0.004]}
      >
        <meshBasicMaterial ref={islandMat} color="#000000" toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * On-demand rendering driver: requests a single frame whenever any animated
 * value changes (scroll choreography or the reveal). With frameloop="demand"
 * this means the canvas only redraws while the phone is actually moving —
 * between those moments the GPU is idle, so the rest of the page's animations
 * (chapter reveals, count-up, scrolling) don't have to fight it for frames.
 */
function InvalidateOnChange({ values }: { values: MotionValue<number>[] }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    const unsubs = values.map((v) => v.on("change", () => invalidate()));
    return () => unsubs.forEach((u) => u());
  }, [values, invalidate]);
  return null;
}

export default function Phone3D({
  choreo,
  progress,
  active = true,
}: {
  choreo: PhoneChoreography;
  progress: MotionValue<number>;
  active?: boolean;
}) {
  // Reveal the phone on load by easing material opacity 0→1 (see PhoneModel),
  // driven by a MotionValue so it participates in on-demand invalidation.
  const reveal = useMotionValue(0);
  useEffect(() => {
    const controls = animate(reveal, 1, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [reveal]);

  const watched = useMemo(
    () => [choreo.x, choreo.rotY, choreo.rotZ, choreo.scale, choreo.opacity, reveal],
    [choreo, reveal]
  );

  // This component only mounts once the lazy chunk + model are loaded (the
  // Suspense boundary lives in Phone3DStage). The reveal + scroll fade are
  // driven on material opacity inside the scene (see PhoneModel) rather than
  // CSS opacity, so the browser never composites the whole canvas as a layer.
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 10], fov: 35 }}
        // Let R3F drop resolution under load, then recover when idle.
        performance={{ min: 0.5 }}
        // Only render when something actually animates (and never once the
        // phone has fully faded out), so the canvas stops competing for frames
        // with the rest of the page's animations.
        frameloop={active ? "demand" : "never"}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight color="#ec4899" position={[-4, -2, -3]} intensity={3} />
        <PhoneModel choreo={choreo} progress={progress} reveal={reveal} />
        <InvalidateOnChange values={watched} />
        <Preload all />
        <AdaptiveDpr />
      </Canvas>
    </div>
  );
}
