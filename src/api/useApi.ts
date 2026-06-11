import { useAuth } from "../auth/AuthProvider";
import { useCallback } from "react";
import Constants from "expo-constants";
import { i18n } from "../i18n";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const API_BASE_URL = extra.API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function useApi() {
  const { getAccessToken } = useAuth();

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!API_BASE_URL) {
      throw new Error(i18n.t("errors.apiNotConfigured"));
    }

    const token = await getAccessToken();

    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const responseText = await response.text();
      let parsedError: unknown = null;

      try {
        parsedError = responseText ? JSON.parse(responseText) : null;
      } catch {
        parsedError = responseText;
      }

      const errorMessage =
        typeof parsedError === "string" && parsedError.trim()
          ? parsedError.trim()
          : (parsedError as { message?: string; error?: string } | null)?.message
            ?? (parsedError as { message?: string; error?: string } | null)?.error
            ?? response.statusText
            ?? i18n.t("errors.requestFailed");

      console.error("[useApi] Request failed", {
        url,
        method: options.method ?? "GET",
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      throw new ApiError(response.status, errorMessage);
    }

    if (response.status === 204) return null;

    try {
      return await response.json();
    } catch {
      return null;
    }
  }, [getAccessToken]);

  const get   = useCallback((endpoint: string) => fetchWithAuth(endpoint), [fetchWithAuth]);
  const post  = useCallback((endpoint: string, body?: unknown) => fetchWithAuth(endpoint, { method: "POST",   body: JSON.stringify(body) }), [fetchWithAuth]);
  const put   = useCallback((endpoint: string, body?: unknown, headers?: HeadersInit) => fetchWithAuth(endpoint, { method: "PUT",    body: JSON.stringify(body), headers }), [fetchWithAuth]);
  const patch = useCallback((endpoint: string, body?: unknown) => fetchWithAuth(endpoint, { method: "PATCH",  body: JSON.stringify(body) }), [fetchWithAuth]);
  const del   = useCallback((endpoint: string, headers?: HeadersInit) => fetchWithAuth(endpoint, { method: "DELETE", headers }),                             [fetchWithAuth]);

  return { get, post, put, patch, del };
}
