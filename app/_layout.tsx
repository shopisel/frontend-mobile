import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../src/auth/AuthProvider";
import { FavoritesProvider } from "../src/favorites/FavoritesProvider";
import "../src/i18n";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <FavoritesProvider>
                <AppShell />
              </FavoritesProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { isDark } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Toast />
    </>
  );
}
