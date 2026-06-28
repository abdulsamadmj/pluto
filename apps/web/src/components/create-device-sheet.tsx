import { Button } from "@repo/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import { toast } from "@repo/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  DeviceForm,
  emptyDeviceForm,
} from "./device-form";
import { createDeviceMutationOptions } from "../queries/devices.queries";

export function CreateDeviceSheet() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation(
    createDeviceMutationOptions({
      onSuccess: async () => {
        // List keys embed the query string, so invalidate the whole "devices" tree.
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
        toast.success("Device added");
        setOpen(false);
      },
      onError: () => toast.error("Could not add device"),
    })
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add device
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl overflow-y-auto px-6 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add a device</DrawerTitle>
            <DrawerDescription>
              Track a new device and its warranty coverage.
            </DrawerDescription>
          </DrawerHeader>
          <DeviceForm
            defaultValues={emptyDeviceForm()}
            submitLabel="Add device"
            isSubmitting={mutation.isPending}
            onCancel={() => setOpen(false)}
            onSubmit={(values) => mutation.mutate({ json: values })}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
