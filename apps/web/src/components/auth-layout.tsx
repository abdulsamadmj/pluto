import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Split-screen shell shared by all auth pages: a marketing panel on the left
 * (desktop only) and the form card on the right.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-zinc-950 text-zinc-50 lg:grid-cols-2">
      {/* Brand / marketing panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_400px_at_20%_10%,rgba(120,80,255,0.25),transparent),radial-gradient(600px_300px_at_80%_80%,rgba(236,72,153,0.18),transparent)]" />
        <Link to="/" className="relative flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
            🛡️
          </span>
          <span className="text-lg">Warrantly</span>
        </Link>
        <div className="relative">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            Track every device&apos;s warranty in one place.
          </h2>
          <p className="mt-4 max-w-sm text-zinc-400">
            Stop losing receipts and missing expiry dates. Warrantly keeps your
            coverage organized and visible.
          </p>
        </div>
        <p className="relative text-sm text-zinc-500">
          © {new Date().getFullYear()} Warrantly
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
                🛡️
              </span>
              <span className="text-lg">Warrantly</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-6 text-center text-sm text-zinc-400">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
