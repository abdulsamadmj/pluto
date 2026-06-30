import { motion } from "framer-motion";
import { Bell, FileText, ScanLine, WifiOff } from "lucide-react";
import { StoreBadges } from "./StoreBadges";

const HIGHLIGHTS = [
  { icon: ScanLine, label: "Snap a receipt to autofill" },
  { icon: Bell, label: "Push expiry reminders" },
  { icon: FileText, label: "Capture receipts" },
  { icon: WifiOff, label: "Offline access" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function MobileAppSection() {
  return (
    <section
      id="app"
      className="relative flex min-h-screen snap-start items-center justify-center px-5 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_50%_60%,rgba(0,222,111,0.12),transparent)]" />
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15% 0px" }}
        className="relative mx-auto max-w-xl text-center"
      >
        <motion.p
          variants={item}
          className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary"
        >
          Now on mobile
        </motion.p>
        <motion.h2
          variants={item}
          className="font-display text-4xl leading-tight text-white md:text-6xl"
        >
          Your warranties, in your pocket.
        </motion.h2>
        <motion.p variants={item} className="mx-auto mt-5 max-w-md text-lg text-zinc-400">
          Snap a receipt and Pluto fills in the details, then sends push alerts
          before coverage ends — all from the app, on the same secure backend.
        </motion.p>

        <motion.div variants={item} className="mt-8">
          <StoreBadges />
        </motion.div>

        <motion.ul
          variants={container}
          className="mt-10 grid grid-cols-2 gap-3 text-left sm:grid-cols-4"
        >
          {HIGHLIGHTS.map((h) => (
            <motion.li
              key={h.label}
              variants={item}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <h.icon className="size-5 text-primary" />
              <span className="text-xs text-zinc-300">{h.label}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
