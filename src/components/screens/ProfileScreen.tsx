import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Bell, LogOut, MapPin, Moon, Shield, Store, User as UserIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../i18n/LanguageProvider";

interface ProfileScreenProps {
  onLogout: () => void;
  user?: {
    name?: string;
    email?: string;
    username?: string;
  } | null;
}

const preferredStores = [
  { name: "FreshMart", distance: "0.3 km" },
  { name: "NatureMart", distance: "0.7 km" },
  { name: "CostPlus", distance: "1.1 km" },
];

export function ProfileScreen({ onLogout, user }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [dealNotifications, setDealNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const displayName = user?.name || user?.username || t("common.user");
  const displayEmail = user?.email || t("common.noEmail");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 28 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("profile.title")}</Text>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "U"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>
          <View style={styles.userIcon}>
            <UserIcon size={18} color={Colors.surface} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          {[
            { label: t("profile.statsLists"), value: "8" },
            { label: t("profile.statsSaved"), value: "€142" },
            { label: t("profile.statsScans"), value: "34" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Store size={16} color={Colors.primary600} />
            <Text style={styles.sectionTitle}>{t("profile.preferredStores")}</Text>
          </View>
          {preferredStores.map((store) => (
            <View key={store.name} style={styles.storeRow}>
              <View>
                <Text style={styles.settingLabel}>{store.name}</Text>
                <Text style={styles.settingHint}>{store.distance}</Text>
              </View>
              <Text style={styles.storeActive}>{t("profile.active")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Bell size={16} color={Colors.primary600} />
            <Text style={styles.sectionTitle}>{t("profile.notifications")}</Text>
          </View>
          <SettingRow
            label={t("profile.priceAlerts")}
            hint={t("profile.priceAlertsHint")}
            value={priceAlerts}
            onValueChange={setPriceAlerts}
          />
          <SettingRow
            label={t("profile.deals")}
            hint={t("profile.dealsHint")}
            value={dealNotifications}
            onValueChange={setDealNotifications}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MapPin size={16} color={Colors.primary600} />
            <Text style={styles.sectionTitle}>{t("profile.privacy")}</Text>
          </View>
          <SettingRow
            label={t("profile.locationServices")}
            hint={t("profile.locationServicesHint")}
            value={locationEnabled}
            onValueChange={setLocationEnabled}
          />
          <SettingRow
            label={t("profile.darkMode")}
            hint={t("profile.darkModeHint")}
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <UserIcon size={16} color={Colors.primary600} />
            <Text style={styles.sectionTitle}>{t("profile.language")}</Text>
          </View>
          <Text style={styles.settingHint}>{t("profile.languageHint")}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[styles.languageButton, language === "pt" && styles.languageButtonActive]}
              onPress={() => void setLanguage("pt")}
              activeOpacity={0.85}
            >
              <Text style={[styles.languageButtonText, language === "pt" && styles.languageButtonTextActive]}>{t("profile.portuguese")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, language === "en" && styles.languageButtonActive]}
              onPress={() => void setLanguage("en")}
              activeOpacity={0.85}
            >
              <Text style={[styles.languageButtonText, language === "en" && styles.languageButtonTextActive]}>{t("profile.english")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.simpleRow}>
            <Shield size={16} color={Colors.gray600} />
            <Text style={styles.settingLabel}>{t("profile.privacyPolicy")}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Moon size={16} color={Colors.gray600} />
            <Text style={styles.settingLabel}>{t("profile.appearance")}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.85}>
          <LogOut size={16} color={Colors.error500} />
          <Text style={styles.logoutText}>{t("profile.signOut")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.gray300, true: Colors.primary600 }}
        thumbColor={Colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: { fontSize: Typography["3xl"], fontWeight: "700", color: Colors.gray900, marginBottom: 16 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: Radii["3xl"],
    backgroundColor: Colors.primary600,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Radii["2xl"],
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: Colors.surface },
  userName: { fontSize: Typography.xl, fontWeight: "700", color: Colors.surface },
  userEmail: { fontSize: Typography.sm, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  userIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii["2xl"],
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { fontSize: Typography["2xl"], fontWeight: "800", color: Colors.gray900 },
  statLabel: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], padding: 16, gap: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: Typography.md, fontWeight: "700", color: Colors.gray900 },
  storeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storeActive: { fontSize: Typography.sm, fontWeight: "700", color: Colors.success500 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingLabel: { fontSize: Typography.base, fontWeight: "600", color: Colors.gray900 },
  settingHint: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 3 },
  languageRow: { flexDirection: "row", gap: 10 },
  languageButton: { flex: 1, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.gray200, paddingVertical: 12, alignItems: "center" },
  languageButtonActive: { backgroundColor: Colors.primary600, borderColor: Colors.primary600 },
  languageButtonText: { fontSize: Typography.sm, fontWeight: "700", color: Colors.gray700 },
  languageButtonTextActive: { color: Colors.surface },
  simpleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutButton: {
    height: 50,
    borderRadius: Radii["2xl"],
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { fontSize: Typography.base, fontWeight: "700", color: Colors.error500 },
});
