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
import { withAuth } from "../middlewares/auth.middleware";

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
