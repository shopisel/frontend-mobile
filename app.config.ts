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
    googleServicesFile: "./GoogleService-Info.plist",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#6366F1",
    },
    package: "pt.isel.shopisel",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    googleServicesFile: "./google-services.json",
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-web-browser",
    "expo-secure-store",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
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
      projectId: "ce42b7ef-9141-49c4-a945-712a7a1bca02",
    },
  },
};

export default config;
