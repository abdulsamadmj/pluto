import { z } from "zod";

/**
 * Derived warranty status. Not stored in the DB — computed from the expiry
 * date by `getWarrantyStatus` so the table, dashboard metrics, and details
 * view always agree on a single definition.
 */
export const warrantyStatuses = ["active", "expiring_soon", "expired"] as const;
export type WarrantyStatus = (typeof warrantyStatuses)[number];

/** A device whose warranty expires within this many days counts as "expiring soon". */
export const EXPIRING_SOON_DAYS = 30;

export const deviceSortFields = [
  "createdAt",
  "name",
  "brand",
  "purchaseDate",
  "warrantyExpiry",
  "status",
] as const;
export type DeviceSortField = (typeof deviceSortFields)[number];

/** Human labels for each sort field (shared by the web & mobile sort controls). */
export const sortLabels: Record<DeviceSortField, string> = {
  createdAt: "Newly added",
  name: "Name",
  brand: "Brand",
  purchaseDate: "Purchase date",
  warrantyExpiry: "Warranty expiry",
  status: "Status",
};

/** The most natural order for a given sort field (newest/soonest first where it helps). */
export function defaultOrderFor(sort: DeviceSortField): "asc" | "desc" {
  return sort === "createdAt" ? "desc" : "asc";
}

/**
 * Query contract for `GET /devices`. Imported by both the Hono route (to
 * validate incoming params) and the web app (to type the query inputs), so the
 * two sides can never drift.
 */
export const deviceQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(warrantyStatuses).optional(),
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z.enum(deviceSortFields).default("warrantyExpiry"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type DeviceQuery = z.infer<typeof deviceQuerySchema>;

/** Body for `PATCH /devices/:id/notes`. */
export const updateNotesSchema = z.object({
  notes: z.string().max(2000),
});
export type UpdateNotes = z.infer<typeof updateNotesSchema>;

/** Categories offered in the create/edit forms (kept in sync with seed data). */
export const deviceCategories = [
  "Laptop",
  "Phone",
  "TV",
  "Tablet",
  "Headphones",
  "Smartwatch",
  "Camera",
  "Console",
  "Monitor",
  "Appliance",
] as const;
export type DeviceCategory = (typeof deviceCategories)[number];

/**
 * Gradient skins a device's warranty card can use. `auto` (the default) picks a
 * stable, per-device accent colour that fades into near-black — so an
 * unassigned card gets its own hue instead of everything looking identical. The
 * rest are explicit manual picks. Shared so the DB column, API validation, and
 * both clients agree.
 */
export const cardThemes = [
  "auto",
  "brand",
  "ocean",
  "violet",
  "sunset",
  "slate",
] as const;
export type CardTheme = (typeof cardThemes)[number];

export const cardThemeLabels: Record<CardTheme, string> = {
  auto: "Auto",
  brand: "Pluto",
  ocean: "Ocean",
  violet: "Violet",
  sunset: "Sunset",
  slate: "Slate",
};

/**
 * Accent → mid pairs for the `auto` theme; each is rendered as
 * `accent → mid → autoCardEnd` (near-black) at the same proportions as the
 * fixed themes. Shared by both clients so a given device gets the same hue
 * everywhere.
 */
export const autoCardPalette = [
  ["#00DE6F", "#0A3F2C"], // green
  ["#22D3EE", "#0E2A40"], // cyan
  ["#3B82F6", "#101F3A"], // blue
  ["#A78BFA", "#241A40"], // violet
  ["#F472B6", "#3A1630"], // pink
  ["#FB923C", "#3A1C16"], // orange
  ["#FBBF24", "#3A2E10"], // amber
  ["#F87171", "#3A1414"], // red
  ["#2DD4BF", "#0C3330"], // teal
  ["#818CF8", "#1A1B40"], // indigo
] as const;
export const autoCardEnd = "#0A0B0C";

/** Stable index into the auto palette derived from a seed (e.g. a device id). */
export function cardSeedIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % autoCardPalette.length;
}

/** The three gradient stops for a device's `auto` theme. */
export function autoCardStops(seed: string): [string, string, string] {
  const [accent, mid] = autoCardPalette[cardSeedIndex(seed)];
  return [accent, mid, autoCardEnd];
}

/**
 * Body for `POST /devices`. `warrantyExpiry` and the warranty status are NOT
 * accepted from the client — the server derives expiry from
 * `purchaseDate + warrantyMonths`, keeping a single source of truth.
 * Used by both the web and mobile create forms (shared validation).
 */
export const createDeviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  category: z.string().trim().min(1, "Category is required"),
  model: z.string().trim().min(1, "Model is required"),
  serialNumber: z.string().trim().min(1, "Serial number is required"),
  purchaseDate: z.coerce.date(),
  purchasePrice: z.coerce.number().int().min(0, "Price can't be negative"),
  retailer: z.string().trim().min(1, "Retailer is required"),
  warrantyMonths: z.coerce
    .number()
    .int()
    .min(0, "Must be 0 or more")
    .max(600, "That's too long"),
  warrantyProvider: z.string().trim().min(1, "Provider is required"),
  notes: z.string().max(2000).default(""),
  // Gradient skin for the device's warranty card. Defaults to the auto theme
  // (a stable per-device accent), letting cards differ without a manual pick.
  cardTheme: z.enum(cardThemes).default("auto"),
  // R2 object key of the warranty card / receipt image, set when the device was
  // created from a scan. Optional — manual entry leaves it unset.
  warrantyCardKey: z.string().optional(),
});
export type CreateDevice = z.infer<typeof createDeviceSchema>;

/**
 * What the OCR scan endpoint (`POST /devices/scan`) extracts from a warranty
 * card / receipt photo. Every field is nullable — the vision model only fills
 * what it can confidently read, and the user completes the rest. Mirrors the
 * create form's fields so the client can prefill directly. `purchaseDate` is an
 * ISO `YYYY-MM-DD` string and `purchasePrice` / `warrantyMonths` are whole
 * numbers, normalized by the model.
 */
export const scanExtractionSchema = z.object({
  name: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  purchasePrice: z.number().int().nullable().optional(),
  retailer: z.string().nullable().optional(),
  warrantyMonths: z.number().int().nullable().optional(),
  warrantyProvider: z.string().nullable().optional(),
});
export type ScanExtraction = z.infer<typeof scanExtractionSchema>;

/** Response body for `POST /devices/scan`. */
export type ScanResult = {
  key: string;
  extracted: ScanExtraction;
};

/** Body for `PATCH /devices/:id` — all fields optional (partial update). */
export const updateDeviceSchema = createDeviceSchema.partial();
export type UpdateDevice = z.infer<typeof updateDeviceSchema>;

/** Whole number of days from now until `expiry` (negative once expired). */
export function daysUntil(expiry: Date | string, now: Date = new Date()): number {
  const end = typeof expiry === "string" ? new Date(expiry) : expiry;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** The single source of truth for turning an expiry date into a status. */
export function getWarrantyStatus(
  expiry: Date | string,
  now: Date = new Date()
): WarrantyStatus {
  const days = daysUntil(expiry, now);
  if (days < 0) return "expired";
  if (days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

export const statusLabels: Record<WarrantyStatus, string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
};
