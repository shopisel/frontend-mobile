import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { resources, type AppLanguage } from "./resources";

function detectDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0];
  const code = locale?.languageCode?.toLowerCase();
  return code === "pt" ? "pt" : "en";
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export { i18n, detectDeviceLanguage };
