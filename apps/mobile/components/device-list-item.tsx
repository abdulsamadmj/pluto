import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { formatTimeLeft } from "../lib/format";
import { categoryIcon } from "./icons";
import { StatusBadge } from "./ui";
import type { WarrantyStatus } from "@repo/validators";

export type DeviceItem = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  warrantyExpiry: string;
  status: WarrantyStatus;
};

export function DeviceListItem({ device }: { device: DeviceItem }) {
  const router = useRouter();
  const Icon = categoryIcon(device.category);
  return (
    <Pressable
      onPress={() => router.push(`/devices/${device.id}`)}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
    >
      <View className="size-11 items-center justify-center rounded-xl bg-white/5">
        <Icon color="#d4d4d8" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-zinc-100" numberOfLines={1}>
          {device.name}
        </Text>
        <Text className="text-sm text-muted" numberOfLines={1}>
          {device.brand} · {formatTimeLeft(device.warrantyExpiry)}
        </Text>
      </View>
      <StatusBadge status={device.status} />
      <ChevronRight color="#52525b" size={18} />
    </Pressable>
  );
}
