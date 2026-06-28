import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Package,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  type LucideIcon,
} from "lucide-react-native";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Muted } from "../../components/ui";
import { authClient, useSession } from "../../lib/auth-client";
import { statsQueryOptions } from "../../queries/devices.queries";

const logo = require("../../assets/images/logo.png");

export default function DashboardScreen() {
  const { data, isPending } = useQuery(statsQueryOptions());
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You'll need to sign in again to access your devices.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          queryClient.clear();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const cards: { label: string; value?: number; icon: LucideIcon; color: string }[] = [
    { label: "Total Devices", value: data?.total, icon: Package, color: "#d4d4d8" },
    { label: "Active", value: data?.active, icon: ShieldCheck, color: "#34d399" },
    { label: "Expiring Soon", value: data?.expiring_soon, icon: ShieldAlert, color: "#fbbf24" },
    { label: "Expired", value: data?.expired, icon: ShieldX, color: "#f87171" },
  ];

  const firstName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "there";

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ paddingTop: insets.top + 8 }}
    >
      <View className="gap-5">
        <View className="flex-row items-center gap-2.5">
          <Image source={logo} className="size-8 rounded-lg" />
          <Text className="text-lg font-bold text-zinc-50">Pluto</Text>
        </View>
        <View className="gap-1">
          <Text className="text-2xl font-bold text-zinc-50">
            Welcome, {firstName} 👋
          </Text>
          <Muted>Here&apos;s your warranty overview.</Muted>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="min-w-[45%] flex-1">
            <View className="flex-row items-center justify-between">
              <Muted className="text-sm">{c.label}</Muted>
              <c.icon color={c.color} size={18} />
            </View>
            <Text className="mt-2 text-3xl font-bold" style={{ color: c.color }}>
              {isPending ? "—" : c.value}
            </Text>
          </Card>
        ))}
      </View>

      <Button variant="outline" onPress={confirmSignOut}>
        Sign out
      </Button>
    </ScrollView>
  );
}
