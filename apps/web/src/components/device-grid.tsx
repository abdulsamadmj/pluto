import { Link } from "@tanstack/react-router";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { InferResponseType } from "hono/client";
import { Pencil, Trash2 } from "lucide-react";
import type { PointerEvent } from "react";
import type { WarrantyStatus } from "@repo/validators";
import { DeleteDeviceDialog } from "./delete-device-dialog";
import { autoGradient, resolveTheme, themeClass } from "../lib/card-themes";
import { formatCurrency, formatTimeLeft, statusLabels } from "../lib/format";
import { categoryIcon } from "../lib/icons";
import { client } from "../utils/hono-client";

type DeviceListItem = InferResponseType<
  typeof client.devices.$get,
  200
>["data"][number];

/** Status accent for the badge dot — readable on any themed card. */
const statusDot: Record<WarrantyStatus, string> = {
  active: "bg-emerald-300",
  expiring_soon: "bg-amber-200",
  expired: "bg-red-300",
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function DeviceGrid({ devices }: { devices: DeviceListItem[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {devices.map((d) => (
        <WarrantyCard key={d.id} device={d} />
      ))}
    </motion.div>
  );
}

function WarrantyCard({ device: d }: { device: DeviceListItem }) {
  const Icon = categoryIcon(d.category);
  const theme = resolveTheme(d.cardTheme);
  const autoBg = theme === "auto" ? autoGradient(d.id) : undefined;

  // Pointer-driven 3D tilt + tracking shine.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [9, -9]), {
    stiffness: 180,
    damping: 16,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-12, 12]), {
    stiffness: 180,
    damping: 16,
  });
  const shineX = useTransform(px, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(py, [0, 1], ["0%", "100%"]);
  const shine = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.35), transparent 45%)`;

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div variants={item} style={{ perspective: 1200 }}>
      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", background: autoBg }}
        whileHover={{ scale: 1.025 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`group relative aspect-[1.6] w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/15 ${themeClass(theme)}`}
      >
        {/* Texture: soft diagonal gloss + corner bloom */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10" />
        <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10 blur-2xl" />
        {/* Lit top edge — separates the card from a dark background / neighbours */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />

        {/* Pointer-tracking shine */}
        <motion.div
          style={{ background: shine }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Category watermark */}
        <Icon className="pointer-events-none absolute -bottom-6 -right-4 size-40 text-white/10" />

        {/* Whole card → detail */}
        <Link
          to="/devices/$id"
          params={{ id: d.id }}
          className="absolute inset-0 flex flex-col p-5 text-white"
          style={{ transform: "translateZ(40px)" }}
        >
          {/* Top: brand mark + status */}
          <div className="flex items-start justify-between">
            <div className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
              <Icon className="size-5 text-white" />
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0">
              <span className={`size-1.5 rounded-full ${statusDot[d.status]}`} />
              {statusLabels[d.status]}
            </span>
          </div>

          {/* Issuer + holder */}
          <div className="mt-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
              Warranty{d.warrantyProvider ? ` · ${d.warrantyProvider}` : ""}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold leading-tight tracking-wide">
              {d.name}
            </h3>
            <p className="truncate text-xs text-white/70">
              {d.brand} · {d.model}
            </p>
            <p className="mt-1 truncate font-mono text-[11px] tracking-wider text-white/55">
              S/N {d.serialNumber}
            </p>
          </div>

          {/* Footer: price + time left */}
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-[11px] text-white/75">
            <span>{formatCurrency(d.purchasePrice)}</span>
            <span>{formatTimeLeft(d.warrantyExpiry)}</span>
          </div>
        </Link>

        {/* Hover actions (above the link layer) */}
        <div
          className="absolute right-3 top-3 z-10 flex translate-y-1 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          style={{ transform: "translateZ(60px)" }}
        >
          <Link
            to="/devices/$id/edit"
            params={{ id: d.id }}
            aria-label={`Edit ${d.name}`}
            className="grid size-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <Pencil className="size-3.5" />
          </Link>
          <DeleteDeviceDialog id={d.id} deviceName={d.name} navigateAfter={false}>
            <button
              aria-label={`Delete ${d.name}`}
              className="grid size-8 place-items-center rounded-full bg-black/40 text-red-300 backdrop-blur-sm transition-colors hover:bg-red-500/70 hover:text-white"
            >
              <Trash2 className="size-3.5" />
            </button>
          </DeleteDeviceDialog>
        </div>
      </motion.div>
    </motion.div>
  );
}
