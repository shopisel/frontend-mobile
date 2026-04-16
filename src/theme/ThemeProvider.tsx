import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { getColors, type ThemeColors, type ThemeMode } from "../styles/colors";

const THEME_MODE_KEY = "shopisel_theme_mode";

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    void (async () => {
      const storedMode = await SecureStore.getItemAsync(THEME_MODE_KEY);
      if (storedMode === "light" || storedMode === "dark") {
        setModeState(storedMode);
      }
    })();
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    await SecureStore.setItemAsync(THEME_MODE_KEY, nextMode);
    setModeState(nextMode);
  };

  const setDarkMode = async (enabled: boolean) => {
    await setMode(enabled ? "dark" : "light");
  };

  const value = useMemo(
    () => ({
      colors: getColors(mode),
      mode,
      isDark: mode === "dark",
      setMode,
      setDarkMode,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
