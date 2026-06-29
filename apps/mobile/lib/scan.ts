import { type ScanResult } from "@repo/validators";
import { authClient } from "./auth-client";
import { SERVER_URL } from "./env";

/**
 * Uploads a picked/captured warranty-card image to `POST /devices/scan` for OCR.
 * Uses a multipart `FormData` (React Native accepts a `{ uri, name, type }`
 * file part) and attaches the session cookie the same way the RPC client does.
 * Returns the stored R2 object key plus whatever fields the model extracted.
 */
export async function scanWarrantyCard(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<ScanResult> {
  const type = asset.mimeType ?? "image/jpeg";
  const name = asset.fileName ?? `warranty-card.${type.split("/")[1] ?? "jpg"}`;

  const formData = new FormData();
  // RN's FormData understands this file-part shape for local file URIs.
  formData.append("file", { uri: asset.uri, name, type } as unknown as Blob);

  const cookie = authClient.getCookie();
  const res = await fetch(`${SERVER_URL}/devices/scan`, {
    method: "POST",
    body: formData,
    headers: cookie ? { Cookie: cookie } : {},
  });
  if (!res.ok) {
    throw new Error(`Scan failed (${res.status})`);
  }
  return (await res.json()) as ScanResult;
}

/**
 * Attaches a warranty document image to R2 without OCR via `POST /devices/upload`.
 * Returns the stored object key to submit with the device.
 */
export async function uploadDocument(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<{ key: string }> {
  const type = asset.mimeType ?? "image/jpeg";
  const name = asset.fileName ?? `warranty-doc.${type.split("/")[1] ?? "jpg"}`;

  const formData = new FormData();
  formData.append("file", { uri: asset.uri, name, type } as unknown as Blob);

  const cookie = authClient.getCookie();
  const res = await fetch(`${SERVER_URL}/devices/upload`, {
    method: "POST",
    body: formData,
    headers: cookie ? { Cookie: cookie } : {},
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  return (await res.json()) as { key: string };
}
