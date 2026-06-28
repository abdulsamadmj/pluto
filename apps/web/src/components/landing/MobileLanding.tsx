import { Button } from "@repo/ui/button";
import { Download } from "lucide-react";
import { StoreBadges } from "./StoreBadges";

/**
 * Mobile (small-viewport) landing: a single, non-scrolling app-promo screen —
 * no 3D, no scroll storytelling. Promotes the Pluto mobile app with a download
 * CTA and "coming soon" store badges.
 */
export function MobileLanding() {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-zinc-950 px-6 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_0%,rgba(232,121,185,0.18),transparent),radial-gradient(500px_300px_at_50%_100%,rgba(120,80,255,0.16),transparent)]" />

      {/* Logo */}
      <header className="relative flex items-center gap-2 py-5 font-bold">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-base">
          🛡️
        </span>
        <span className="font-display text-2xl tracking-tight">Pluto</span>
      </header>

      {/* Centered hero */}
      <main className="relative flex flex-1 flex-col items-center justify-center text-center">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Warranty &amp; Device Tracker
        </span>
        <h1 className="mt-5 font-display text-5xl leading-[1.05]">
          Never miss a{" "}
          <span className="bg-gradient-to-r from-primary via-purple-300 to-pink-300 bg-clip-text text-transparent">
            warranty
          </span>{" "}
          again.
        </h1>
        <p className="mt-4 max-w-xs text-sm text-zinc-400">
          Track every device and its warranty coverage — right from your pocket.
        </p>

        <Button asChild size="lg" className="mt-8">
          <a href="#">
            <Download className="size-4" /> Download the app
          </a>
        </Button>

        <div className="mt-6">
          <StoreBadges comingSoon />
        </div>
      </main>

      <footer className="relative py-5 text-center font-mono text-[10px] text-zinc-600">
        © {new Date().getFullYear()} Pluto
      </footer>
    </div>
  );
}
