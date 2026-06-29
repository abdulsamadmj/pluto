import {
  type CreateDevice,
  type DeviceQuery,
  EXPIRING_SOON_DAYS,
  getWarrantyStatus,
  type UpdateDevice,
  type WarrantyStatus,
} from "@repo/validators";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  lt,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { getCardUrl } from "./storage.service";

export type DeviceRow = typeof schema.device.$inferSelect;

export type DeviceListItem = DeviceRow & { status: WarrantyStatus };

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Builds the WHERE clause for a status filter. Status is derived from
 * `warrantyExpiry`, so we translate it into date-range predicates that Postgres
 * can evaluate directly (keeping filtering on the DB rather than in JS).
 */
function statusFilter(status: WarrantyStatus, now: Date): SQL | undefined {
  const soonCutoff = new Date(now);
  soonCutoff.setDate(soonCutoff.getDate() + EXPIRING_SOON_DAYS);

  switch (status) {
    case "expired":
      // expiry < now
      return lt(schema.device.warrantyExpiry, now);
    case "expiring_soon":
      // now <= expiry <= now + 30d
      return and(
        gte(schema.device.warrantyExpiry, now),
        lte(schema.device.warrantyExpiry, soonCutoff)
      );
    case "active":
      // expiry > now + 30d
      return gt(schema.device.warrantyExpiry, soonCutoff);
  }
}

function buildWhere(params: DeviceQuery, now: Date): SQL | undefined {
  const clauses: (SQL | undefined)[] = [];

  if (params.search) {
    const term = `%${params.search}%`;
    clauses.push(
      or(
        ilike(schema.device.name, term),
        ilike(schema.device.brand, term),
        ilike(schema.device.model, term),
        ilike(schema.device.serialNumber, term)
      )
    );
  }
  if (params.brand) clauses.push(eq(schema.device.brand, params.brand));
  if (params.category) clauses.push(eq(schema.device.category, params.category));
  if (params.status) clauses.push(statusFilter(params.status, now));

  const defined = clauses.filter((c): c is SQL => Boolean(c));
  return defined.length ? and(...defined) : undefined;
}

const sortColumns = {
  createdAt: schema.device.createdAt,
  name: schema.device.name,
  brand: schema.device.brand,
  purchaseDate: schema.device.purchaseDate,
  warrantyExpiry: schema.device.warrantyExpiry,
  // "status" maps to expiry order — sorting by soonest-to-expire is the useful behaviour.
  status: schema.device.warrantyExpiry,
} as const;

/**
 * The data-handling pipeline: search → filter → sort → paginate, all executed
 * in the database. Returns the page of rows plus pagination metadata.
 */
export async function listDevices(params: DeviceQuery): Promise<{
  data: DeviceListItem[];
  meta: PageMeta;
}> {
  const now = new Date();
  const where = buildWhere(params, now);

  const dir = params.order === "desc" ? desc : asc;
  const orderBy = dir(sortColumns[params.sort]);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.device)
    .where(where);

  const rows = await db
    .select()
    .from(schema.device)
    .where(where)
    .orderBy(orderBy, asc(schema.device.id))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  return {
    data: rows.map((r) => ({ ...r, status: getWarrantyStatus(r.warrantyExpiry, now) })),
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    },
  };
}

export async function getDeviceById(id: string) {
  const found = await db.query.device.findFirst({
    where: eq(schema.device.id, id),
    with: {
      timeline: {
        orderBy: (t, { asc: a }) => [a(t.date)],
      },
    },
  });
  if (!found) return null;
  // Resolve the stored card image (if any) to a loadable URL for the detail view.
  const warrantyCardUrl = found.warrantyCardKey
    ? await getCardUrl(found.warrantyCardKey)
    : null;
  return {
    ...found,
    warrantyCardUrl,
    status: getWarrantyStatus(found.warrantyExpiry),
  };
}

export async function updateDeviceNotes(id: string, notes: string) {
  const [updated] = await db
    .update(schema.device)
    .set({ notes })
    .where(eq(schema.device.id, id))
    .returning();
  return updated ?? null;
}

/** Adds `months` calendar months to a date (used to derive warranty expiry). */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Create a device. Derives `warrantyExpiry` from purchaseDate + warrantyMonths
 * (single source of truth) and seeds an initial "purchase" timeline event.
 */
export async function createDevice(input: CreateDevice) {
  const warrantyExpiry = addMonths(input.purchaseDate, input.warrantyMonths);

  const [created] = await db
    .insert(schema.device)
    .values({ ...input, warrantyExpiry })
    .returning();

  await db.insert(schema.warrantyEvent).values({
    deviceId: created.id,
    date: created.purchaseDate,
    type: "purchase",
    title: "Device purchased",
    description: "Purchase recorded and added to tracker.",
  });

  return { ...created, status: getWarrantyStatus(created.warrantyExpiry) };
}

/**
 * Update a device. Recomputes `warrantyExpiry` whenever purchaseDate or
 * warrantyMonths change, falling back to the existing row for the field that
 * wasn't supplied. Returns null if the device doesn't exist.
 */
export async function updateDevice(id: string, input: UpdateDevice) {
  const existing = await db.query.device.findFirst({
    where: eq(schema.device.id, id),
  });
  if (!existing) return null;

  const patch: Partial<typeof schema.device.$inferInsert> = { ...input };

  if (input.purchaseDate !== undefined || input.warrantyMonths !== undefined) {
    const purchaseDate = input.purchaseDate ?? existing.purchaseDate;
    const warrantyMonths = input.warrantyMonths ?? existing.warrantyMonths;
    patch.warrantyExpiry = addMonths(purchaseDate, warrantyMonths);
  }

  const [updated] = await db
    .update(schema.device)
    .set(patch)
    .where(eq(schema.device.id, id))
    .returning();

  return { ...updated, status: getWarrantyStatus(updated.warrantyExpiry) };
}

/** Delete a device (its warranty events cascade). Returns null if not found. */
export async function deleteDevice(id: string) {
  const [deleted] = await db
    .delete(schema.device)
    .where(eq(schema.device.id, id))
    .returning();
  return deleted ?? null;
}

/** Dashboard summary metrics, computed in a single pass over the dataset. */
export async function getDeviceStats() {
  const rows = await db
    .select({ warrantyExpiry: schema.device.warrantyExpiry })
    .from(schema.device);

  const now = new Date();
  const stats = { total: rows.length, active: 0, expiring_soon: 0, expired: 0 };
  for (const r of rows) {
    stats[getWarrantyStatus(r.warrantyExpiry, now)] += 1;
  }
  return stats;
}

/** Distinct brands and categories powering the filter dropdowns. */
export async function getDeviceMeta() {
  const brandRows = await db
    .selectDistinct({ brand: schema.device.brand })
    .from(schema.device)
    .orderBy(asc(schema.device.brand));
  const categoryRows = await db
    .selectDistinct({ category: schema.device.category })
    .from(schema.device)
    .orderBy(asc(schema.device.category));

  return {
    brands: brandRows.map((r) => r.brand),
    categories: categoryRows.map((r) => r.category),
  };
}
