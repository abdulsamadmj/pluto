import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { DeviceForm, toDateInput } from "../../../components/device-form";
import { Muted } from "../../../components/ui";
import {
  deviceByIdQueryOptions,
  updateDeviceMutationOptions,
} from "../../../queries/devices.queries";

export default function EditDeviceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(
    deviceByIdQueryOptions({ param: { id } })
  );

  const mutation = useMutation(
    updateDeviceMutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
        router.back();
      },
    })
  );

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#00DE6F" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Muted>Device not found.</Muted>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4">
      <DeviceForm
        initial={{
          name: data.name,
          brand: data.brand,
          category: data.category,
          model: data.model,
          serialNumber: data.serialNumber,
          purchaseDate: toDateInput(data.purchaseDate),
          purchasePrice: String(data.purchasePrice),
          retailer: data.retailer,
          warrantyMonths: String(data.warrantyMonths),
          warrantyProvider: data.warrantyProvider,
          notes: data.notes ?? "",
        }}
        submitLabel="Save changes"
        loading={mutation.isPending}
        onSubmit={(values) => mutation.mutate({ param: { id }, json: values })}
      />
    </ScrollView>
  );
}
