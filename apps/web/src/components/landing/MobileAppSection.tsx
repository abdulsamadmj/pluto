import { motion } from "framer-motion";
import { Bell, FileText, ScanLine, WifiOff } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ScanLine, label: "Scan serials & barcodes" },
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
      className="relative flex min-h-screen items-center justify-center px-5 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_50%_60%,rgba(232,121,185,0.12),transparent)]" />
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
          Track devices, scan receipts, and get push alerts before coverage ends —
          all from the Pluto app, built on the same secure backend.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <AppStoreBadge />
          <GooglePlayBadge />
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

function BadgeShell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/15 bg-black px-4 py-2.5 transition-colors hover:border-white/30"
    >
      {children}
    </a>
  );
}

function AppStoreBadge() {
  return (
    <BadgeShell label="Download on the App Store">
      <svg viewBox="0 0 24 24" className="size-7 fill-white" aria-hidden>
        <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.78.87-2.06 1.55-3.13 1.46-.13-1.1.42-2.27 1.07-3 .73-.82 2.02-1.44 3.18-1.44zM20.5 17.2c-.55 1.28-.82 1.85-1.53 2.98-.99 1.57-2.39 3.53-4.12 3.54-1.54.01-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1.01-1.73-.02-3.05-1.78-4.04-3.35C-.05 16.94-.4 11.8 1.27 9.06c.94-1.55 2.42-2.53 4.06-2.55 1.57-.03 3.05 1.06 4.03 1.06.97 0 2.77-1.31 4.67-1.12.79.03 3.01.32 4.44 2.41-3.78 2.07-3.17 7.46.03 8.34z" />
      </svg>
      <div className="text-left leading-tight">
        <div className="font-mono text-[9px] uppercase tracking-wide text-zinc-400">
          Download on the
        </div>
        <div className="text-base font-semibold text-white">App Store</div>
      </div>
    </BadgeShell>
  );
}

function GooglePlayBadge() {
  return (
    <BadgeShell label="Get it on Google Play">
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
        <path d="M3.6 2.3 13 11.7 3.6 21.1c-.3-.2-.5-.6-.5-1.1V3.4c0-.5.2-.9.5-1.1z" fill="#4dd0e1" />
        <path d="M16.5 8.6 13 11.7 3.6 2.3c.1-.1.3-.1.4-.1.3 0 .6.1.9.3l11.6 6.1z" fill="#4caf50" />
        <path d="M20.3 11l-3.8-2-3.5 2.7 3.5 2.7 3.8-2c.5-.3.5-1.1 0-1.4z" fill="#ffc107" />
        <path d="M3.6 21.1 13 11.7l3.5 3.1L4.9 20.9c-.3.2-.6.3-.9.3-.1 0-.3 0-.4-.1z" fill="#f44336" />
      </svg>
      <div className="text-left leading-tight">
        <div className="font-mono text-[9px] uppercase tracking-wide text-zinc-400">
          Get it on
        </div>
        <div className="text-base font-semibold text-white">Google Play</div>
      </div>
    </BadgeShell>
  );
}
