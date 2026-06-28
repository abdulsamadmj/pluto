import {
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
export function Phone3DStage({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const choreo = usePhoneChoreography(progress);
  const canRender3D = useMemo(() => !reduce && webglAvailable(), [reduce]);

  // Once the phone fades out (stats/CTA/footer), stop driving the WebGL render
  // loop entirely so it doesn't burn frames behind the rest of the page.
  const [active, setActive] = useState(true);
  useMotionValueEvent(choreo.opacity, "change", (v) => {
    const next = v > 0.01;
    setActive((prev) => (prev === next ? prev : next));
  });

  // The phone floats ABOVE the page content through the early chapters, then
  // drops behind once it reaches the chapter-04 app section (≈50% scroll) so
  // the "Now on mobile" content sits in front of it.
  const [onTop, setOnTop] = useState(true);
  useMotionValueEvent(progress, "change", (v) => {
    const next = v < 0.5;
    setOnTop((prev) => (prev === next ? prev : next));
  });

  return (
    <div
      className={`pointer-events-none fixed inset-0 flex items-center justify-center ${
        onTop ? "z-30" : "z-0"
      }`}
    >
      {canRender3D ? (
        <Suspense fallback={null}>
          <div className="h-[80vh] w-full">
            <Phone3D choreo={choreo} progress={progress} active={active} />
          </div>
        </Suspense>
      ) : (
        <PhoneFallback2D />
      )}
    </div>
  );
}

/** Static fallback: a CSS phone frame with the app screenshot. */
function PhoneFallback2D() {
  return (
    <div className="relative h-[60vh] max-h-[640px] w-auto" style={{ aspectRatio: "9 / 19" }}>
      <div className="h-full overflow-hidden rounded-[2rem] border-4 border-zinc-800 bg-[#202020] shadow-2xl">
        <img
          src="/app-screen.png"
          alt="Pluto app screenshot"
          className="h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}
