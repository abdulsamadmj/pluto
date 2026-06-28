import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export * from "./auth-schema";

/**
 * The core entity of the app. Devices are global demo data (not user-scoped)
 * so the seeded dataset is visible to any signed-in account out of the box.
 *
 * `warrantyExpiry` is stored (computed at write time from purchaseDate +
 * warrantyMonths) so the database can sort/filter on it directly. The
 * derived status (active / expiring_soon / expired) is computed from this
 * column by a shared helper in @repo/validators.
 */
export const device = pgTable("device", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  // Stored in whole currency units (AUD) to keep the demo simple.
  purchasePrice: integer("purchase_price").notNull(),
  retailer: text("retailer").notNull(),
  warrantyMonths: integer("warranty_months").notNull(),
  warrantyExpiry: timestamp("warranty_expiry").notNull(),
  warrantyProvider: text("warranty_provider").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Timeline entries for a device's warranty lifecycle: purchase, registration,
 * claims, repairs, extensions, and the eventual expiry.
 */
export const warrantyEvent = pgTable("warranty_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: uuid("device_id")
    .notNull()
    .references(() => device.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  // purchase | registered | claim | repair | extended | expired
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
});

export const deviceRelations = relations(device, ({ many }) => ({
  timeline: many(warrantyEvent),
}));

export const warrantyEventRelations = relations(warrantyEvent, ({ one }) => ({
  device: one(device, {
    fields: [warrantyEvent.deviceId],
    references: [device.id],
  }),
}));
