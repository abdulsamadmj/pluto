import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Pluto",
  slug: "pluto",
  scheme: "warranty", // deep-link scheme — must match server auth trustedOrigins/CORS
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  icon: "./assets/images/logo.png",
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: "#181818",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.smileox.pluto",
  },
  android: {
    package: "com.smileox.pluto",
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#181818",
    },
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/logo.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "./plugins/withFmtConsteval",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Pluto needs access to your photos so you can scan a warranty card or receipt.",
        cameraPermission:
          "Pluto needs camera access so you can photograph a warranty card or receipt.",
      },
    ],
  ],
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
