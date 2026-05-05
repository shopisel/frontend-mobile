import { useEffect } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../auth/AuthProvider";
import { useAccounts } from "../api/useAccounts";

const INSTALLATION_ID_KEY = "shopisel_installation_id";

function generateInstallationId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function getInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing?.trim()) return existing;

  const created = generateInstallationId();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, created);
  return created;
}

function isNotificationsPlatform(platform: string): platform is "android" | "ios" {
  return platform === "android" || platform === "ios";
}

export function PushTokenRegistrar() {
  const { initialized, isAuthenticated } = useAuth();
  const { upsertPushToken } = useAccounts();

  useEffect(() => {
    if (!initialized || !isAuthenticated) return;
    const platform = Platform.OS;
    if (!isNotificationsPlatform(platform)) return;

    let cancelled = false;
    let unsubscribeTokenRefresh: (() => void) | null = null;

    void (async () => {
      try {
        const { default: messaging } = await import("@react-native-firebase/messaging");

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (platform === "ios" && !enabled) return;
        if (cancelled) return;

        const deviceId = await getInstallationId();
        const token = await messaging().getToken();
        if (cancelled) return;

        await upsertPushToken({
          fcm_token: token,
          platform,
          device_id: deviceId,
        });

        unsubscribeTokenRefresh = messaging().onTokenRefresh(async (nextToken: string) => {
          try {
            const nextDeviceId = await getInstallationId();
            await upsertPushToken({
              fcm_token: nextToken,
              platform,
              device_id: nextDeviceId,
            });
          } catch (error) {
            console.warn("[PushTokenRegistrar] Failed to upsert refreshed token", error);
          }
        });
      } catch (error) {
        console.warn("[PushTokenRegistrar] Push token registration failed", error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeTokenRefresh?.();
      unsubscribeTokenRefresh = null;
    };
  }, [initialized, isAuthenticated, upsertPushToken]);

  return null;
}
