import {
  createHonoMutationOptions,
  createHonoQueryOptions,
} from "@reno-stack/hono-react-query";
import { type ScanResult } from "@repo/validators";
import { client } from "../utils/hono-client";

/**
 * Typed query/mutation options for the devices API.
 *
 * Every option is bound to a Hono RPC endpoint, so the argument shape (query
 * params, route params, JSON body) and the response data type are inferred
 * end-to-end — no manual typing, no hand-written fetch client.
 */

// List with search / filter / sort / pagination. The query object becomes part
// of the React Query key, so each distinct param combination is cached.
export const devicesQueryOptions = createHonoQueryOptions(
  ({ query }) => ["devices", "list", JSON.stringify(query)],
  client.devices.$get
);

// Single device profile incl. warranty timeline.
export const deviceByIdQueryOptions = createHonoQueryOptions(
  ({ param: { id } }) => ["devices", "detail", id],
  client.devices[":id"].$get
);

// Dashboard summary metrics.
export const statsQueryOptions = createHonoQueryOptions(
  ["devices", "stats"],
  client.stats.$get
);

// Distinct brands & categories for the filter dropdowns.
export const deviceMetaQueryOptions = createHonoQueryOptions(
  ["devices", "meta"],
  client.stats.meta.$get
);

// Update a device's notes.
export const updateNotesMutationOptions = createHonoMutationOptions(
  client.devices[":id"].notes.$patch
);

// Create a device.
export const createDeviceMutationOptions = createHonoMutationOptions(
  client.devices.$post
);

// Update a device (full/partial).
export const updateDeviceMutationOptions = createHonoMutationOptions(
  client.devices[":id"].$patch
);

// Delete a device.
export const deleteDeviceMutationOptions = createHonoMutationOptions(
  client.devices[":id"].$delete
);

/**
 * Upload a warranty-card / receipt photo to `POST /devices/scan` for OCR.
 * This is multipart (not a JSON body), so it bypasses the RPC client and uses a
 * plain fetch — still sending the auth cookie via `credentials: "include"`.
 * Returns the stored R2 object key plus the fields the model extracted.
 */
export async function scanWarrantyCard(file: File): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/devices/scan`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Scan failed (${res.status})`);
  }
  return (await res.json()) as ScanResult;
}

/**
 * Attach a warranty document (image or PDF) to R2 without OCR, via
 * `POST /devices/upload`. Returns the stored object key to submit with the
 * device. Like `scanWarrantyCard`, this is multipart so it uses a plain fetch.
 */
export async function uploadDocument(file: File): Promise<{ key: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/devices/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  return (await res.json()) as { key: string };
}
