import { Button } from "@repo/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useScroll,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Chapter } from "../components/landing/Chapter";
import { MobileAppSection } from "../components/landing/MobileAppSection";
import { Phone3DStage } from "../components/landing/Phone3DStage";
import { ScrollProgressRail } from "../components/landing/ScrollProgressRail";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });

  return (
    <MotionConfig reducedMotion="user">
      <div ref={pageRef} className="relative min-h-screen bg-zinc-950 text-zinc-50">
        <MarketingNav />
        <Phone3DStage progress={scrollYProgress} />
        <ScrollProgressRail progress={scrollYProgress} />

        <main className="relative z-10">
          <Hero />

          <Chapter
            index="01"
            eyebrow="Catalog"
            align="left"
            title={<>Every device, in one place.</>}
            body="Laptops, phones, TVs, appliances — capture purchase details, serials, and receipts in a single organized catalog."
          />
          <Chapter
            index="02"
            eyebrow="Stay ahead"
            align="right"
            title={
              <>
                Never miss an <em className="text-primary not-italic">expiry</em>.
              </>
            }
            body="See what's active, expiring within 30 days, or already lapsed — and act before coverage runs out."
          />
          <Chapter
            index="03"
            eyebrow="History"
            align="left"
            title={<>A full warranty timeline.</>}
            body="Track each device's lifecycle — purchase, registration, claims, repairs, and expiry — at a glance."
          />

          <MobileAppSection />
          <Stats />
          <CallToAction />
          <Footer />
        </main>
      </div>
    </MotionConfig>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-base">
        🛡️
      </span>
      <span className="font-display text-2xl tracking-tight">Pluto</span>
    </Link>
  );
}

function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wider text-zinc-400 md:flex">
          <a href="#app" className="hover:text-white">
            Mobile app
          </a>
          <a href="#stats" className="hover:text-white">
            Why Pluto
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/sign-up">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-between px-5 pb-12 pt-28 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl"
      >
        <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Warranty &amp; Device Tracker
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-6xl leading-[1.02] tracking-tight md:text-8xl">
          Never miss a{" "}
          <span className="bg-gradient-to-r from-primary via-purple-300 to-pink-300 bg-clip-text text-transparent">
            warranty
          </span>{" "}
          again.
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-xl"
      >
        <p className="text-lg text-zinc-400">
          Catalog every device you own, track warranty coverage, and get ahead of
          upcoming expirations — from web and mobile.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/sign-up">Start tracking free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sign-in">Open the dashboard</Link>
          </Button>
        </div>
        <ChevronDown className="mx-auto mt-10 size-5 animate-bounce text-zinc-600" />
      </motion.div>
    </section>
  );
}

const STATS: [string, string][] = [
  ["12000", "Devices tracked"],
  ["8400000", "Warranties monitored ($)"],
  ["98", "On-time renewals (%)"],
  ["30", "Day early warnings"],
];

function Stats() {
  return (
    <section
      id="stats"
      className="relative border-t border-white/5 bg-zinc-950/40 py-28 backdrop-blur-sm"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 text-center lg:grid-cols-4">
        {STATS.map(([value, label]) => (
          <CountUp key={label} target={Number(value)} label={label} />
        ))}
      </div>
    </section>
  );
}

function CountUp({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <div ref={ref}>
      <p className="bg-gradient-to-r from-primary to-purple-300 bg-clip-text font-display text-5xl font-bold text-transparent md:text-6xl">
        {formatCompact(display)}
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function formatCompact(n: number): string {
  const v = Math.round(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

function CallToAction() {
  return (
    <section className="relative px-5 py-28">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent p-10 text-center md:p-16">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">
            Take control of your warranties.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Create a free account and start tracking your devices in minutes.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/sign-up">Get started — it&apos;s free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-zinc-950 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-zinc-500 sm:flex-row">
        <Logo />
        <p className="font-mono text-xs">
          © {new Date().getFullYear()} Pluto · Built on the Reno Stack
        </p>
        <div className="flex gap-6">
          <Link to="/sign-in" className="hover:text-white">
            Sign in
          </Link>
          <Link to="/sign-up" className="hover:text-white">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
