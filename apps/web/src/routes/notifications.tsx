import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellOff, CheckCheck, ShieldAlert, ShieldX } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { requireAuth } from "../lib/guard";
import { timeAgo } from "../lib/format";
import {
  markAllNotificationsReadMutationOptions,
  markNotificationReadMutationOptions,
  notificationsQueryOptions,
} from "../queries/notifications.queries";

const LIST_QUERY = { query: { pageSize: "50" } } as const;

export const Route = createFileRoute("/notifications")({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(
    notificationsQueryOptions(LIST_QUERY)
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation(
    markNotificationReadMutationOptions({ onSuccess: invalidate })
  );
  const markAll = useMutation(
    markAllNotificationsReadMutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("All caught up");
      },
    })
  );

  const onRowClick = (id: string, read: boolean, deviceId: string | null) => {
    if (!read) markRead.mutate({ param: { id } });
    if (deviceId) navigate({ to: "/devices/$id", params: { id: deviceId } });
  };

  const unread = data?.meta.unread ?? 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-zinc-400">
            Warranty alerts for devices expiring soon or recently expired.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate({})}
        >
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {isPending ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : isError ? (
          <p className="py-16 text-center text-red-400">
            Failed to load notifications. Please try again.
          </p>
        ) : data && data.data.length > 0 ? (
          data.data.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onRowClick(n.id, n.read, n.deviceId)}
              className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
                n.read
                  ? "border-white/10 bg-[#202020]/40 hover:bg-[#202020]/70"
                  : "border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08]"
              }`}
            >
              <NotificationIcon type={n.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-100">{n.title}</p>
                  {!n.read && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                {n.body && (
                  <p className="mt-0.5 truncate text-sm text-zinc-400">
                    {n.body}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-zinc-500">
                {timeAgo(n.createdAt)}
              </span>
            </button>
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </AppShell>
  );
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "expired") {
    return (
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-red-500/10">
        <ShieldX className="size-5 text-red-400" />
      </div>
    );
  }
  return (
    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-500/10">
      <ShieldAlert className="size-5 text-amber-400" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <BellOff className="size-10 text-zinc-600" />
      <div>
        <p className="font-medium text-zinc-200">You&apos;re all caught up</p>
        <p className="text-sm text-zinc-500">
          No warranty alerts right now — we&apos;ll let you know when something
          needs attention.
        </p>
      </div>
    </div>
  );
}
