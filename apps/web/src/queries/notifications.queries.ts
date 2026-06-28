import {
  createHonoMutationOptions,
  createHonoQueryOptions,
} from "@reno-stack/hono-react-query";
import { client } from "../utils/hono-client";

/**
 * Typed query/mutation options for the notifications API. Bound to the Hono RPC
 * endpoints, so params and response types are inferred end-to-end.
 */

// List the current user's warranty alerts (+ unread count).
export const notificationsQueryOptions = createHonoQueryOptions(
  ({ query }) => ["notifications", "list", JSON.stringify(query ?? {})],
  client.notifications.$get
);

// Mark a single notification as read.
export const markNotificationReadMutationOptions = createHonoMutationOptions(
  client.notifications[":id"].read.$patch
);

// Mark every notification as read.
export const markAllNotificationsReadMutationOptions = createHonoMutationOptions(
  client.notifications["read-all"].$post
);
