import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { Lock, ShieldCheck, ShoppingCart } from "lucide-react-native";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { useTranslation } from "react-i18next";

interface AuthScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  loading: boolean;
  configError?: string | null;
}

export function AuthScreen({ onLogin, onRegister, loading, configError }: AuthScreenProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <ShoppingCart size={32} color="#fff" strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{t("auth.title")}</Text>
        <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
      </View>

      <View style={styles.infoCard}>
        {[
          {
            Icon: ShieldCheck,
            title: t("auth.secureLoginTitle"),
            body: t("auth.secureLoginBody"),
          },
          {
            Icon: Lock,
            title: t("auth.refreshTitle"),
            body: t("auth.refreshBody"),
          },
        ].map(({ Icon, title, body }) => (
          <View key={title} style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Icon size={20} color={Colors.primary600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>{title}</Text>
              <Text style={styles.infoBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {configError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{configError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, (loading || Boolean(configError)) && { opacity: 0.6 }]}
          onPress={onLogin}
          disabled={loading || Boolean(configError)}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>{t("auth.continue")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, (loading || Boolean(configError)) && { opacity: 0.6 }]}
          onPress={onRegister}
          disabled={loading || Boolean(configError)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnSecondaryText}>{t("auth.createAccount")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary50,
  },
  top: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.gray900,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  infoCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: Radii["3xl"],
    borderWidth: 1,
    borderColor: Colors.primary100,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary50,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTitle: { fontSize: Typography.base, fontWeight: "700", color: Colors.gray900 },
  infoBody: { fontSize: 13, color: Colors.gray500, marginTop: 2, lineHeight: 18 },
  actions: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  errorBox: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: 16,
  },
  errorText: { fontSize: 13, fontWeight: "600", color: "#DC2626" },
  btnPrimary: {
    height: 52,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.primary700,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  btnSecondary: {
    height: 52,
    borderRadius: Radii["2xl"],
    borderWidth: 2,
    borderColor: Colors.primary100,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: { fontSize: 16, fontWeight: "600", color: Colors.primary700 },
});
