import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";
import { Colors } from "../../styles/colors";
import { Typography, Radii } from "../../styles/typography";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : null, style]}
          placeholderTextColor={Colors.gray400}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: Typography.sm,
    fontWeight: "600",
    color: Colors.gray700,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray50,
    borderRadius: Radii["2xl"],
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  containerError: {
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.gray900,
  },
  icon: { flexShrink: 0 },
  error: {
    fontSize: Typography.xs,
    color: "#EF4444",
  },
});
