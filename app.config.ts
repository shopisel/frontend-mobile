import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Shopisel",
  slug: "shopisel",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "shopisel",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#6366F1",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "pt.isel.shopisel",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#6366F1",
    },
    package: "pt.isel.shopisel",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-web-browser",
    "expo-secure-store",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
    KEYCLOAK_URL: process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? "",
    KEYCLOAK_REALM: process.env.EXPO_PUBLIC_KEYCLOAK_REALM ?? "",
    KEYCLOAK_CLIENT: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT ?? "",
    eas: {
      projectId: "50cdb508-7563-44f6-ba63-b533a8604bd3",
    },
  },
};

export default config;
