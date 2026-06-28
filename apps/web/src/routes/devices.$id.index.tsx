import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { Textarea } from "@repo/ui/textarea";
import { toast } from "@repo/ui/toast";
import { daysUntil } from "@repo/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { InferResponseType } from "hono/client";
import { ArrowLeft, Pencil, SearchX, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { DeleteDeviceDialog } from "../components/delete-device-dialog";
import { StatusBadge } from "../components/status-badge";
import { eventIcon } from "../lib/icons";
import {
  formatCurrency,
  formatDate,
  formatTimeLeft,
} from "../lib/format";
import { requireAuth } from "../lib/guard";
import { client } from "../utils/hono-client";
import {
  deviceByIdQueryOptions,
  updateNotesMutationOptions,
} from "../queries/devices.queries";

// The device-detail shape, inferred directly from the API's 200 response —
// fully end-to-end typed, no hand-written interface.
type DeviceDetail = InferResponseType<
  (typeof client.devices)[":id"]["$get"],
  200
>;

export const Route = createFileRoute("/devices/$id/")({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: DeviceDetailsPage,
});

function DeviceDetailsPage() {
  const { id } = Route.useParams();
  const { data, isPending, isError } = useQuery(
    deviceByIdQueryOptions({ param: { id } })
  );

  return (
    <AppShell>
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      {isPending ? (
        <DetailsSkeleton />
      ) : isError || !data ? (
        <NotFound />
      ) : (
        <DeviceProfile device={data} />
      )}
    </AppShell>
  );
}

function DeviceProfile({ device }: { device: DeviceDetail }) {
  const coverage = coverageProgress(device.purchaseDate, device.warrantyExpiry);
  const days = daysUntil(device.warrantyExpiry);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <StatusBadge status={device.status} />
          </div>
          <p className="mt-1 text-zinc-400">
            {device.brand} · {device.category} · {device.model}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/devices/$id/edit" params={{ id: device.id }}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
          <DeleteDeviceDialog id={device.id} deviceName={device.name}>
            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
              <Trash2 className="size-4" /> Delete
            </Button>
          </DeleteDeviceDialog>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Device & Brand">
          <Field label="Name" value={device.name} />
          <Field label="Brand" value={device.brand} />
          <Field label="Category" value={device.category} />
          <Field label="Model" value={device.model} />
          <Field label="Serial number" value={device.serialNumber} mono />
        </InfoCard>

        <InfoCard title="Purchase">
          <Field label="Purchase date" value={formatDate(device.purchaseDate)} />
          <Field label="Price" value={formatCurrency(device.purchasePrice)} />
          <Field label="Retailer" value={device.retailer} />
        </InfoCard>

        <InfoCard title="Warranty">
          <Field label="Provider" value={device.warrantyProvider} />
          <Field label="Coverage" value={`${device.warrantyMonths} months`} />
          <Field label="Expiry date" value={formatDate(device.warrantyExpiry)} />
        </InfoCard>
      </div>

      {/* Expiry highlight */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Warranty status</p>
            <p className="mt-1 text-2xl font-bold">
              {formatTimeLeft(device.warrantyExpiry)}
            </p>
          </div>
          <StatusBadge status={device.status} />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>{formatDate(device.purchaseDate)}</span>
            <span>
              {days >= 0 ? `${coverage}% of coverage used` : "Coverage ended"}
            </span>
            <span>{formatDate(device.warrantyExpiry)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${
                device.status === "expired"
                  ? "bg-red-500"
                  : device.status === "expiring_soon"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Timeline events={device.timeline ?? []} />
        <NotesSection id={device.id} initialNotes={device.notes ?? ""} />
      </div>
    </div>
  );
}

function coverageProgress(purchase: string, expiry: string): number {
  const start = new Date(purchase).getTime();
  const end = new Date(expiry).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`text-right text-zinc-200 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Timeline({
  events,
}: {
  events: { id: string; date: string; type: string; title: string; description?: string | null }[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Warranty timeline
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">No events recorded.</p>
      ) : (
        <ol className="relative ml-3 border-l border-white/10">
          {events.map((e) => {
            const Icon = eventIcon(e.type);
            return (
              <li key={e.id} className="mb-5 ml-6 last:mb-0">
                <span className="absolute -left-3 grid size-6 place-items-center rounded-full bg-zinc-800 text-zinc-300">
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm font-medium text-zinc-200">{e.title}</p>
                <p className="text-xs text-zinc-500">{formatDate(e.date)}</p>
                {e.description && (
                  <p className="mt-1 text-sm text-zinc-400">{e.description}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function NotesSection({
  id,
  initialNotes,
}: {
  id: string;
  initialNotes: string;
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes);
  useEffect(() => setNotes(initialNotes), [initialNotes]);

  const mutation = useMutation(
    updateNotesMutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: deviceByIdQueryOptions({ param: { id } }).queryKey,
        });
        toast.success("Notes saved");
      },
      onError: () => toast.error("Could not save notes"),
    })
  );

  const dirty = notes !== initialNotes;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Notes
      </h3>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this device — receipts, accessories, support tickets…"
        rows={6}
      />
      <div className="mt-3 flex justify-end gap-2">
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotes(initialNotes)}
            disabled={mutation.isPending}
          >
            Reset
          </Button>
        )}
        <Button
          size="sm"
          disabled={!dirty || mutation.isPending}
          onClick={() =>
            mutation.mutate({ param: { id }, json: { notes } })
          }
        >
          {mutation.isPending ? "Saving…" : "Save notes"}
        </Button>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <SearchX className="size-12 text-zinc-600" />
      <div>
        <p className="text-lg font-medium">Device not found</p>
        <p className="text-sm text-zinc-500">
          This device may have been removed or the link is invalid.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
