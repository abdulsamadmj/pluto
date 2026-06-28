import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Warrantly",
  slug: "warrantly",
  scheme: "warranty", // deep-link scheme — must match server auth trustedOrigins/CORS
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.smileox.warrantly",
  },
  android: {
    package: "com.smileox.warrantly",
  },
  web: {
    bundler: "metro",
    output: "single",
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    serverUrl: process.env.EXPO_PUBLIC_SERVER_URL,
  },
};

export default config;
