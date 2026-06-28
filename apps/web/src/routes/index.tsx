import { Button } from "@repo/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <Hero />
      <Features />
      <Stats />
      <CallToAction />
      <Footer />
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-base">
        🛡️
      </span>
      <span className="text-lg tracking-tight">Pluto</span>
    </Link>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#stats" className="hover:text-white">
            Why us
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
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_400px_at_20%_-10%,rgba(120,80,255,0.18),transparent),radial-gradient(900px_300px_at_90%_0%,rgba(236,72,153,0.14),transparent)]" />
      <div className="mx-auto max-w-6xl px-5 py-24 text-center md:py-32">
        <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
          Warranty &amp; Device Tracker
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Never miss a{" "}
          <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            warranty expiry
          </span>{" "}
          again
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Catalog every device you own, track warranty coverage, and get ahead
          of upcoming expirations — all from one centralized dashboard.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/sign-up">Start tracking free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sign-in">View the dashboard</Link>
          </Button>
        </div>
        <div className="mt-16">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const rows = [
    { name: 'MacBook Pro 16"', brand: "Apple", status: "Active", tone: "emerald" },
    { name: "Galaxy S24 Ultra", brand: "Samsung", status: "Expiring soon", tone: "amber" },
    { name: "Bravia X90L", brand: "Sony", status: "Expired", tone: "red" },
  ] as const;
  const toneMap = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
  };
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-left shadow-2xl backdrop-blur">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total", "250"],
          ["Active", "103"],
          ["Expiring", "6"],
          ["Expired", "141"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/5 bg-zinc-950/50 p-3"
          >
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-white/5">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center justify-between px-4 py-3 text-sm ${
              i > 0 ? "border-t border-white/5" : ""
            }`}
          >
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-zinc-500">{r.brand}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${toneMap[r.tone]}`}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📇",
    title: "Centralized catalog",
    body: "Keep every device — laptops, phones, TVs, appliances — in one organized place with full purchase details.",
  },
  {
    icon: "⏰",
    title: "Expiry alerts",
    body: "See at a glance which warranties are active, expiring within 30 days, or already lapsed.",
  },
  {
    icon: "🧭",
    title: "Warranty timeline",
    body: "Track the full lifecycle of each device: purchase, registration, claims, repairs, and expiry.",
  },
  {
    icon: "🔍",
    title: "Powerful search & filter",
    body: "Find any device instantly by name, brand, or serial — then filter and sort by status or category.",
  },
  {
    icon: "📝",
    title: "Notes & details",
    body: "Attach notes, retailer info, and receipts so everything you need is one click away.",
  },
  {
    icon: "🔒",
    title: "Secure & private",
    body: "Your data is protected behind authentication, accessible only to you.",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Everything you need to stay covered
          </h2>
          <p className="mt-4 text-zinc-400">
            Managing devices and warranties shouldn&apos;t mean digging through
            emails and drawers. Pluto brings it all together.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-4 grid size-11 place-items-center rounded-lg bg-white/5 text-2xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  ["12,000+", "Devices tracked"],
  ["$8.4M", "Warranties monitored"],
  ["98%", "On-time renewals"],
  ["30 days", "Early expiry warnings"],
];

function Stats() {
  return (
    <section
      id="stats"
      className="border-t border-white/5 bg-gradient-to-b from-zinc-900/40 to-transparent py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label}>
              <p className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
                {value}
              </p>
              <p className="mt-2 text-sm text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-4xl px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent p-10 text-center md:p-16">
          <h2 className="text-3xl font-bold md:text-4xl">
            Take control of your warranties today
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
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-zinc-500 sm:flex-row">
        <Logo />
        <p>© {new Date().getFullYear()} Pluto. Built on the Reno Stack.</p>
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
