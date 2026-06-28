import {
  daysUntil,
  EXPIRING_SOON_DAYS,
  getWarrantyStatus,
  type NotificationQuery,
} from "@repo/validators";
import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";

const RECENT_EXPIRED_DAYS = 90; // only surface recently-expired devices

/**
 * Idempotently generate the user's warranty notifications from the (global)
 * device set: devices expiring within 30 days or expired within the last 90.
 * Dedup by (userId, deviceId, type) so read state persists and nothing repeats.
 */
async function ensureNotifications(userId: string): Promise<void> {
  const now = new Date();
  const soonCutoff = new Date(now);
  soonCutoff.setDate(soonCutoff.getDate() + EXPIRING_SOON_DAYS);
  const oldCutoff = new Date(now);
  oldCutoff.setDate(oldCutoff.getDate() - RECENT_EXPIRED_DAYS);

  const devices = await db
    .select({
      id: schema.device.id,
      name: schema.device.name,
      warrantyExpiry: schema.device.warrantyExpiry,
    })
    .from(schema.device)
    .where(
      and(
        gte(schema.device.warrantyExpiry, oldCutoff),
        lte(schema.device.warrantyExpiry, soonCutoff)
      )
    );
  if (devices.length === 0) return;

  const existing = await db
    .select({
      deviceId: schema.notification.deviceId,
      type: schema.notification.type,
    })
    .from(schema.notification)
    .where(eq(schema.notification.userId, userId));
  const seen = new Set(existing.map((e) => `${e.deviceId}:${e.type}`));

  const toInsert: (typeof schema.notification.$inferInsert)[] = [];
  for (const d of devices) {
    const type = getWarrantyStatus(d.warrantyExpiry, now);
    if (type === "active") continue;
    if (seen.has(`${d.id}:${type}`)) continue;
    const days = daysUntil(d.warrantyExpiry, now);
    toInsert.push({
      userId,
      deviceId: d.id,
      type,
      title: type === "expired" ? "Warranty expired" : "Warranty expiring soon",
      body:
        type === "expired"
          ? `${d.name} coverage has ended`
          : `${d.name} expires in ${days} day${days === 1 ? "" : "s"}`,
    });
  }
  if (toInsert.length) await db.insert(schema.notification).values(toInsert);
}

export async function listNotifications(
  userId: string,
  params: NotificationQuery
) {
  await ensureNotifications(userId);

  const where = eq(schema.notification.userId, userId);
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.notification)
    .where(where);
  const [{ value: unread }] = await db
    .select({ value: count() })
    .from(schema.notification)
    .where(and(where, eq(schema.notification.read, false)));

  const data = await db
    .select()
    .from(schema.notification)
    .where(where)
    // Unread first, then newest.
    .orderBy(asc(schema.notification.read), desc(schema.notification.createdAt))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  return {
    data,
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      unread,
    },
  };
}

export async function markNotificationRead(userId: string, id: string) {
  const [updated] = await db
    .update(schema.notification)
    .set({ read: true })
    .where(
      and(
        eq(schema.notification.id, id),
        eq(schema.notification.userId, userId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(schema.notification)
    .set({ read: true })
    .where(
      and(
        eq(schema.notification.userId, userId),
        eq(schema.notification.read, false)
      )
    );
  return { ok: true };
}
