import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from "react-native";
import type { WarrantyStatus } from "@repo/validators";
import { statusLabels, statusStyles } from "../lib/format";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-border bg-card p-4 ${className ?? ""}`}
      {...props}
    />
  );
}

export function Button({
  children,
  onPress,
  loading,
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  onPress?: PressableProps["onPress"];
  loading?: boolean;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
}) {
  const base =
    "h-12 flex-row items-center justify-center rounded-xl px-4 active:opacity-80";
  const variants = {
    primary: "bg-primary",
    outline: "border border-border bg-transparent",
    ghost: "bg-transparent",
    destructive: "bg-red-500/15",
  };
  const textColor = {
    primary: "text-zinc-950",
    outline: "text-zinc-100",
    ghost: "text-zinc-300",
    destructive: "text-red-400",
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#181818" : "#e4e4e7"} />
      ) : typeof children === "string" ? (
        <Text className={`text-base font-semibold ${textColor[variant]}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-zinc-300">{label}</Text>
      {children}
      {error ? <Text className="text-xs text-red-400">{error}</Text> : null}
    </View>
  );
}

export function Input(props: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#71717a"
      className={`h-12 rounded-xl border border-border bg-transparent px-3 text-base text-zinc-100 ${props.className ?? ""}`}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: WarrantyStatus }) {
  const s = statusStyles[status];
  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${s.bg}`}>
      <View className={`size-1.5 rounded-full ${s.dot}`} />
      <Text className={`text-xs font-medium ${s.text}`}>{statusLabels[status]}</Text>
    </View>
  );
}

export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={`text-muted ${className ?? ""}`}>{children}</Text>;
}
