import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload, useGLTF, useTexture } from "@react-three/drei";
import { type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PhoneChoreography } from "./usePhoneChoreography";

const MODEL_URL = "/models/iphone.glb";
useGLTF.preload(MODEL_URL);

const CASE_COLOR = "#00DE6F"; // Pluto magenta
const TARGET_HEIGHT = 4.3; // world units the phone should occupy
const SCREEN_SCALE = 1.02; // screen overlay scale so images sit flush in the bezel

// Even bezel around the screen, as a fraction of device width (world units).
const BEZEL_FRAC = 0.05;

function applyScreenTextureSettings(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
}

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

// Portrait screens shown per scroll chapter (in chapter order), then the
// landscape app screen: Capture → Catalog → Stay ahead → Dashboard → app.
const SCREEN_URLS = [
  "/screens/01-capture.png",
  "/screens/00-catalog.png",
  "/screens/02-alerts.png",
  "/screens/03-dash.png",
  "/screens/landscape.png",
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
        // Tint the solid metallic frame/back (no texture) → brand green "case".
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

    const screen = { z, screenGeo };
    return { node: wrap, screen };
  }, [scene]);

  textures.forEach(applyScreenTextureSettings);

  useLayoutEffect(() => {
    if (screenMat.current) screenMat.current.map = textures[0];
  }, [textures]);

  useFrame(() => {
    const g = outer.current;
    if (!g) return;
    g.position.x = choreo.x.get();
    g.position.y = choreo.y.get();
    g.rotation.y = choreo.rotY.get();
    g.rotation.z = choreo.rotZ.get();
    const sc = choreo.scale.get();
    g.scale.set(sc, sc, sc);

    // Target screen by story chapter (centers 0.2/0.4/0.6/0.8, app at 1.0);
    // last = landscape app screen.
    const p = progress.get();
    const idx = p < 0.3 ? 0 : p < 0.5 ? 1 : p < 0.7 ? 2 : p < 0.9 ? 3 : 4;
    // Commit the swap only while the screen is turned away from the camera
    // (mid-flip → cos(rotationY) < 0), so the change is never seen. The
    // landscape hand-off is exempt: it happens during the in-plane Z spin.
    const hidden = Math.cos(g.rotation.y) < 0;
    if (
      screenMat.current &&
      screenMat.current.map !== textures[idx] &&
      (hidden || idx === 4)
    ) {
      screenMat.current.map = textures[idx];
      screenMat.current.needsUpdate = true;
    }
  });

  return (
    <group ref={outer}>
      <primitive object={node} />
      {/* Rounded screen overlay — child of the group so it rotates to landscape too */}
      <mesh
        ref={screenRef}
        geometry={screen.screenGeo}
        position={[0, 0, screen.z]}
        scale={[SCREEN_SCALE, SCREEN_SCALE, 1]}
      >
        <meshBasicMaterial ref={screenMat} toneMapped={false} />
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
  const watched = useMemo(
    () => [choreo.x, choreo.rotY, choreo.rotZ, choreo.scale, choreo.opacity],
    [choreo]
  );

  // Fade the canvas in once it has mounted (which only happens after the lazy
  // chunk + model have loaded, via the Suspense boundary). Inline opacity +
  // a double rAF guarantees the browser paints opacity:0 first, so the CSS
  // transition animates rather than snapping straight to opaque.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 700ms ease-out" }}
    >
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
        <pointLight color="#00DE6F" position={[-4, -2, -3]} intensity={3} />
        <PhoneModel choreo={choreo} progress={progress} />
        <InvalidateOnChange values={watched} />
        <Preload all />
        <AdaptiveDpr />
      </Canvas>
    </div>
  );
}
