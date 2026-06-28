import { Button } from "@repo/ui/button";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { InferResponseType } from "hono/client";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { DeleteDeviceDialog } from "./delete-device-dialog";
import { StatusBadge } from "./status-badge";
import { formatCurrency, formatDate, formatTimeLeft } from "../lib/format";
import { categoryIcon } from "../lib/icons";
import { client } from "../utils/hono-client";

type DeviceListItem = InferResponseType<
  typeof client.devices.$get,
  200
>["data"][number];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

export function DeviceGrid({ devices }: { devices: DeviceListItem[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {devices.map((d) => (
        <DeviceCard key={d.id} device={d} />
      ))}
    </motion.div>
  );
}

function DeviceCard({ device: d }: { device: DeviceListItem }) {
  const Icon = categoryIcon(d.category);
  return (
    <motion.div
      variants={item}
      className="group flex flex-col rounded-xl border border-white/10 bg-zinc-900/40 p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-300">
          <Icon className="size-5" />
        </div>
        <StatusBadge status={d.status} />
      </div>

      <Link
        to="/devices/$id"
        params={{ id: d.id }}
        className="mt-4 block"
      >
        <h3 className="font-semibold leading-tight hover:text-primary">{d.name}</h3>
        <p className="text-sm text-zinc-500">
          {d.brand} · {d.model}
        </p>
      </Link>

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-zinc-500">Purchased</dt>
        <dd className="text-right text-zinc-300">{formatDate(d.purchaseDate)}</dd>
        <dt className="text-zinc-500">Expires</dt>
        <dd className="text-right text-zinc-300">{formatDate(d.warrantyExpiry)}</dd>
        <dt className="text-zinc-500">Price</dt>
        <dd className="text-right text-zinc-300">{formatCurrency(d.purchasePrice)}</dd>
      </dl>

      <p className="mt-3 text-xs text-zinc-500">{formatTimeLeft(d.warrantyExpiry)}</p>

      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/devices/$id" params={{ id: d.id }}>
            <Eye className="size-4" /> View
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link
            to="/devices/$id/edit"
            params={{ id: d.id }}
            aria-label={`Edit ${d.name}`}
          >
            <Pencil className="size-4" />
          </Link>
        </Button>
        <DeleteDeviceDialog id={d.id} deviceName={d.name} navigateAfter={false}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-400 hover:text-red-300"
            aria-label={`Delete ${d.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </DeleteDeviceDialog>
      </div>
    </motion.div>
  );
}
