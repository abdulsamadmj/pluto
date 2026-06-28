import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard, Smartphone } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../../lib/auth-client";

export default function TabsLayout() {
  const { isInitialPending, isAuthenticated } = useSession();

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
        headerStyle: { backgroundColor: "#222222" },
        headerTintColor: "#fafafa",
        tabBarStyle: { backgroundColor: "#222222", borderTopColor: "#3a3a3a" },
        tabBarActiveTintColor: "#00DE6F",
        tabBarInactiveTintColor: "#71717a",
        sceneStyle: { backgroundColor: "#222222" },
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
