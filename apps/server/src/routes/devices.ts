import { zValidator } from "@hono/zod-validator";
import {
  createDeviceSchema,
  deviceQuerySchema,
  updateDeviceSchema,
  updateNotesSchema,
} from "@repo/validators";
import { Hono } from "hono";
import { type HonoAppContext } from "../auth";
import {
  createDevice,
  deleteDevice,
  getDeviceById,
  listDevices,
  updateDevice,
  updateDeviceNotes,
} from "../services/devices.service";
import { extractWarrantyFields } from "../services/ocr.service";
import { uploadWarrantyCard } from "../services/storage.service";
import { withAuth } from "../middlewares/auth.middleware";

/** Hard cap on the uploaded scan image (bytes) — keeps OCR cost & latency sane. */
const MAX_SCAN_BYTES = 15 * 1024 * 1024; // 15 MB

export const devices = new Hono<HonoAppContext>()
  // List with search / filter / sort / pagination
  .get("/", withAuth, zValidator("query", deviceQuerySchema), async (c) => {
    const params = c.req.valid("query");
    const result = await listDevices(params);
    // Always set the status code so the client infers the response type correctly.
    return c.json(result, 200);
  })
  // Single device profile incl. warranty timeline
  .get("/:id", withAuth, async (c) => {
    const { id } = c.req.param();
    const device = await getDeviceById(id);
    if (!device) {
      return c.json({ message: "Device not found" }, 404);
    }
    return c.json(device, 200);
  })
  // Update the free-text notes for a device
  .patch(
    "/:id/notes",
    withAuth,
    zValidator("json", updateNotesSchema),
    async (c) => {
      const { id } = c.req.param();
      const { notes } = c.req.valid("json");
      const updated = await updateDeviceNotes(id, notes);
      if (!updated) {
        return c.json({ message: "Device not found" }, 404);
      }
      return c.json(updated, 200);
    }
  )
  // Scan a warranty card / receipt photo: store the image in R2 and extract
  // device fields with OCR. Returns the object key plus whatever fields the
  // vision model could read, for the client to prefill the create form.
  .post("/scan", withAuth, async (c) => {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) {
      return c.json({ message: "Expected an image file under 'file'." }, 400);
    }
    if (!file.type.startsWith("image/")) {
      return c.json({ message: "File must be an image." }, 400);
    }
    if (file.size > MAX_SCAN_BYTES) {
      return c.json({ message: "Image is too large (max 15MB)." }, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Persist the original first so the image is saved even if OCR fails.
    const key = await uploadWarrantyCard(bytes, file.type);
    const extracted = await extractWarrantyFields(
      Buffer.from(bytes).toString("base64"),
      file.type
    );

    return c.json({ key, extracted }, 200);
  })
  // Attach a warranty document (card / receipt) without OCR: store it in R2 and
  // return the object key for the create form's Documents step. Accepts images
  // and PDFs.
  .post("/upload", withAuth, async (c) => {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) {
      return c.json({ message: "Expected a file under 'file'." }, 400);
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      return c.json({ message: "File must be an image or PDF." }, 400);
    }
    if (file.size > MAX_SCAN_BYTES) {
      return c.json({ message: "File is too large (max 15MB)." }, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const key = await uploadWarrantyCard(bytes, file.type);
    return c.json({ key }, 200);
  })
  // Create a device
  .post("/", withAuth, zValidator("json", createDeviceSchema), async (c) => {
    const created = await createDevice(c.req.valid("json"));
    // 200 (not 201) so createHonoMutationOptions infers the response body.
    return c.json(created, 200);
  })
  // Update a device (partial)
  .patch("/:id", withAuth, zValidator("json", updateDeviceSchema), async (c) => {
    const { id } = c.req.param();
    const updated = await updateDevice(id, c.req.valid("json"));
    if (!updated) {
      return c.json({ message: "Device not found" }, 404);
    }
    return c.json(updated, 200);
  })
  // Delete a device
  .delete("/:id", withAuth, async (c) => {
    const { id } = c.req.param();
    const deleted = await deleteDevice(id);
    if (!deleted) {
      return c.json({ message: "Device not found" }, 404);
    }
    return c.json(deleted, 200);
  });
