import {
  defaultOrderFor,
  type DeviceSortField,
  type WarrantyStatus,
} from "@repo/validators";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  CreateDeviceSheet,
  type CreateDeviceSheetRef,
} from "../../components/create-device-sheet";
import { DeviceCard } from "../../components/device-card";
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
  const sheetRef = useRef<CreateDeviceSheetRef>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WarrantyStatus | undefined>(undefined);
  const [sort, setSort] = useState<DeviceSortField>("createdAt");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "grid">("list");

  const query = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    sort,
    order: defaultOrderFor(sort),
    page: String(page),
    pageSize: "10",
  };

  const { data, isPending, isError, refetch, isRefetching } = useQuery(
    devicesQueryOptions({ query })
  );
  // Prefetch filter metadata (unused directly here but warms the cache for parity with web).
  useQuery(deviceMetaQueryOptions());

  const pager =
    data && data.meta.totalPages > 1 ? (
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
    ) : null;

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
        <View className="flex-row items-start gap-2">
          <View className="flex-1 flex-row flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              // Status pills and "Newly added" form one single-select group: a
              // status is only "active" when we aren't sorting by newest.
              const active = sort !== "createdAt" && status === f.value;
              return (
                <Pressable
                  key={f.label}
                  onPress={() => {
                    setStatus(f.value);
                    setSort("warrantyExpiry");
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
            {(() => {
              const active = sort === "createdAt";
              return (
                <Pressable
                  onPress={() => {
                    setStatus(undefined);
                    setSort("createdAt");
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 ${active ? "border-primary bg-primary/20" : "border-border"}`}
                >
                  <Text className={active ? "text-xs text-primary" : "text-xs text-muted"}>
                    Newly added
                  </Text>
                </Pressable>
              );
            })()}
          </View>
          <ViewToggle view={view} onChange={setView} />
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
          // Remount when columns change — FlatList can't switch numColumns live.
          key={view}
          data={data.data}
          keyExtractor={(d) => d.id}
          numColumns={view === "grid" ? 2 : 1}
          columnWrapperClassName={view === "grid" ? "gap-3" : undefined}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 40).duration(260)}
              className={view === "grid" ? "flex-1" : undefined}
            >
              {view === "grid" ? (
                <DeviceCard device={item} />
              ) : (
                <DeviceListItem device={item} />
              )}
            </Animated.View>
          )}
          contentContainerClassName="gap-3 px-4 pb-28"
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
          ListFooterComponent={pager}
        />
      )}

      {/* Floating action button */}
      <Pressable
        onPress={() => sheetRef.current?.present()}
        accessibilityLabel="Add device"
        style={{
          shadowColor: "#00DE6F",
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
        className="absolute bottom-6 right-5 size-14 items-center justify-center rounded-full bg-primary active:scale-95 active:opacity-90"
      >
        <Plus color="#181818" size={26} />
      </Pressable>

      <CreateDeviceSheet ref={sheetRef} />
    </View>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}) {
  return (
    <View className="flex-row rounded-lg border border-border p-0.5">
      {(["list", "grid"] as const).map((v) => {
        const active = view === v;
        const Icon = v === "list" ? List : LayoutGrid;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            accessibilityLabel={`${v} view`}
            className={`size-8 items-center justify-center rounded-md ${active ? "bg-primary/20" : ""}`}
          >
            <Icon color={active ? "#00DE6F" : "#71717a"} size={18} />
          </Pressable>
        );
      })}
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
