import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import { Colors } from "../../styles/colors";
import { Typography, FontWeight, Radii } from "../../styles/typography";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:     { bg: Colors.primary600, text: "#FFFFFF" },
  secondary:   { bg: Colors.primary50,  text: Colors.primary600 },
  ghost:       { bg: "transparent",     text: Colors.gray600 },
  destructive: { bg: "#FEF2F2",         text: "#DC2626" },
};

const sizeStyles: Record<Size, { height: number; px: number; fontSize: number }> = {
  sm: { height: 36, px: 12, fontSize: Typography.sm },
  md: { height: 44, px: 16, fontSize: Typography.base },
  lg: { height: 52, px: 20, fontSize: Typography.md },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.px,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii["2xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
});
