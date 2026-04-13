import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const KEYCLOAK_URL    = extra.KEYCLOAK_URL    ?? process.env.EXPO_PUBLIC_KEYCLOAK_URL    ?? "";
export const KEYCLOAK_REALM  = extra.KEYCLOAK_REALM  ?? process.env.EXPO_PUBLIC_KEYCLOAK_REALM  ?? "";
export const KEYCLOAK_CLIENT = extra.KEYCLOAK_CLIENT ?? process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT ?? "";

export const isKeycloakConfigured =
  Boolean(KEYCLOAK_URL) && Boolean(KEYCLOAK_REALM) && Boolean(KEYCLOAK_CLIENT);

export const keycloakDiscovery = isKeycloakConfigured
  ? {
      authorizationEndpoint: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`,
      tokenEndpoint:         `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      revocationEndpoint:    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`,
    }
  : null;
