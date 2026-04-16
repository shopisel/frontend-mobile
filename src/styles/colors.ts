export const lightColors = {
  primary50: "#EEF2FF",
  primary100: "#E0E7FF",
  primary500: "#6366F1",
  primary600: "#6366F1",
  primary700: "#4F46E5",
  success50: "#ECFDF5",
  success500: "#10B981",
  warning50: "#FFFBEB",
  warning500: "#F59E0B",
  error500: "#EF4444",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  background: "#F8F9FC",
  surface: "#FFFFFF",
  border: "#F3F4F6",
  blueCard: "#EFF6FF",
  greenCard: "#ECFDF5",
  orangeCard: "#FFF7ED",
  purpleCard: "#EEF2FF",
} as const;

export const darkColors = {
  primary50: "#1E1B4B",
  primary100: "#312E81",
  primary500: "#818CF8",
  primary600: "#818CF8",
  primary700: "#A5B4FC",
  success50: "#052E22",
  success500: "#34D399",
  warning50: "#3B2A05",
  warning500: "#FBBF24",
  error500: "#F87171",
  gray50: "#111827",
  gray100: "#1F2937",
  gray200: "#273244",
  gray300: "#374151",
  gray400: "#94A3B8",
  gray500: "#CBD5E1",
  gray600: "#D1D5DB",
  gray700: "#E5E7EB",
  gray800: "#F3F4F6",
  gray900: "#F9FAFB",
  background: "#0B1220",
  surface: "#111827",
  border: "#1F2937",
  blueCard: "#172554",
  greenCard: "#052E22",
  orangeCard: "#3B1D0A",
  purpleCard: "#312E81",
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;
export type ThemeMode = "light" | "dark";

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkColors : lightColors;
}

export const Colors = lightColors;
