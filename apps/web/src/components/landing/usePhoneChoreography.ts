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
 * Maps the phone's transform off two scroll signals:
 *  - `story` (0→1) spans exactly the 6 full-screen story sections (hero + 4
 *    chapters + mobile-app), so each section is centered at a known fraction:
 *    hero 0 · ch1 0.2 · ch2 0.4 · ch3 0.6 · ch4 0.8 · mobile 1.0. The phone
 *    drifts to the side OPPOSITE each chapter's text (ch text goes
 *    left/right/left/right → phone right/left/right/left), then rotates to
 *    landscape and scales up as it enters the mobile-app section.
 *  - `page` (0→1) spans the whole page; used only for the opacity fade as the
 *    opaque closing block (stats/cta/footer) scrolls up over the phone.
 * Each channel is spring-smoothed so the phone eases rather than snapping.
 */
export function usePhoneChoreography(
  story: MotionValue<number>,
  page: MotionValue<number>
): PhoneChoreography {
  // Phone X: 0 at hero, then opposite each chapter's text, back to 0 for the
  // centered landscape hand-off. Stops sit exactly on each section's center.
  const x = useTransform(
    story,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    [0, 4, -4, 4, -4, 0],
    { clamp: true }
  );
  const y = useTransform(story, [0, 1], [0, 0]);
  // Y rotation: the phone HOLDS its leaned-in orientation across a buffer around
  // each chapter (giving time to read the screen), then does one full CLOCKWISE
  // turn (negative accumulation) between chapters. Each flip is centred on the
  // texture-swap point (0.3/0.5/0.7) so the change lands while the phone is
  // back-on (hidden). Right-side chapters lean −lean toward the centre, left-side
  // chapters +lean. Stops come in hold/flip pairs: […, holdEnd, flipEnd, …].
  const TURN = Math.PI * 2;
  const lean = 0.25;
  const rotY = useTransform(
    story,
    [0, 0.13, 0.27, 0.33, 0.47, 0.53, 0.67, 0.73, 0.87, 1],
    [
      0, // hero, facing forward
      -lean, // ch1 (right) leaned inward — hold…
      -lean, // …until 0.27, then flip
      -TURN + lean, // ch2 (left), one clockwise turn done by 0.33
      -TURN + lean, // hold across ch2…
      -2 * TURN - lean, // ch3 (right)
      -2 * TURN - lean, // hold across ch3…
      -3 * TURN + lean, // ch4 (left)
      -3 * TURN + lean, // hold across ch4…
      -3 * TURN, // settle to forward for the landscape hand-off
    ],
    { clamp: true }
  );
  // Rotate to landscape after the chapter-4 buffer, entering the app section.
  const rotZ = useTransform(story, [0.88, 0.99], [0, -Math.PI / 2], {
    clamp: true,
  });
  const scale = useTransform(story, [0, 0.87, 0.95, 1], [1, 1, 1.05, 1.1], {
    clamp: true,
  });
  // Fade out only once the closing block is scrolling over the phone (driven by
  // whole-page progress; the opaque block also physically covers it).
  const opacity = useTransform(page, [0, 0.9, 0.98, 1], [1, 1, 0, 0], {
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
