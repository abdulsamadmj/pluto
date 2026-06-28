import { useQuery } from "@tanstack/react-query";
import { Redirect, Tabs } from "expo-router";
import { Bell, LayoutDashboard, Smartphone } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../../lib/auth-client";
import { notificationsQueryOptions } from "../../queries/notifications.queries";

export default function TabsLayout() {
  const { isInitialPending, isAuthenticated } = useSession();
  const { data: notifications } = useQuery({
    ...notificationsQueryOptions({ query: { pageSize: "50" } }),
    enabled: isAuthenticated,
  });
  const unread = notifications?.meta.unread ?? 0;

  if (isInitialPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#00DE6F" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#181818" },
        headerTintColor: "#fafafa",
        tabBarStyle: { backgroundColor: "#181818", borderTopColor: "#303030" },
        tabBarActiveTintColor: "#00DE6F",
        tabBarInactiveTintColor: "#71717a",
        sceneStyle: { backgroundColor: "#181818" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Devices",
          tabBarIcon: ({ color, size }) => (
            <Smartphone color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: "#00DE6F", color: "#181818" },
        }}
      />
    </Tabs>
  );
}
