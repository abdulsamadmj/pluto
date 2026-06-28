import { z } from "zod";

/** Notification kinds — currently warranty-derived alerts. */
export const notificationTypes = ["expiring_soon", "expired"] as const;
export type NotificationType = (typeof notificationTypes)[number];

/** Query contract for `GET /notifications`. */
export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
