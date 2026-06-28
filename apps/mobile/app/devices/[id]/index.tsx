import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Button, Card, Muted, StatusBadge } from "../../../components/ui";
import {
  formatCurrency,
  formatDate,
  formatTimeLeft,
} from "../../../lib/format";
import {
  deleteDeviceMutationOptions,
  deviceByIdQueryOptions,
} from "../../../queries/devices.queries";

export default function DeviceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(
    deviceByIdQueryOptions({ param: { id } })
  );

  const del = useMutation(
    deleteDeviceMutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
        router.back();
      },
      onError: () => Alert.alert("Error", "Could not delete device"),
    })
  );

  const confirmDelete = () => {
    if (!data) return;
    Alert.alert(
      "Delete this device?",
      `${data.name} and its warranty history will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => del.mutate({ param: { id } }),
        },
      ]
    );
  };

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
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="gap-4 p-4">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-2xl font-bold text-zinc-50">{data.name}</Text>
          <StatusBadge status={data.status} />
        </View>
        <Muted>
          {data.brand} · {data.category} · {data.model}
        </Muted>
      </View>

      <Card className="gap-3">
        <Text className="text-2xl font-bold text-zinc-50">
          {formatTimeLeft(data.warrantyExpiry)}
        </Text>
        <Row label="Purchase date" value={formatDate(data.purchaseDate)} />
        <Row label="Expiry date" value={formatDate(data.warrantyExpiry)} />
        <Row label="Coverage" value={`${data.warrantyMonths} months`} />
        <Row label="Provider" value={data.warrantyProvider} />
        <Row label="Price" value={formatCurrency(data.purchasePrice)} />
        <Row label="Retailer" value={data.retailer} />
        <Row label="Serial" value={data.serialNumber} mono />
      </Card>

      <Card>
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Warranty timeline
        </Text>
        {data.timeline.length === 0 ? (
          <Muted className="text-sm">No events recorded.</Muted>
        ) : (
          <View className="gap-3">
            {data.timeline.map((e) => (
              <View key={e.id} className="border-l border-border pl-3">
                <Text className="text-sm font-medium text-zinc-200">{e.title}</Text>
                <Text className="text-xs text-muted">{formatDate(e.date)}</Text>
                {e.description ? (
                  <Text className="mt-0.5 text-sm text-zinc-400">{e.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      {data.notes ? (
        <Card>
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Notes
          </Text>
          <Text className="text-sm text-zinc-300">{data.notes}</Text>
        </Card>
      ) : null}

      <View className="flex-row gap-3 pt-2">
        <View className="flex-1">
          <Button
            variant="outline"
            onPress={() => router.push(`/devices/${id}/edit`)}
          >
            <View className="flex-row items-center gap-2">
              <Pencil color="#e4e4e7" size={16} />
              <Text className="font-semibold text-zinc-100">Edit</Text>
            </View>
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="destructive" onPress={confirmDelete} loading={del.isPending}>
            <View className="flex-row items-center gap-2">
              <Trash2 color="#f87171" size={16} />
              <Text className="font-semibold text-red-400">Delete</Text>
            </View>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Muted className="text-sm">{label}</Muted>
      <Text className={`text-sm text-zinc-200 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </Text>
    </View>
  );
}
