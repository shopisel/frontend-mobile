import { useCallback, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Bell, Loader, LogOut, MapPin, Moon, RotateCcw, Shield, Star, Store, User as UserIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Radii, Typography } from "../../styles/typography";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useLists } from "../../api/useLists";
import { useTheme } from "../../theme/ThemeProvider";
import type { Product } from "../../api/useProducts";
import { getCategoryImage } from "../../utils/categoryImages";

interface ProfileScreenProps {
  onLogout: () => void;
  user?: {
    name?: string;
    email?: string;
    username?: string;
  } | null;
  favoriteProducts: Product[];
  favoritesLoading: boolean;
  favoritesError: string | null;
  onReloadFavorites: () => Promise<void>;
  initialTab?: "settings" | "favorites";
}

const preferredStores = [
  { name: "Continente" },
  { name: "Pingo Doce" },
];

export function ProfileScreen({
  onLogout,
  user,
  favoriteProducts,
  favoritesLoading,
  favoritesError,
  onReloadFavorites,
  initialTab = "settings",
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { colors, isDark, setDarkMode } = useTheme();
  const { getLists } = useLists();
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [dealNotifications, setDealNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [listsCount, setListsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"settings" | "favorites">(initialTab);
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
            { label: t("profile.statsSaved"), value: "0" },
            { label: t("profile.statsScans"), value: "0" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "settings" && styles.tabButtonActive]}
            onPress={() => setActiveTab("settings")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabButtonText, activeTab === "settings" && styles.tabButtonTextActive]}>
              {t("profile.settingsTab")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "favorites" && styles.tabButtonActive]}
            onPress={() => setActiveTab("favorites")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabButtonText, activeTab === "favorites" && styles.tabButtonTextActive]}>
              {t("profile.favoritesTab")}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "settings" ? (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Store size={16} color={colors.primary600} />
                <Text style={styles.sectionTitle}>{t("profile.preferredStores")}</Text>
              </View>
              {preferredStores.map((store) => (
                <View key={store.name} style={styles.storeRow}>
                  <View>
                    <Text style={styles.settingLabel}>{store.name}</Text>
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
          </>
        ) : (
          <View style={styles.sectionCard}>
            <View style={styles.favoritesHeader}>
              <View style={styles.sectionTitleRow}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.sectionTitle}>{t("profile.favoriteItemsTitle")}</Text>
              </View>
              <TouchableOpacity style={styles.reloadButton} onPress={() => void onReloadFavorites()} activeOpacity={0.85}>
                <RotateCcw size={14} color={colors.gray600} />
                <Text style={styles.reloadButtonText}>{t("profile.reloadFavorites")}</Text>
              </TouchableOpacity>
            </View>

            {favoritesLoading ? (
              <View style={styles.favoritesStateRow}>
                <Loader size={16} color={colors.gray400} />
                <Text style={styles.settingHint}>{t("profile.loadingFavorites")}</Text>
              </View>
            ) : favoritesError ? (
              <Text style={styles.errorText}>{favoritesError}</Text>
            ) : favoriteProducts.length === 0 ? (
              <Text style={styles.settingHint}>{t("profile.noFavorites")}</Text>
            ) : (
              <View style={styles.favoritesList}>
                {favoriteProducts.map((product) => {
                  const imageSource = getProductImage(product);

                  return (
                    <View key={product.id} style={styles.favoriteItemRow}>
                      <View style={styles.favoriteImageBox}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.favoriteImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.favoriteFallback}>{product.emoji || "P"}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingLabel}>{product.name}</Text>
                      </View>
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getProductImage(product: Product) {
  const raw = product.image?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return { uri: raw };
  return getCategoryImage(product.image, product.categoryId);
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
  tabRow: { flexDirection: "row", gap: 10, backgroundColor: colors.gray100, padding: 4, borderRadius: Radii["2xl"] },
  tabButton: { flex: 1, borderRadius: Radii.xl, paddingVertical: 10, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.surface },
  tabButtonText: { fontSize: Typography.sm, fontWeight: "700", color: colors.gray500 },
  tabButtonTextActive: { color: colors.gray900 },
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
  favoritesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  reloadButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: Radii.xl, backgroundColor: colors.gray100 },
  reloadButtonText: { fontSize: Typography.xs, fontWeight: "700", color: colors.gray600 },
  favoritesStateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  favoritesList: { gap: 10 },
  favoriteItemRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: Radii.xl, backgroundColor: colors.gray50 },
  favoriteImageBox: { width: 44, height: 44, borderRadius: Radii.xl, backgroundColor: colors.surface, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  favoriteImage: { width: "100%", height: "100%" },
  favoriteFallback: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  errorText: { fontSize: Typography.sm, fontWeight: "600", color: colors.error500 },
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
