import { Hono } from "hono";
import { type HonoAppContext } from "../auth";
import { getDeviceMeta, getDeviceStats } from "../services/devices.service";
import { withAuth } from "../middlewares/auth.middleware";

export const stats = new Hono<HonoAppContext>()
  // Dashboard summary metric cards
  .get("/", withAuth, async (c) => {
    const data = await getDeviceStats();
    return c.json(data, 200);
  })
  // Distinct brands & categories for the filter dropdowns
  .get("/meta", withAuth, async (c) => {
    const data = await getDeviceMeta();
    return c.json(data, 200);
  });
