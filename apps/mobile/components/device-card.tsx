import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatTimeLeft } from "../lib/format";
import type { DeviceItem } from "./device-list-item";
import { categoryIcon } from "./icons";
import { StatusBadge } from "./ui";

/** Compact card for the 2-column grid view. */
export function DeviceCard({ device }: { device: DeviceItem }) {
  const router = useRouter();
  const Icon = categoryIcon(device.category);
  return (
    <Pressable
      onPress={() => router.push(`/devices/${device.id}`)}
      className="flex-1 gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
    >
      <View className="size-11 items-center justify-center rounded-xl bg-white/5">
        <Icon color="#d4d4d8" size={20} />
      </View>
      <View className="gap-0.5">
        <Text className="text-base font-semibold text-zinc-100" numberOfLines={1}>
          {device.name}
        </Text>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {device.brand}
        </Text>
      </View>
      <Text className="text-xs text-muted" numberOfLines={1}>
        {formatTimeLeft(device.warrantyExpiry)}
      </Text>
      <StatusBadge status={device.status} />
    </Pressable>
  );
}
