import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { KEYCLOAK_CLIENT, isKeycloakConfigured, keycloakDiscovery } from "./keycloak";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY    = "shopisel_access_token";
const REFRESH_KEY  = "shopisel_refresh_token";

type AuthUser = {
  name?: string;
  email?: string;
  username?: string;
};

type AuthContextValue = {
  initialized: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  configError: string | null;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseJwt(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isTokenExpiringSoon(token: string | null, bufferSeconds = 30): boolean {
  if (!token) return true;

  const parsed = parseJwt(token);
  const exp = typeof parsed.exp === "number" ? parsed.exp : Number(parsed.exp);
  if (!exp || Number.isNaN(exp)) return true;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds + bufferSeconds;
}

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const parsed = parseJwt(token);
  return {
    name:     parsed.name     as string | undefined,
    email:    parsed.email    as string | undefined,
    username: parsed.preferred_username as string | undefined,
  };
}

type AuthProviderProps = { children: ReactNode };

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized]       = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken]                   = useState<string | null>(null);
  const [user, setUser]                     = useState<AuthUser | null>(null);
  const [configError, setConfigError]       = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "shopisel" });
  console.log("[AuthProvider] redirectUri:", redirectUri);


  const [authRequest, authResponse, promptAsync] = AuthSession.useAuthRequest(
    isKeycloakConfigured && keycloakDiscovery
      ? {
          clientId:     KEYCLOAK_CLIENT,
          redirectUri,
          scopes:       ["openid", "profile", "email", "offline_access"],
          usePKCE:      true,
          responseType: AuthSession.ResponseType.Code,
        }
      : { clientId: "", redirectUri },
    isKeycloakConfigured && keycloakDiscovery ? keycloakDiscovery : null
  );

  // Restore token on mount
  useEffect(() => {
    if (!isKeycloakConfigured) {
      setConfigError(
        "Keycloak não configurado. Define EXPO_PUBLIC_KEYCLOAK_URL, EXPO_PUBLIC_KEYCLOAK_REALM e EXPO_PUBLIC_KEYCLOAK_CLIENT."
      );
      setInitialized(true);
      return;
    }

    void (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        setUser(userFromToken(stored));
        setIsAuthenticated(true);
      }
      setInitialized(true);
    })();
  }, []);

  // Handle auth response (code exchange)
  useEffect(() => {
    if (authResponse?.type !== "success" || !keycloakDiscovery) return;
    const { code } = authResponse.params;

    void (async () => {
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId:     KEYCLOAK_CLIENT,
            redirectUri,
            code,
            extraParams: authRequest?.codeVerifier
              ? { code_verifier: authRequest.codeVerifier }
              : {},
          },
          keycloakDiscovery
        );
        const accessToken = tokenResult.accessToken;
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        if (tokenResult.refreshToken) {
          await SecureStore.setItemAsync(REFRESH_KEY, tokenResult.refreshToken);
        }
        setToken(accessToken);
        setUser(userFromToken(accessToken));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Token exchange failed", e);
      }
    })();
  }, [authResponse]);

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const register = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!token) return null;

    if (!isTokenExpiringSoon(token)) {
      return token;
    }

    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!storedRefreshToken || !keycloakDiscovery) {
      return token;
    }

    try {
      const refreshed = await AuthSession.refreshAsync(
        {
          clientId: KEYCLOAK_CLIENT,
          refreshToken: storedRefreshToken,
        },
        keycloakDiscovery
      );

      const nextAccessToken = refreshed.accessToken ?? token;
      await SecureStore.setItemAsync(TOKEN_KEY, nextAccessToken);

      if (refreshed.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, refreshed.refreshToken);
      }

      setToken(nextAccessToken);
      setUser(userFromToken(nextAccessToken));
      setIsAuthenticated(true);

      return nextAccessToken;
    } catch (error) {
      console.error("Token refresh failed", error);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      isAuthenticated,
      token,
      user,
      configError,
      login,
      register,
      logout,
      getAccessToken,
    }),
    [initialized, isAuthenticated, token, user, configError, login, register, logout, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
