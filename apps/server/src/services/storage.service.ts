import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../env";

/**
 * Cloudflare R2 is S3-compatible, so we talk to it with the AWS S3 client
 * pointed at the account's R2 endpoint. Used to persist the original warranty
 * card / receipt image a user scanned when adding a device.
 */
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/** Maps a few common image content types to a file extension for the object key. */
function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

/**
 * Uploads a scanned warranty card image to R2 and returns its object key.
 * The key (not a URL) is what we persist on the device row — URLs are derived
 * on read via `getCardUrl`.
 */
export async function uploadWarrantyCard(
  bytes: Uint8Array,
  contentType: string
): Promise<string> {
  const key = `warranty-cards/${randomUUID()}.${extensionFor(contentType)}`;
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    })
  );
  return key;
}

/**
 * Resolves a stored object key to a URL the client can load. Prefers the public
 * bucket / custom-domain base URL when configured; otherwise returns a
 * short-lived presigned GET URL.
 */
export async function getCardUrl(key: string): Promise<string> {
  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
    { expiresIn: 60 * 60 } // 1 hour
  );
}
