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
  // Breakpoints (with 8 sections): hero → ch1 left → ch2 right → ch3 middle →
  // mobile-app section (landscape, centered) → fade out before stats/cta/footer.
  const x = useTransform(
    progress,
    [0, 0.1, 0.28, 0.42, 0.55, 1],
    [0, 0, -2.2, 2.2, 0, 0],
    { clamp: true }
  );
  const y = useTransform(progress, [0, 1], [0, 0]);
  const rotY = useTransform(
    progress,
    [0, 0.1, 0.28, 0.42, 0.55],
    [-0.3, -0.3, 0.35, -0.35, 0],
    { clamp: true }
  );
  const rotZ = useTransform(progress, [0.5, 0.62], [0, -Math.PI / 2], {
    clamp: true,
  });
  const scale = useTransform(progress, [0, 0.42, 0.55, 0.62], [1, 1, 1.05, 1.1], {
    clamp: true,
  });
  // Fully visible through the landscape (app) beat, then fade so the closing
  // stats/CTA/footer aren't cluttered by the fixed phone.
  const opacity = useTransform(progress, [0, 0.66, 0.74], [1, 1, 0], {
    clamp: true,
  });

  return {
    x: useSpring(x, spring),
    y: useSpring(y, spring),
    rotY: useSpring(rotY, spring),
    rotZ: useSpring(rotZ, spring),
    scale: useSpring(scale, spring),
    opacity,
  };
}
