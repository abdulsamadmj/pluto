import {
  daysUntil,
  statusLabels,
  type WarrantyStatus,
} from "@repo/validators";

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const currencyFmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export function formatDate(value: string | Date): string {
  return dateFmt.format(new Date(value));
}

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

/** Human-friendly "time left" string relative to an expiry date. */
export function formatTimeLeft(expiry: string | Date): string {
  const days = daysUntil(expiry);
  if (days < 0) {
    const ago = Math.abs(days);
    return ago >= 365
      ? `Expired ${Math.floor(ago / 365)}y ago`
      : `Expired ${ago}d ago`;
  }
  if (days === 0) return "Expires today";
  if (days < 60) return `${days} days left`;
  if (days < 365) return `${Math.round(days / 30)} months left`;
  return `${(days / 365).toFixed(1)} years left`;
}

export const statusBadgeVariant: Record<
  WarrantyStatus,
  "success" | "warning" | "danger"
> = {
  active: "success",
  expiring_soon: "warning",
  expired: "danger",
};

export { statusLabels };
