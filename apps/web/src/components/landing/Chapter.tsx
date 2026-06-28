import { motion } from "framer-motion";
import type { ReactNode } from "react";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/**
 * A full-height storytelling panel. Text sits on one side so the scroll-driven
 * 3D phone (behind, fixed) occupies the other.
 */
export function Chapter({
  index,
  eyebrow,
  title,
  body,
  align = "left",
  children,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  align?: "left" | "right";
  children?: ReactNode;
}) {
  return (
    <section className="relative flex min-h-screen items-center px-5">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20% 0px" }}
          className={`max-w-md ${align === "right" ? "ml-auto text-right" : "text-left"}`}
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            {index} · {eyebrow}
          </p>
          <h2 className="font-display text-4xl leading-[1.05] text-white md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg text-zinc-400">{body}</p>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
