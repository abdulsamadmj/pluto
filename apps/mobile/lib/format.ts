import {
  daysUntil,
  statusLabels,
  type WarrantyStatus,
} from "@repo/validators";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatDate(value: string | Date): string {
  return dateFmt.format(new Date(value));
}

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

export function formatTimeLeft(expiry: string | Date): string {
  const days = daysUntil(expiry);
  if (days < 0) {
    const ago = Math.abs(days);
    return ago >= 365 ? `Expired ${Math.floor(ago / 365)}y ago` : `Expired ${ago}d ago`;
  }
  if (days === 0) return "Expires today";
  if (days < 60) return `${days} days left`;
  if (days < 365) return `${Math.round(days / 30)} months left`;
  return `${(days / 365).toFixed(1)} years left`;
}

/** Compact relative time, e.g. "just now", "5m ago", "3d ago". */
export function timeAgo(value: string | Date): string {
  const d = new Date(value);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

/** Tailwind text/bg classes per status, for the native Badge. */
export const statusStyles: Record<
  WarrantyStatus,
  { text: string; bg: string; dot: string }
> = {
  active: { text: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  expiring_soon: { text: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-400" },
  expired: { text: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" },
};

export { statusLabels };
