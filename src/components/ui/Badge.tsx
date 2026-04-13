import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../styles/colors";
import { Typography, Radii } from "../../styles/typography";

type BadgeVariant = "default" | "success" | "warning" | "error" | "primary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.gray100, text: Colors.gray600 },
  primary: { bg: Colors.primary50, text: Colors.primary600 },
  success: { bg: Colors.success50, text: Colors.success500 },
  warning: { bg: Colors.warning50, text: Colors.warning500 },
  error:   { bg: "#FEF2F2",       text: "#DC2626" },
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const v = badgeStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: "700",
  },
});
