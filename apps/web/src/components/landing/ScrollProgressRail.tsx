import { motion, type MotionValue, useTransform } from "framer-motion";

const STEPS = ["01", "02", "03", "04", "05"];

/**
 * Fixed scroll indicator: a thin top progress bar + a right-edge rail of
 * chapter numbers that light up as you move through the story.
 */
export function ScrollProgressRail({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  return (
    <>
      {/* Top progress bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-primary"
        style={{ scaleX: progress }}
      />
      {/* Right rail */}
      <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        {STEPS.map((step, i) => (
          <RailDot key={step} step={step} index={i} progress={progress} />
        ))}
      </div>
    </>
  );
}

function RailDot({
  step,
  index,
  progress,
}: {
  step: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index / STEPS.length;
  const end = (index + 1) / STEPS.length;
  const opacity = useTransform(
    progress,
    [start - 0.01, start, end, end + 0.01],
    [0.35, 1, 1, 0.35]
  );
  const color = useTransform(
    progress,
    [start, end],
    ["#e879b9", "#e879b9"]
  );
  return (
    <motion.span
      style={{ opacity, color }}
      className="font-mono text-[10px] tracking-widest"
    >
      {step}
    </motion.span>
  );
}
