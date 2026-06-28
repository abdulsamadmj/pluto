import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Pluto",
  slug: "pluto",
  scheme: "warranty", // deep-link scheme — must match server auth trustedOrigins/CORS
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.smileox.pluto",
  },
  android: {
    package: "com.smileox.pluto",
  },
  web: {
    bundler: "metro",
    output: "single",
  },
  plugins: ["expo-router", "expo-secure-store", "./plugins/withFmtConsteval"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    serverUrl: process.env.EXPO_PUBLIC_SERVER_URL,
    eas: {
      projectId: "46177106-9b60-43b5-8cd9-af86ad132a24",
    },
  },
};

export default config;
