import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, ChevronDown, Filter, TrendingDown, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLists } from "../../api/useLists";
import { usePrices } from "../../api/usePrices";
import { useProducts, type Product } from "../../api/useProducts";
import { useStores, type StoreResponse } from "../../api/useStores";
import { formatCurrency } from "../../i18n/formatters";
import { Radii, Typography } from "../../styles/typography";
import { useTheme } from "../../theme/ThemeProvider";

type AlertItem = {
  id: string;
  product: string;
  emoji: string;
  dropPct: number;
  from: number;
  to: number;
  store: string;
  timeKey: "minutesAgo" | "hoursAgo";
  timeCount: number;
  expanded: boolean;
};

const savingsFilters = [0, 10, 20, 30];

export function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { getLists } = useLists();
  const { getPrices } = usePrices();
  const { getProductsByIds } = useProducts();
  const { getStores } = useStores();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [storeFilter, setStoreFilter] = useState(t("common.all"));
  const [minSavings, setMinSavings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const allStoresLabel = t("common.all");

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const lists = await getLists();
      const items = (Array.isArray(lists) ? lists : []).flatMap((list) => list.items ?? []);
      const productIds = [...new Set(items.map((item) => item.productId))];

      if (!productIds.length) {
        setAlerts([]);
        return;
      }

      const products = await getProductsByIds(productIds).catch(() => []);
      const productsById = (products ?? []).reduce<Record<string, Product>>((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});

      const priceGroups = await Promise.all(
        productIds.map(async (productId) => ({
          productId,
          prices: await getPrices(productId).catch(() => []),
        })),
      );

      const storeIds = [...new Set(priceGroups.flatMap((group) => group.prices.map((price) => price.storeId)))];
      const stores = storeIds.length ? await getStores({ ids: storeIds.join(",") }).catch(() => []) : [];
      const storesById = (stores ?? []).reduce<Record<string, StoreResponse>>((acc, store) => {
        acc[store.id] = store;
        return acc;
      }, {});

      const nextAlerts = priceGroups.flatMap(({ productId, prices }) => {
        const validPrices = (prices ?? []).filter((price) => typeof price.price === "number");
        if (validPrices.length < 2) return [];

        const sorted = [...validPrices].sort((a, b) => a.price - b.price);
        const best = sorted[0];
        const highest = sorted[sorted.length - 1];
        const savings = highest.price - best.price;

        if (savings <= 0) return [];

        const dropPct = Math.round((savings / highest.price) * 100);
        const productName = productsById[productId]?.name ?? t("common.unknownProduct");
        const updatedAt = best.updatedAt ? new Date(best.updatedAt) : null;
        const diffMs = updatedAt ? Math.max(Date.now() - updatedAt.getTime(), 0) : 0;
        const diffMinutes = Math.max(Math.round(diffMs / 60000), 1);
        const timeKey: AlertItem["timeKey"] = diffMinutes < 60 ? "minutesAgo" : "hoursAgo";
        const timeCount = timeKey === "minutesAgo" ? diffMinutes : Math.max(Math.round(diffMinutes / 60), 1);

        return [{
          id: `${productId}-${best.storeId}`,
          product: productName,
          emoji: getBadge(productName),
          dropPct,
          from: highest.price,
          to: best.price,
          store: storesById[best.storeId]?.name ?? t("common.unknownStore"),
          timeKey,
          timeCount,
          expanded: false,
        }];
      });

      setAlerts(nextAlerts.sort((a, b) => b.dropPct - a.dropPct));
    } catch (error) {
      console.error(error);
      setAlerts([]);
      setLoadError(error instanceof Error ? error.message : t("errors.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [getLists, getPrices, getProductsByIds, getStores, t]);

  useFocusEffect(
    useCallback(() => {
      void loadAlerts();
    }, [loadAlerts]),
  );

  const storeFilters = useMemo(
    () => [allStoresLabel, ...new Set(alerts.map((alert) => alert.store))],
    [alerts, allStoresLabel],
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesStore = storeFilter === allStoresLabel || alert.store === storeFilter;
      const matchesSavings = alert.dropPct >= minSavings;
      return matchesStore && matchesSavings;
    });
  }, [alerts, minSavings, storeFilter, allStoresLabel]);

  const totalSavings = filteredAlerts.reduce((sum, alert) => sum + (alert.from - alert.to), 0);

  const toggleExpand = (id: string) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, expanded: !alert.expanded } : alert)),
    );
  };

  const dismissAlert = (id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("alertsScreen.title")}</Text>
          <Text style={styles.subtitle}>
            {t("alertsScreen.subtitle", { count: filteredAlerts.length, amount: formatCurrency(totalSavings, i18n.language) })}
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters((value) => !value)}>
          <Filter size={18} color={colors.primary600} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>{t("alertsScreen.store")}</Text>
          <View style={styles.chipRow}>
            {storeFilters.map((store) => (
              <TouchableOpacity
                key={store}
                style={[styles.chip, storeFilter === store && styles.chipActive]}
                onPress={() => setStoreFilter(store)}
              >
                <Text style={[styles.chipText, storeFilter === store && styles.chipTextActive]}>{store}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>{t("alertsScreen.minimumDiscount")}</Text>
          <View style={styles.chipRow}>
            {savingsFilters.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, minSavings === value && styles.greenChipActive]}
                onPress={() => setMinSavings(value)}
              >
                <Text style={[styles.chipText, minSavings === value && styles.chipTextActive]}>
                  {value === 0 ? t("common.all") : `${value}%+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <TrendingDown size={16} color={colors.surface} />
        </View>
        <View>
          <Text style={styles.summaryTitle}>{t("alertsScreen.todayPriceDrops")}</Text>
          <Text style={styles.summarySubtitle}>{t("alertsScreen.discountedProducts", { count: filteredAlerts.length })}</Text>
        </View>
        <Text style={styles.summaryValue}>{formatCurrency(totalSavings, i18n.language)}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary600} />
          </View>
        ) : filteredAlerts.length ? (
          filteredAlerts.map((alert) => (
            <View key={alert.id} style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(alert.id)} activeOpacity={0.85}>
                <View style={styles.emojiBox}>
                  <Text style={styles.emoji}>{alert.emoji}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.productName}>{alert.product}</Text>
                  <Text style={styles.metaText}>
                    {alert.store} | {t(`alertsScreen.${alert.timeKey}`, { count: alert.timeCount })}
                  </Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.dropText}>{alert.dropPct}%</Text>
                  <Text style={styles.newPrice}>{formatCurrency(alert.to, i18n.language)}</Text>
                  <Text style={styles.oldPrice}>{formatCurrency(alert.from, i18n.language)}</Text>
                </View>
                <ChevronDown
                  size={18}
                  color={colors.gray400}
                  style={{ transform: [{ rotate: alert.expanded ? "180deg" : "0deg" }] }}
                />
              </TouchableOpacity>

              {alert.expanded && (
                <View style={styles.expanded}>
                  <Text style={styles.expandedText}>
                    {t("alertsScreen.currentBestPrice", { store: alert.store, amount: formatCurrency(alert.from - alert.to, i18n.language) })}
                  </Text>
                  <View style={styles.expandedActions}>
                    <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
                      <Text style={styles.addButtonText}>{t("alertsScreen.addToList")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dismissButton} onPress={() => dismissAlert(alert.id)} activeOpacity={0.85}>
                      <X size={16} color={colors.gray600} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Bell size={34} color={colors.gray300} />
            <Text style={styles.emptyTitle}>{loadError ? t("errors.requestFailed") : t("alertsScreen.noAlerts")}</Text>
            <Text style={styles.emptySubtitle}>{loadError ?? t("alertsScreen.adjustFilters")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getBadge(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "PK";
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  title: { fontSize: Typography["3xl"], fontWeight: "700", color: colors.gray900 },
  subtitle: { fontSize: Typography.base, color: colors.gray500, marginTop: 4 },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanel: { backgroundColor: colors.surface, paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  filterLabel: { fontSize: Typography.sm, fontWeight: "700", color: colors.gray500, textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.xl, backgroundColor: colors.gray100 },
  chipActive: { backgroundColor: colors.primary600 },
  greenChipActive: { backgroundColor: colors.success500 },
  chipText: { fontSize: Typography.sm, fontWeight: "600", color: colors.gray600 },
  chipTextActive: { color: colors.surface },
  summaryCard: {
    margin: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: Radii["2xl"],
    backgroundColor: colors.success50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.success500,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontSize: Typography.base, fontWeight: "700", color: colors.gray900 },
  summarySubtitle: { fontSize: Typography.sm, color: colors.gray500, marginTop: 2 },
  summaryValue: { marginLeft: "auto", fontSize: Typography["2xl"], fontWeight: "800", color: colors.success500 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: Radii["2xl"], overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: Radii.xl,
    backgroundColor: colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 16, fontWeight: "800", color: colors.gray900 },
  cardBody: { flex: 1 },
  productName: { fontSize: Typography.md, fontWeight: "700", color: colors.gray900 },
  metaText: { fontSize: Typography.sm, color: colors.gray500, marginTop: 3 },
  priceBox: { alignItems: "flex-end", marginRight: 4 },
  dropText: { fontSize: Typography.sm, fontWeight: "700", color: colors.success500 },
  newPrice: { fontSize: Typography.lg, fontWeight: "800", color: colors.gray900, marginTop: 3 },
  oldPrice: { fontSize: Typography.sm, color: colors.gray400, textDecorationLine: "line-through" },
  expanded: { borderTopWidth: 1, borderTopColor: colors.gray100, padding: 16, gap: 12 },
  expandedText: { fontSize: Typography.base, color: colors.gray600, lineHeight: 20 },
  expandedActions: { flexDirection: "row", gap: 10 },
  addButton: {
    flex: 1,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: colors.primary600,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { fontSize: Typography.base, fontWeight: "700", color: colors.surface },
  dismissButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingState: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: Typography.lg, fontWeight: "700", color: colors.gray700 },
  emptySubtitle: { fontSize: Typography.base, color: colors.gray500, textAlign: "center" },
  });
}
