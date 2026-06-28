import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useCallback } from "react";
import { Alert, Text, View } from "react-native";
import { DeviceForm, emptyDeviceForm } from "./device-form";
import { createDeviceMutationOptions } from "../queries/devices.queries";

export type CreateDeviceSheetRef = BottomSheetModal;

/** Bottom sheet for creating a device. Present it via the forwarded ref. */
export const CreateDeviceSheet = forwardRef<BottomSheetModal>((_props, ref) => {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    createDeviceMutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
        if (ref && typeof ref !== "function") ref.current?.dismiss();
      },
      onError: () => Alert.alert("Error", "Could not add device"),
    })
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["90%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#18181b" }}
      handleIndicatorStyle={{ backgroundColor: "#52525b" }}
    >
      <BottomSheetScrollView contentContainerClassName="px-5 pb-10">
        <View className="mb-4 gap-1">
          <Text className="text-xl font-bold text-zinc-50">Add a device</Text>
          <Text className="text-sm text-muted">
            Track a new device and its warranty coverage.
          </Text>
        </View>
        <DeviceForm
          initial={emptyDeviceForm()}
          submitLabel="Add device"
          loading={mutation.isPending}
          onSubmit={(values) => mutation.mutate({ json: values })}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

CreateDeviceSheet.displayName = "CreateDeviceSheet";
