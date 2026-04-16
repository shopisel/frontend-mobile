import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { i18n, detectDeviceLanguage } from "./index";
import type { AppLanguage } from "./resources";

const LANGUAGE_KEY = "shopisel_language";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (nextLanguage: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>((i18n.language as AppLanguage) || "en");

  useEffect(() => {
    void (async () => {
      const storedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
      const nextLanguage = (storedLanguage as AppLanguage | null) ?? detectDeviceLanguage();
      await i18n.changeLanguage(nextLanguage);
      setLanguageState(nextLanguage);
    })();
  }, []);

  const setLanguage = async (nextLanguage: AppLanguage) => {
    await SecureStore.setItemAsync(LANGUAGE_KEY, nextLanguage);
    await i18n.changeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
