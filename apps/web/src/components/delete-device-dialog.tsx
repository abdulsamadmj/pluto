import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/alert-dialog";
import { toast } from "@repo/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { deleteDeviceMutationOptions } from "../queries/devices.queries";

/**
 * Warning dialog that deletes a device. Wrap the trigger element as children.
 * On confirm: DELETE, invalidate, toast, and (by default) navigate to the
 * dashboard.
 */
export function DeleteDeviceDialog({
  id,
  deviceName,
  children,
  navigateAfter = true,
}: {
  id: string;
  deviceName: string;
  children: ReactNode;
  navigateAfter?: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation(
    deleteDeviceMutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
        toast.success("Device deleted");
        if (navigateAfter) navigate({ to: "/dashboard" });
      },
      onError: () => toast.error("Could not delete device"),
    })
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this device?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-zinc-200">{deviceName}</span> and its
            warranty history will be permanently removed. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate({ param: { id } });
            }}
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
