import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Bell, LogOut, MapPin, Moon, Shield, Store, User as UserIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Radii, Typography } from "../../styles/typography";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useLists } from "../../api/useLists";
import { useTheme } from "../../theme/ThemeProvider";

interface ProfileScreenProps {
  onLogout: () => void;
  user?: {
    name?: string;
    email?: string;
    username?: string;
  } | null;
}

const preferredStores = [
  { name: "Continente", distance: "0.3 km" },
  { name: "Pingo Doce", distance: "0.8 km" },
];

export function ProfileScreen({ onLogout, user }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { colors, isDark, setDarkMode } = useTheme();
  const { getLists } = useLists();
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [dealNotifications, setDealNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [listsCount, setListsCount] = useState(0);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const displayName = user?.name || user?.username || t("common.user");
  const displayEmail = user?.email || t("common.noEmail");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadListsCount = async () => {
        try {
          const lists = await getLists();
          if (active) setListsCount(Array.isArray(lists) ? lists.length : 0);
        } catch (error) {
          console.error(error);
          if (active) setListsCount(0);
        }
      };

      void loadListsCount();

      return () => {
        active = false;
      };
    }, [getLists]),
  );

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
            <UserIcon size={18} color={colors.surface} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          {[
            { label: t("profile.statsLists"), value: String(listsCount) },
            { label: t("profile.statsScans"), value: "0" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Store size={16} color={colors.primary600} />
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
            <Bell size={16} color={colors.primary600} />
            <Text style={styles.sectionTitle}>{t("profile.notifications")}</Text>
          </View>
          <SettingRow
            label={t("profile.priceAlerts")}
            hint={t("profile.priceAlertsHint")}
            value={priceAlerts}
            onValueChange={setPriceAlerts}
            colors={colors}
          />
          <SettingRow
            label={t("profile.deals")}
            hint={t("profile.dealsHint")}
            value={dealNotifications}
            onValueChange={setDealNotifications}
            colors={colors}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MapPin size={16} color={colors.primary600} />
            <Text style={styles.sectionTitle}>{t("profile.privacy")}</Text>
          </View>
          <SettingRow
            label={t("profile.locationServices")}
            hint={t("profile.locationServicesHint")}
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            colors={colors}
          />
          <SettingRow
            label={t("profile.darkMode")}
            hint={t("profile.darkModeHint")}
            value={isDark}
            onValueChange={(value) => void setDarkMode(value)}
            colors={colors}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <UserIcon size={16} color={colors.primary600} />
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
            <Shield size={16} color={colors.gray600} />
            <Text style={styles.settingLabel}>{t("profile.privacyPolicy")}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Moon size={16} color={colors.gray600} />
            <Text style={styles.settingLabel}>{t("profile.appearance")}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.85}>
          <LogOut size={16} color={colors.error500} />
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
  colors,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const styles = useMemo(() => createStyles(colors, false), [colors]);

  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray300, true: colors.primary600 }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: { fontSize: Typography["3xl"], fontWeight: "700", color: colors.gray900, marginBottom: 16 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: Radii["3xl"],
    backgroundColor: colors.primary600,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Radii["2xl"],
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: colors.surface },
  userName: { fontSize: Typography.xl, fontWeight: "700", color: colors.surface },
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
    backgroundColor: colors.surface,
    borderRadius: Radii["2xl"],
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { fontSize: Typography["2xl"], fontWeight: "800", color: colors.gray900 },
  statLabel: { fontSize: Typography.sm, color: colors.gray500, marginTop: 2 },
  sectionCard: { backgroundColor: colors.surface, borderRadius: Radii["2xl"], padding: 16, gap: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: Typography.md, fontWeight: "700", color: colors.gray900 },
  storeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storeActive: { fontSize: Typography.sm, fontWeight: "700", color: colors.success500 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingLabel: { fontSize: Typography.base, fontWeight: "600", color: colors.gray900 },
  settingHint: { fontSize: Typography.sm, color: colors.gray500, marginTop: 3 },
  languageRow: { flexDirection: "row", gap: 10 },
  languageButton: { flex: 1, borderRadius: Radii.xl, borderWidth: 1, borderColor: colors.gray200, paddingVertical: 12, alignItems: "center" },
  languageButtonActive: { backgroundColor: colors.primary600, borderColor: colors.primary600 },
  languageButtonText: { fontSize: Typography.sm, fontWeight: "700", color: colors.gray700 },
  languageButtonTextActive: { color: colors.surface },
  simpleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutButton: {
    height: 50,
    borderRadius: Radii["2xl"],
    backgroundColor: isDark ? "#3A1717" : "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { fontSize: Typography.base, fontWeight: "700", color: colors.error500 },
  });
}
