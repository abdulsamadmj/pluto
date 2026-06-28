import {
  createHonoMutationOptions,
  createHonoQueryOptions,
} from "@reno-stack/hono-react-query";
import { client } from "../lib/hono-client";

/**
 * Typed query/mutation options for the devices API — identical pattern to the
 * web app, sharing the exact same Hono RPC endpoints and inferred types.
 */

export const devicesQueryOptions = createHonoQueryOptions(
  ({ query }) => ["devices", "list", JSON.stringify(query)],
  client.devices.$get
);

export const deviceByIdQueryOptions = createHonoQueryOptions(
  ({ param: { id } }) => ["devices", "detail", id],
  client.devices[":id"].$get
);

export const statsQueryOptions = createHonoQueryOptions(
  ["devices", "stats"],
  client.stats.$get
);

export const deviceMetaQueryOptions = createHonoQueryOptions(
  ["devices", "meta"],
  client.stats.meta.$get
);

export const createDeviceMutationOptions = createHonoMutationOptions(
  client.devices.$post
);

export const updateDeviceMutationOptions = createHonoMutationOptions(
  client.devices[":id"].$patch
);

export const deleteDeviceMutationOptions = createHonoMutationOptions(
  client.devices[":id"].$delete
);
