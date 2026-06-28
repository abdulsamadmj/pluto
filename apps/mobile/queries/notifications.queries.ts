import {
  createHonoMutationOptions,
  createHonoQueryOptions,
} from "@reno-stack/hono-react-query";
import { client } from "../lib/hono-client";

/**
 * Typed query/mutation options for the notifications API — same Hono RPC
 * endpoints and inferred types as the web app.
 */

export const notificationsQueryOptions = createHonoQueryOptions(
  ({ query }) => ["notifications", "list", JSON.stringify(query ?? {})],
  client.notifications.$get
);

export const markNotificationReadMutationOptions = createHonoMutationOptions(
  client.notifications[":id"].read.$patch
);

export const markAllNotificationsReadMutationOptions = createHonoMutationOptions(
  client.notifications["read-all"].$post
);
