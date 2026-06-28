import {
  CaretSortIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { Button } from "@repo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { Input } from "@repo/ui/input";
import {
  deviceQuerySchema,
  type DeviceSortField,
  type WarrantyStatus,
} from "@repo/validators";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Package,
  PackageOpen,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { AppShell } from "../components/app-shell";
import { CreateDeviceSheet } from "../components/create-device-sheet";
import { DeleteDeviceDialog } from "../components/delete-device-dialog";
import { DeviceGrid } from "../components/device-grid";
import { StatusBadge } from "../components/status-badge";
import { ViewToggle } from "../components/view-toggle";
import { requireAuth } from "../lib/guard";
import { formatDate } from "../lib/format";
import {
  deviceMetaQueryOptions,
  devicesQueryOptions,
  statsQueryOptions,
} from "../queries/devices.queries";

// Web-local search schema: the device query contract + a client-only `view`
// toggle (the API never sees `view`). Persisted in the URL so the chosen
// layout survives refresh and is shareable.
const dashboardSearchSchema = deviceQuerySchema.extend({
  view: z.enum(["table", "grid"]).default("table"),
});

export const Route = createFileRoute("/dashboard")({
  validateSearch: dashboardSearchSchema,
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400">
            Manage your devices and keep an eye on warranty coverage.
          </p>
        </div>
        <CreateDeviceSheet />
      </div>
      <MetricCards />
      <DeviceTable />
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Metric cards
// ---------------------------------------------------------------------------
function MetricCards() {
  const { data, isPending } = useQuery(statsQueryOptions());

  const cards = [
    { label: "Total Devices", value: data?.total, accent: "text-zinc-100", icon: Package, iconColor: "text-zinc-400" },
    { label: "Active Warranties", value: data?.active, accent: "text-emerald-400", icon: ShieldCheck, iconColor: "text-emerald-400" },
    { label: "Expiring Soon", value: data?.expiring_soon, accent: "text-amber-400", icon: ShieldAlert, iconColor: "text-amber-400" },
    { label: "Expired", value: data?.expired, accent: "text-red-400", icon: ShieldX, iconColor: "text-red-400" },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-white/10 bg-[#202020]/40 p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{c.label}</p>
            <c.icon className={`size-5 ${c.iconColor}`} />
          </div>
          {isPending ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className={`mt-2 text-3xl font-bold ${c.accent}`}>{c.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Device table with search / filter / sort / pagination
// ---------------------------------------------------------------------------
const ALL = "__all__";

const columns: { key: DeviceSortField; label: string }[] = [
  { key: "name", label: "Device Name" },
  { key: "brand", label: "Brand" },
  { key: "purchaseDate", label: "Purchase Date" },
  { key: "warrantyExpiry", label: "Warranty Expiry" },
  { key: "status", label: "Status" },
];

function DeviceTable() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  // Build the typed query argument (the Hono RPC client expects string params).
  const query = {
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.brand ? { brand: params.brand } : {}),
    ...(params.category ? { category: params.category } : {}),
    sort: params.sort,
    order: params.order,
    page: String(params.page),
    pageSize: String(params.pageSize),
  };

  const { data, isPending, isError } = useQuery(
    devicesQueryOptions({ query })
  );
  const { data: meta } = useQuery(deviceMetaQueryOptions());

  // Debounced search input.
  const [searchInput, setSearchInput] = useState(params.search ?? "");
  useEffect(() => {
    setSearchInput(params.search ?? "");
  }, [params.search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== (params.search ?? "")) {
        navigate({
          search: (p) => ({ ...p, search: searchInput || undefined, page: 1 }),
        });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSort = (key: DeviceSortField) => {
    navigate({
      search: (p) => ({
        ...p,
        sort: key,
        order: p.sort === key && p.order === "asc" ? "desc" : "asc",
        page: 1,
      }),
    });
  };

  const setFilter = (
    field: "status" | "brand" | "category",
    value: string | undefined
  ) => {
    navigate({ search: (p) => ({ ...p, [field]: value, page: 1 }) });
  };

  const setPage = (page: number) => {
    navigate({ search: (p) => ({ ...p, page }) });
  };

  const clearFilters = () => {
    navigate({
      search: () => ({ sort: "warrantyExpiry", order: "asc", page: 1, pageSize: params.pageSize }),
    });
  };

  const hasFilters = Boolean(
    params.search || params.status || params.brand || params.category
  );

  return (
    <div className="rounded-xl border border-white/10 bg-[#202020]/40">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/5 p-4 lg:flex-row lg:items-center">
        <Input
          placeholder="Search name, brand, model, serial…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="lg:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            placeholder="All statuses"
            value={params.status}
            onChange={(v) => setFilter("status", v as WarrantyStatus | undefined)}
            options={[
              { value: "active", label: "Active" },
              { value: "expiring_soon", label: "Expiring soon" },
              { value: "expired", label: "Expired" },
            ]}
          />
          <FilterSelect
            placeholder="All brands"
            value={params.brand}
            onChange={(v) => setFilter("brand", v)}
            options={(meta?.brands ?? []).map((b) => ({ value: b, label: b }))}
          />
          <FilterSelect
            placeholder="All categories"
            value={params.category}
            onChange={(v) => setFilter("category", v)}
            options={(meta?.categories ?? []).map((c) => ({ value: c, label: c }))}
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
        <div className="lg:ml-auto">
          <ViewToggle
            value={params.view}
            onChange={(view) => navigate({ search: (p) => ({ ...p, view }) })}
          />
        </div>
      </div>

      {/* Body: table or grid */}
      {params.view === "grid" ? (
        <div className="p-4">
          {isPending ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: Math.min(params.pageSize, 6) }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-12 text-center text-red-400">
              Failed to load devices. Please try again.
            </p>
          ) : data && data.data.length > 0 ? (
            <DeviceGrid devices={data.data} />
          ) : (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          )}
        </div>
      ) : (
      /* Table */
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <button
                  type="button"
                  onClick={() => setSort(col.key)}
                  className="flex items-center gap-1 hover:text-white"
                >
                  {col.label}
                  <SortIndicator
                    active={params.sort === col.key}
                    order={params.order}
                  />
                </button>
              </TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <LoadingRows pageSize={params.pageSize} />
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-red-400">
                Failed to load devices. Please try again.
              </TableCell>
            </TableRow>
          ) : data && data.data.length > 0 ? (
            data.data.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Link
                    to="/devices/$id"
                    params={{ id: d.id }}
                    className="font-medium hover:text-primary"
                  >
                    {d.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{d.category}</p>
                </TableCell>
                <TableCell className="text-zinc-300">{d.brand}</TableCell>
                <TableCell className="text-zinc-300">
                  {formatDate(d.purchaseDate)}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {formatDate(d.warrantyExpiry)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/devices/$id" params={{ id: d.id }}>
                        View
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
                    <DeleteDeviceDialog
                      id={d.id}
                      deviceName={d.name}
                      navigateAfter={false}
                    >
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
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      )}

      {/* Pagination */}
      {data && data.meta.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/5 p-4 text-sm text-zinc-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <span className="text-zinc-200">
                {(data.meta.page - 1) * data.meta.pageSize + 1}–
                {Math.min(
                  data.meta.page * data.meta.pageSize,
                  data.meta.total
                )}
              </span>{" "}
              of <span className="text-zinc-200">{data.meta.total}</span>
            </span>
            <Select
              value={String(params.pageSize)}
              onValueChange={(v) =>
                navigate({
                  search: (p) => ({ ...p, pageSize: Number(v), page: 1 }),
                })
              }
            >
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.page <= 1}
              onClick={() => setPage(data.meta.page - 1)}
            >
              Previous
            </Button>
            <span className="px-2">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.page >= data.meta.totalPages}
              onClick={() => setPage(data.meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? undefined : v)}
    >
      <SelectTrigger className="h-9 w-[160px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortIndicator({
  active,
  order,
}: {
  active: boolean;
  order: "asc" | "desc";
}) {
  if (!active)
    return <CaretSortIcon className="size-4 text-zinc-600" aria-hidden />;
  return order === "asc" ? (
    <ChevronUpIcon className="size-4 text-primary" aria-hidden />
  ) : (
    <ChevronDownIcon className="size-4 text-primary" aria-hidden />
  );
}

function LoadingRows({ pageSize }: { pageSize: number }) {
  return (
    <>
      {Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full max-w-[140px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <PackageOpen className="size-10 text-zinc-600" />
      <div>
        <p className="font-medium text-zinc-200">
          {hasFilters ? "No devices match your filters" : "No devices yet"}
        </p>
        <p className="text-sm text-zinc-500">
          {hasFilters
            ? "Try adjusting or clearing your filters."
            : "Seed the database to get started."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
