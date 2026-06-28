import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { DeviceForm, toDateInput } from "../components/device-form";
import { requireAuth } from "../lib/guard";
import {
  deviceByIdQueryOptions,
  updateDeviceMutationOptions,
} from "../queries/devices.queries";

export const Route = createFileRoute("/devices/$id/edit")({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: EditDevicePage,
});

function EditDevicePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(
    deviceByIdQueryOptions({ param: { id } })
  );

  const mutation = useMutation(
    updateDeviceMutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
        toast.success("Device updated");
        navigate({ to: "/devices/$id", params: { id } });
      },
      onError: () => toast.error("Could not update device"),
    })
  );

  return (
    <AppShell>
      <Link
        to="/devices/$id"
        params={{ id }}
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Back to device
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Edit device</h1>

      <div className="max-w-2xl rounded-xl border border-white/10 bg-[#2b2b2b]/40 p-6">
        {isPending ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <p className="text-red-400">Device not found.</p>
        ) : (
          <DeviceForm
            defaultValues={{
              name: data.name,
              brand: data.brand,
              category: data.category,
              model: data.model,
              serialNumber: data.serialNumber,
              purchaseDate: toDateInput(data.purchaseDate),
              purchasePrice: data.purchasePrice,
              retailer: data.retailer,
              warrantyMonths: data.warrantyMonths,
              warrantyProvider: data.warrantyProvider,
              notes: data.notes ?? "",
            }}
            submitLabel="Save changes"
            isSubmitting={mutation.isPending}
            onCancel={() => navigate({ to: "/devices/$id", params: { id } })}
            onSubmit={(values) =>
              mutation.mutate({ param: { id }, json: values })
            }
          />
        )}
      </div>
    </AppShell>
  );
}
