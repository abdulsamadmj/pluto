import { type MotionValue, useSpring, useTransform } from "framer-motion";

export type PhoneChoreography = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotY: MotionValue<number>;
  rotZ: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
};

const spring = { stiffness: 80, damping: 20, mass: 0.5 };

/**
 * Maps page scroll progress (0→1) to the 3D phone's transform, choreographed as:
 *  hero center → chapter-1 left → chapter-2 right → chapter-3 middle →
 *  rotate to landscape, centered, for the mobile-app section.
 * Each channel is spring-smoothed so the phone eases rather than snapping.
 */
export function usePhoneChoreography(
  progress: MotionValue<number>
): PhoneChoreography {
  // Breakpoints for hero + 4 chapters + mobile-app section: hero center →
  // ch1 (Capture) → ch2 (Catalog) → ch3 (Stay ahead) → ch4 (Dashboard) →
  // mobile-app section (landscape, centered) → fade out before stats/cta/footer.
  // Text alternates left/right/left/right, so the phone drifts opposite each.
  const x = useTransform(
    progress,
    [0, 0.1, 0.22, 0.34, 0.46, 0.58, 1],
    [0, 4, -4, 4, -4, 0, 0],
    { clamp: true }
  );
  const y = useTransform(progress, [0, 1], [0, 0]);
  const rotY = useTransform(
    progress,
    [0, 0.1, 0.22, 0.34, 0.46, 0.58],
    [-0.3, 0.3, -0.35, 0.35, -0.35, 0],
    { clamp: true }
  );
  const rotZ = useTransform(progress, [0.56, 0.68], [0, -Math.PI / 2], {
    clamp: true,
  });
  const scale = useTransform(progress, [0, 0.46, 0.58, 0.68], [1, 1, 1.05, 1.1], {
    clamp: true,
  });
  // Stay fully visible through the chapters and the landscape hand-off, then
  // fade out only once the phone has arrived in the mobile-app section — its
  // opaque backdrop covers the phone there, so the fade just smooths the edges.
  const opacity = useTransform(
    progress,
    [0, 0.72, 0.8, 1],
    [1, 1, 0, 0],
    { clamp: true }
  );

  return {
    x: useSpring(x, spring),
    y: useSpring(y, spring),
    rotY: useSpring(rotY, spring),
    rotZ: useSpring(rotZ, spring),
    scale: useSpring(scale, spring),
    opacity,
  };
}
