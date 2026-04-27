# Deploy iOS sem QR local

Esta app ja esta preparada para correr contra servicos remotos. Para testar no iPhone sem depender do QR do `expo start`, usa um build EAS.

## 1. Configuracao necessaria

Define estas variaveis no ambiente de build ou no Expo dashboard:

```env
EXPO_PUBLIC_KEYCLOAK_URL=https://keycloack-iyww.onrender.com
EXPO_PUBLIC_KEYCLOAK_REALM=shopisel
EXPO_PUBLIC_KEYCLOAK_CLIENT=shopisel-mobile
EXPO_PUBLIC_API_BASE_URL=https://deploy-xma1.onrender.com/api
```

Notas:

- `EXPO_PUBLIC_API_BASE_URL` tem de ser uma URL absoluta HTTPS. Em mobile, `/api` nao funciona num build instalado.
- A configuracao acima fica embebida no build atraves de `app.config.ts`.

## 2. Redirect URI do Keycloak

O login mobile usa o esquema `shopisel` com callback:

```text
shopisel://auth
```

No cliente `shopisel-mobile` do Keycloak, confirma que esta URI esta permitida em `Valid Redirect URIs`.

## 3. Build interno para instalar no teu iPhone

Dentro de `frontend-mobile`:

```bash
npx eas-cli login
npx eas-cli build --platform ios --profile preview
```

No fim, o Expo gera um link de instalacao. Abres esse link no iPhone e instalas a app sem usar QR do Metro.

## 4. TestFlight

Se quiseres distribuir como app quase final:

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

Isto exige conta Apple Developer.

## 5. O que muda em relacao ao modo local

- Nao precisas de `expo start`.
- Nao precisas de manter o PC ligado para servir JS.
- A app fala diretamente com o backend remoto e com o Keycloak remoto.
