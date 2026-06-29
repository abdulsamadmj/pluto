import { Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import type { WarrantyStatus } from "@repo/validators";
import { resolveTheme, stopsFor } from "../lib/card-themes";
import { formatCurrency, formatTimeLeft, statusLabels } from "../lib/format";
import type { DeviceItem } from "./device-list-item";
import { categoryIcon } from "./icons";

/** Status accent for the badge dot — readable on any themed card. */
const statusDot: Record<WarrantyStatus, string> = {
  active: "#6ee7b7",
  expiring_soon: "#fde68a",
  expired: "#fca5a5",
};

const RATIO = 1.6; // payment-card-like proportions.

function expiryMonthYear(value: string | Date): string {
  const d = new Date(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

export function WarrantyCard({
  device: d,
  width,
}: {
  device: DeviceItem;
  width: number;
}) {
  const height = width / RATIO;
  const stops = stopsFor(resolveTheme(d.cardTheme), d.id);
  const Icon = categoryIcon(d.category);
  const gradId = `card-grad-${d.id}`;

  return (
    <View style={{ width, height }} className="overflow-hidden rounded-3xl">
      {/* Gradient face */}
      <Svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <SvgLinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={stops[0]} />
            <Stop offset="0.35" stopColor={stops[1]} />
            <Stop offset="0.82" stopColor={stops[2]} />
          </SvgLinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${gradId})`} />
        {/* Diagonal gloss */}
        <Rect width={width} height={height} fill="rgba(255,255,255,0.05)" />
      </Svg>

      {/* Category watermark */}
      <View style={{ position: "absolute", right: -18, bottom: -22 }}>
        <Icon color="rgba(255,255,255,0.12)" size={150} />
      </View>

      {/* Content */}
      <View className="flex-1 p-5">
        {/* Top: brand mark + status */}
        <View className="flex-row items-start justify-between">
          <View className="size-11 items-center justify-center rounded-xl bg-white/15">
            <Icon color="#ffffff" size={20} />
          </View>
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-black/25 px-2.5 py-1">
            <View
              style={{ backgroundColor: statusDot[d.status] }}
              className="size-1.5 rounded-full"
            />
            <Text className="text-[11px] font-medium text-white">
              {statusLabels[d.status]}
            </Text>
          </View>
        </View>

        {/* Issuer + holder */}
        <View className="mt-auto">
          <Text className="text-[10px] font-semibold uppercase tracking-[2px] text-white/60">
            Warranty{d.warrantyProvider ? ` · ${d.warrantyProvider}` : ""}
          </Text>
          <Text
            className="mt-1 text-lg font-semibold tracking-wide text-white"
            numberOfLines={1}
          >
            {d.name}
          </Text>
          <Text className="text-xs text-white/70" numberOfLines={1}>
            {d.brand} · {d.model}
          </Text>
          <Text
            className="mt-1 font-mono text-[11px] tracking-wider text-white/60"
            numberOfLines={1}
          >
            S/N {d.serialNumber}
          </Text>
        </View>

        {/* Footer: price • valid thru • time left */}
        <View className="mt-3 flex-row items-center justify-between border-t border-white/15 pt-2.5">
          <Text className="text-[11px] text-white/75">
            {formatCurrency(d.purchasePrice)}
          </Text>
          <Text className="text-[11px] text-white/75">
            Until {expiryMonthYear(d.warrantyExpiry)} · {formatTimeLeft(d.warrantyExpiry)}
          </Text>
        </View>
      </View>
    </View>
  );
}
