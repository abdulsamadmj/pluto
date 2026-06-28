import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard, Smartphone } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../../lib/auth-client";

export default function TabsLayout() {
  const { isInitialPending, isAuthenticated } = useSession();

  if (isInitialPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#e879b9" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#09090b" },
        headerTintColor: "#fafafa",
        tabBarStyle: { backgroundColor: "#09090b", borderTopColor: "#27272a" },
        tabBarActiveTintColor: "#e879b9",
        tabBarInactiveTintColor: "#71717a",
        sceneStyle: { backgroundColor: "#09090b" },
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
    </Tabs>
  );
}
