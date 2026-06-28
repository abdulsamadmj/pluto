import type { WarrantyStatus } from "@repo/validators";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import { Plus } from "lucide-react-native";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import {
  CreateDeviceSheet,
  type CreateDeviceSheetRef,
} from "../../components/create-device-sheet";
import { DeviceListItem } from "../../components/device-list-item";
import { Input, Muted } from "../../components/ui";
import {
  deviceMetaQueryOptions,
  devicesQueryOptions,
} from "../../queries/devices.queries";

const STATUS_FILTERS: { label: string; value?: WarrantyStatus }[] = [
  { label: "All" },
  { label: "Active", value: "active" },
  { label: "Expiring", value: "expiring_soon" },
  { label: "Expired", value: "expired" },
];

export default function DeviceListScreen() {
  const navigation = useNavigation();
  const sheetRef = useRef<CreateDeviceSheetRef>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WarrantyStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const query = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    sort: "warrantyExpiry" as const,
    order: "asc" as const,
    page: String(page),
    pageSize: "10",
  };

  const { data, isPending, isError, refetch, isRefetching } = useQuery(
    devicesQueryOptions({ query })
  );
  // Prefetch filter metadata (unused directly here but warms the cache for parity with web).
  useQuery(deviceMetaQueryOptions());

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => sheetRef.current?.present()}
          className="mr-1 size-9 items-center justify-center rounded-full bg-primary active:opacity-80"
        >
          <Plus color="#222222" size={20} />
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-bg">
      <View className="gap-3 px-4 pb-3 pt-2">
        <Input
          value={search}
          onChangeText={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, brand, model, serial…"
          autoCapitalize="none"
        />
        <View className="flex-row gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 ${active ? "border-primary bg-primary/20" : "border-border"}`}
              >
                <Text className={active ? "text-xs text-primary" : "text-xs text-muted"}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#00DE6F" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Muted>Failed to load devices. Pull to retry.</Muted>
        </View>
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DeviceListItem device={item} />}
          contentContainerClassName="gap-3 px-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#00DE6F"
            />
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Muted>No devices match your filters.</Muted>
            </View>
          }
          ListFooterComponent={
            data.meta.totalPages > 1 ? (
              <View className="mt-4 flex-row items-center justify-between">
                <PagerButton
                  label="Previous"
                  disabled={data.meta.page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                />
                <Muted>
                  Page {data.meta.page} of {data.meta.totalPages}
                </Muted>
                <PagerButton
                  label="Next"
                  disabled={data.meta.page >= data.meta.totalPages}
                  onPress={() => setPage((p) => p + 1)}
                />
              </View>
            ) : null
          }
        />
      )}

      <CreateDeviceSheet ref={sheetRef} />
    </View>
  );
}

function PagerButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg border border-border px-3 py-2 ${disabled ? "opacity-40" : "active:opacity-80"}`}
    >
      <Text className="text-sm text-zinc-200">{label}</Text>
    </Pressable>
  );
}
