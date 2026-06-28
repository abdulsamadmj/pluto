import type { ReactNode } from "react";

/**
 * App Store / Google Play badges as self-contained inline SVG (no external
 * images). `comingSoon` renders them disabled with a "Coming soon" caption.
 */
export function StoreBadges({ comingSoon = false }: { comingSoon?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <AppStoreBadge comingSoon={comingSoon} />
      <GooglePlayBadge comingSoon={comingSoon} />
    </div>
  );
}

function BadgeShell({
  children,
  label,
  comingSoon,
}: {
  children: ReactNode;
  label: string;
  comingSoon: boolean;
}) {
  const className =
    "flex items-center gap-3 rounded-xl border border-white/15 bg-black px-4 py-2.5";
  if (comingSoon) {
    return (
      <div className={`${className} opacity-60`} aria-label={`${label} — coming soon`}>
        {children}
      </div>
    );
  }
  return (
    <a
      href="#"
      aria-label={label}
      className={`${className} pointer-events-auto transition-colors hover:border-white/30`}
    >
      {children}
    </a>
  );
}

function AppStoreBadge({ comingSoon }: { comingSoon: boolean }) {
  return (
    <BadgeShell label="Download on the App Store" comingSoon={comingSoon}>
      <svg viewBox="0 0 24 24" className="size-7 fill-white" aria-hidden>
        <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.78.87-2.06 1.55-3.13 1.46-.13-1.1.42-2.27 1.07-3 .73-.82 2.02-1.44 3.18-1.44zM20.5 17.2c-.55 1.28-.82 1.85-1.53 2.98-.99 1.57-2.39 3.53-4.12 3.54-1.54.01-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1.01-1.73-.02-3.05-1.78-4.04-3.35C-.05 16.94-.4 11.8 1.27 9.06c.94-1.55 2.42-2.53 4.06-2.55 1.57-.03 3.05 1.06 4.03 1.06.97 0 2.77-1.31 4.67-1.12.79.03 3.01.32 4.44 2.41-3.78 2.07-3.17 7.46.03 8.34z" />
      </svg>
      <div className="text-left leading-tight">
        <div className="font-mono text-[9px] uppercase tracking-wide text-zinc-400">
          {comingSoon ? "Coming soon to" : "Download on the"}
        </div>
        <div className="text-base font-semibold text-white">App Store</div>
      </div>
    </BadgeShell>
  );
}

function GooglePlayBadge({ comingSoon }: { comingSoon: boolean }) {
  return (
    <BadgeShell label="Get it on Google Play" comingSoon={comingSoon}>
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
        <path d="M3.6 2.3 13 11.7 3.6 21.1c-.3-.2-.5-.6-.5-1.1V3.4c0-.5.2-.9.5-1.1z" fill="#4dd0e1" />
        <path d="M16.5 8.6 13 11.7 3.6 2.3c.1-.1.3-.1.4-.1.3 0 .6.1.9.3l11.6 6.1z" fill="#4caf50" />
        <path d="M20.3 11l-3.8-2-3.5 2.7 3.5 2.7 3.8-2c.5-.3.5-1.1 0-1.4z" fill="#ffc107" />
        <path d="M3.6 21.1 13 11.7l3.5 3.1L4.9 20.9c-.3.2-.6.3-.9.3-.1 0-.3 0-.4-.1z" fill="#f44336" />
      </svg>
      <div className="text-left leading-tight">
        <div className="font-mono text-[9px] uppercase tracking-wide text-zinc-400">
          {comingSoon ? "Coming soon to" : "Get it on"}
        </div>
        <div className="text-base font-semibold text-white">Google Play</div>
      </div>
    </BadgeShell>
  );
}
