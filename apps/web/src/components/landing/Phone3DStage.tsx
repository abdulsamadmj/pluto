import { motion, type MotionValue, useReducedMotion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";
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
export function Phone3DStage({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const choreo = usePhoneChoreography(progress);
  const canRender3D = useMemo(() => !reduce && webglAvailable(), [reduce]);

  return (
    <motion.div
      style={{ opacity: choreo.opacity }}
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
    >
      {canRender3D ? (
        <Suspense fallback={null}>
          <div className="h-[80vh] w-full">
            <Phone3D choreo={choreo} progress={progress} />
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
      <div className="h-full overflow-hidden rounded-[2rem] border-4 border-zinc-800 bg-zinc-900 shadow-2xl">
        <img
          src="/app-screen.png"
          alt="Pluto app screenshot"
          className="h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}
