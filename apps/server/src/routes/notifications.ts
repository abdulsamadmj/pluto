import { zValidator } from "@hono/zod-validator";
import { notificationQuerySchema } from "@repo/validators";
import { Hono } from "hono";
import { type HonoAppContext } from "../auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications.service";
import { withAuth } from "../middlewares/auth.middleware";

export const notifications = new Hono<HonoAppContext>()
  // List the current user's notifications (+ unread count), newest/unread first.
  .get("/", withAuth, zValidator("query", notificationQuerySchema), async (c) => {
    const user = c.get("user");
    const result = await listNotifications(user.id, c.req.valid("query"));
    return c.json(result, 200);
  })
  // Mark all of the user's notifications as read.
  .post("/read-all", withAuth, async (c) => {
    const user = c.get("user");
    await markAllNotificationsRead(user.id);
    return c.json({ ok: true }, 200);
  })
  // Mark a single notification as read.
  .patch("/:id/read", withAuth, async (c) => {
    const user = c.get("user");
    const { id } = c.req.param();
    const updated = await markNotificationRead(user.id, id);
    if (!updated) {
      return c.json({ message: "Notification not found" }, 404);
    }
    return c.json(updated, 200);
  });
