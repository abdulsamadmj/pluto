import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../lib/auth-client";

// Entry gate: route to the app or the auth flow based on the session.
export default function Index() {
  const { isInitialPending, isAuthenticated } = useSession();

  if (isInitialPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#00DE6F" />
      </View>
    );
  }

  return (
    <Redirect href={isAuthenticated ? "/(tabs)/dashboard" : "/(auth)/sign-in"} />
  );
}
