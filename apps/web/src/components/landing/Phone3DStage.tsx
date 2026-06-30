import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { lazy, Suspense, useMemo, useState } from "react";
import { usePhoneChoreography } from "./usePhoneChoreography";

const Phone3D = lazy(() => import("./Phone3D"));

function webglAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Fixed, full-viewport stage that holds the single 3D phone instance. The WebGL
 * canvas is lazy-loaded (keeps three.js out of the initial chunk). When the user
 * prefers reduced motion or WebGL is unavailable, a static 2D phone is shown.
 */
export function Phone3DStage({
  progress,
  storyProgress,
}: {
  /** Whole-page scroll progress — drives the closing-block fade + render gating. */
  progress: MotionValue<number>;
  /** Story-only progress (hero→mobile) — drives the phone's choreography. */
  storyProgress: MotionValue<number>;
}) {
  const reduce = useReducedMotion();
  const choreo = usePhoneChoreography(storyProgress, progress);
  const canRender3D = useMemo(() => !reduce && webglAvailable(), [reduce]);

  // The phone finishes its choreography by the app section, then the opaque
  // closing block scrolls over it. Once we're into that block, stop driving the
  // WebGL render loop so it doesn't burn frames behind the rest of the page.
  const [active, setActive] = useState(true);
  useMotionValueEvent(progress, "change", (v) => {
    const next = v < 0.99;
    setActive((prev) => (prev === next ? prev : next));
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
      style={{ opacity: choreo.opacity }}
    >
      {canRender3D ? (
        <Suspense fallback={null}>
          <div className="h-[80vh] w-full">
            <Phone3D choreo={choreo} progress={storyProgress} active={active} />
          </div>
        </Suspense>
      ) : (
        <PhoneFallback2D />
      )}
    </motion.div>
  );
}

/** Static fallback: a CSS phone frame with the app screenshot. */
function PhoneFallback2D() {
  return (
    <div className="relative h-[60vh] max-h-[640px] w-auto" style={{ aspectRatio: "9 / 19" }}>
      <div className="h-full overflow-hidden rounded-[2rem] border-4 border-zinc-800 bg-[#202020] shadow-2xl">
        <img
          src="/screens/03-dash.png"
          alt="Pluto app screenshot"
          className="h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}
