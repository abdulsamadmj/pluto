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
import { useEffect, useRef } from "react";
import { Chapter } from "../components/landing/Chapter";
import { MobileAppSection } from "../components/landing/MobileAppSection";
import { MobileLanding } from "../components/landing/MobileLanding";
import { Phone3DStage } from "../components/landing/Phone3DStage";
import { ScrollProgressRail } from "../components/landing/ScrollProgressRail";
import { useMediaQuery } from "../lib/useMediaQuery";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  // On small screens, skip the 3D + scroll storytelling entirely and show a
  // single non-scrolling app-promo page.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (!isDesktop) return <MobileLanding />;
  return <DesktopLanding />;
}

function DesktopLanding() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });

  return (
    <MotionConfig reducedMotion="user">
      <div ref={pageRef} className="relative min-h-screen bg-[#181818] text-zinc-50">
        <MarketingNav />
        <Phone3DStage progress={scrollYProgress} />
        <ScrollProgressRail progress={scrollYProgress} />

        <main className="relative z-10">
          <Hero />

          {/* Text sits opposite the phone's scroll position (phone goes
              left → text right, phone right → text left). */}
          <Chapter
            index="01"
            eyebrow="Capture"
            align="left"
            title={
              <>
                Snap it.{" "}
                <em className="text-primary not-italic">We&apos;ll do the typing.</em>
              </>
            }
            body="Photograph a receipt or warranty card and Pluto reads the brand, model, serial, purchase date, and coverage — then fills the form for you. Review, save, done."
          />
          <Chapter
            index="02"
            eyebrow="Catalog"
            align="right"
            title={<>Every device, in one place.</>}
            body="Laptops, phones, TVs, appliances — capture purchase details, serials, and receipts in a single organized catalog."
          />
          <Chapter
            index="03"
            eyebrow="Stay ahead"
            align="left"
            title={
              <>
                Never miss an <em className="text-primary not-italic">expiry</em>.
              </>
            }
            body="See what's active, expiring within 30 days, or already lapsed — and act before coverage runs out."
          />
          <Chapter
            index="04"
            eyebrow="Dashboard"
            align="right"
            title={<>Everything at a glance.</>}
            body="Total devices, active coverage, what's expiring soon, and what's already lapsed — your whole warranty picture on one dashboard."
          />

          <MobileAppSection />

          {/* Opaque closing block: scrolls up over the fixed 3D phone and
              covers it (rather than the phone fading away). */}
          <div className="relative z-10 bg-[#181818]">
            <Stats />
            <CallToAction />
            <Footer />
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold">
      <img src="/logo.png" alt="Pluto" className="size-8 rounded-lg" />
      <span className="font-display text-2xl tracking-tight">Pluto</span>
    </Link>
  );
}

function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[#181818]/90">
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
    <section className="relative flex min-h-screen flex-col items-center justify-between px-5 pb-12 pt-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl"
      >
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-6xl leading-[1.02] tracking-tight md:text-8xl">
          Never miss a{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-300 to-teal-300 bg-clip-text text-transparent">
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
        <p className="text-sm text-zinc-400">
          Snap a receipt to add a device in seconds, track every warranty, and get
          ahead of upcoming expirations — no manual typing.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      className="relative border-t border-white/5 bg-[#181818] py-28"
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
  const numRef = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  useEffect(() => {
    if (!inView) return;
    // Write straight to the DOM node — avoids a React re-render every frame.
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = formatCompact(v);
      },
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <div ref={ref}>
      <p
        ref={numRef}
        className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text font-display text-5xl font-bold text-transparent md:text-6xl"
      >
        0
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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent p-10 text-center md:p-16">
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
    <footer className="relative border-t border-white/5 bg-[#181818] py-10">
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
