import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from "react-native";
import { Search, Bell, Plus, ChevronRight, TrendingDown, ShoppingBag, Star, Zap } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Radii, Typography } from "../../styles/typography";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../i18n/formatters";
import { useLists, type ListResponse } from "../../api/useLists";
import { useProducts, type Product } from "../../api/useProducts";
import { useStores, type StoreResponse } from "../../api/useStores";
import { usePrices } from "../../api/usePrices";
import { getCategoryImage } from "../../utils/categoryImages";
import { useTheme } from "../../theme/ThemeProvider";

type ListPreviewItem = {
  id: number;
  name: string;
  qty: string;
  price: number;
  store: string;
  imageSource: ReturnType<typeof getCategoryImage>;
  badge: string;
};

type DealItem = {
  id: string;
  name: string;
  discount: number;
  price: number;
  original: number;
  store: string;
  color: string;
  badge: string;
};

type AlertItem = {
  id: string;
  name: string;
  drop: number;
  from: number;
  to: number;
  store: string;
};

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
  onOpenList?: (listId: string) => void;
  favoriteProducts: Product[];
  favoritesLoading: boolean;
  favoritesError: string | null;
}

export function HomeScreen({ onNavigate, onOpenList, favoriteProducts, favoritesLoading, favoritesError }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { getLists } = useLists();
  const { getProductsByIds } = useProducts();
  const { getStores } = useStores();
  const { getPrices } = usePrices();
  const [quickAdd, setQuickAdd] = useState("");
  const [lists, setLists] = useState<ListResponse[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [storesById, setStoresById] = useState<Record<string, StoreResponse>>({});
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayName = user?.name ?? user?.username ?? t("common.user");
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const primaryList = useMemo(() => {
    if (!lists.length) return null;
    return [...lists].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [lists]);

  const listItems = useMemo<ListPreviewItem[]>(() => {
    if (!primaryList) return [];

    return (primaryList.items ?? []).slice(0, 3).map((item, index) => {
      const product = productsById[item.productId];
      const store = storesById[item.storeId];
      const quantity = item.quantity ?? 0;

      return {
        id: item.id,
        name: product?.name ?? t("common.unknownProduct"),
        qty: `${quantity} ${t("lists.quantityUnit")}`,
        price: item.price * quantity,
        store: store?.name ?? t("common.unknownStore"),
        imageSource: getCategoryImage(product?.image, product?.categoryId ?? product?.name),
        badge: getBadge(product?.name),
      };
    });
  }, [primaryList, productsById, storesById, t]);

  const totalItemsCount = useMemo(
    () => lists.reduce((sum, list) => sum + (list.items?.length ?? 0), 0),
    [lists],
  );

  const savedAmount = useMemo(
    () => formatCurrency(alerts.reduce((sum, alert) => sum + Math.max(alert.from - alert.to, 0), 0), i18n.language),
    [alerts, i18n.language],
  );

  const favoritePreview = useMemo(() => favoriteProducts.slice(0, 4), [favoriteProducts]);

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextLists = await getLists();
      const normalizedLists = Array.isArray(nextLists) ? nextLists : [];
      setLists(normalizedLists);

      const currentList = [...normalizedLists].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const currentItems = currentList?.items ?? [];
      const productIds = [...new Set(currentItems.map((item) => item.productId))];
      const storeIds = [...new Set(currentItems.map((item) => item.storeId))];

      const [products, stores] = await Promise.all([
        productIds.length ? getProductsByIds(productIds).catch(() => []) : Promise.resolve([]),
        storeIds.length ? getStores({ ids: storeIds.join(",") }).catch(() => []) : Promise.resolve([]),
      ]);

      const nextProductsById = (products ?? []).reduce<Record<string, Product>>((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
      const nextStoresById = (stores ?? []).reduce<Record<string, StoreResponse>>((acc, store) => {
        acc[store.id] = store;
        return acc;
      }, {});

      setProductsById(nextProductsById);
      setStoresById(nextStoresById);

      if (!currentItems.length) {
        setDeals([]);
        setAlerts([]);
        return;
      }

      const priceSnapshots = await Promise.all(
        currentItems.slice(0, 3).map(async (item, index) => {
          const prices = await getPrices(item.productId).catch(() => []);
          const validPrices = (prices ?? []).filter((price) => typeof price.price === "number");
          if (!validPrices.length) return null;

          const sortedPrices = [...validPrices].sort((a, b) => a.price - b.price);
          const best = sortedPrices[0];
          const highest = sortedPrices[sortedPrices.length - 1];
          const basePrice = Math.max(item.price, highest.price);
          const savings = Math.max(basePrice - best.price, 0);
          const discount = basePrice > 0 ? Math.round((savings / basePrice) * 100) : 0;
          const productName = nextProductsById[item.productId]?.name ?? t("common.unknownProduct");
          const bestStoreName = nextStoresById[best.storeId]?.name ?? t("common.unknownStore");

          return {
            id: item.productId,
            index,
            name: productName,
            bestPrice: best.price,
            basePrice,
            savings,
            discount,
            store: bestStoreName,
            badge: getBadge(productName),
          };
        }),
      );

      const nextSnapshots = priceSnapshots.filter((snapshot): snapshot is NonNullable<typeof snapshot> => Boolean(snapshot));

      setDeals(
        nextSnapshots
          .filter((snapshot) => snapshot.savings > 0)
          .map((snapshot) => ({
            id: snapshot.id,
            name: snapshot.name,
            discount: snapshot.discount,
            price: snapshot.bestPrice,
            original: snapshot.basePrice,
            store: snapshot.store,
            color: getCardColor(snapshot.index, colors),
            badge: snapshot.badge,
          })),
      );

      setAlerts(
        nextSnapshots
          .filter((snapshot) => snapshot.savings > 0)
          .map((snapshot) => ({
            id: snapshot.id,
            name: snapshot.name,
            drop: snapshot.discount,
            from: snapshot.basePrice,
            to: snapshot.bestPrice,
            store: snapshot.store,
          })),
      );
    } catch (error) {
      console.error(error);
      setLists([]);
      setProductsById({});
      setStoresById({});
      setDeals([]);
      setAlerts([]);
      setLoadError(error instanceof Error ? error.message : t("lists.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [colors, getLists, getPrices, getProductsByIds, getStores, t]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const openPrimaryList = () => {
    if (primaryList?.id) {
      onOpenList?.(primaryList.id);
      return;
    }

    onNavigate("lists");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t("home.greeting")}</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => onNavigate("alerts")}>
            <Bell size={20} color={colors.primary600} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickAddRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.gray400} />
          <TextInput
            value={quickAdd}
            onChangeText={setQuickAdd}
            placeholder={t("home.quickAddPlaceholder")}
            placeholderTextColor={colors.gray400}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate("lists")} activeOpacity={0.85}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.statsRow}>
          {[
            { label: t("home.items"), value: String(totalItemsCount), Icon: ShoppingBag, color: colors.primary600, bg: colors.purpleCard },
            { label: t("home.saved"), value: savedAmount, Icon: TrendingDown, color: colors.success500, bg: colors.greenCard },
            { label: t("home.alerts"), value: String(alerts.length), Icon: Zap, color: colors.warning500, bg: colors.warning50 },
          ].map(({ label, value, Icon, color, bg }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: bg }]}> 
              <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}> 
                <Icon size={16} color={color} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t("home.myLastList")}</Text>
              {primaryList?.name ? <Text style={styles.sectionSubtitle}>{primaryList.name}</Text> : null}
            </View>
            <TouchableOpacity onPress={openPrimaryList} style={styles.seeAll}>
              <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
              <ChevronRight size={16} color={colors.primary600} />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {isLoading ? (
              <View style={styles.emptyStateCard}>
                <ActivityIndicator color={colors.primary600} />
              </View>
            ) : listItems.length ? (
              listItems.map((item, idx) => (
                <View key={item.id} style={[styles.listRow, idx < listItems.length - 1 && styles.listRowBorder]}>
                  <View style={styles.productImageBox}>
                    {item.imageSource ? (
                      <Image source={item.imageSource} style={styles.productImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.emoji}>
                        <Text style={styles.emojiText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>{item.qty} | {item.store}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price, i18n.language)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>
                  {loadError ?? (primaryList ? t("home.noListItems") : t("lists.noLists"))}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.favoriteItems")}</Text>
            <TouchableOpacity onPress={() => onNavigate("profile")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
              <ChevronRight size={16} color={colors.primary600} />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {favoritesLoading ? (
              <View style={styles.emptyStateCard}>
                <ActivityIndicator color={colors.primary600} />
              </View>
            ) : favoritesError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>{favoritesError}</Text>
              </View>
            ) : favoritePreview.length ? (
              favoritePreview.map((product, idx) => {
                const imageSource = getProductImage(product);

                return (
                  <View key={product.id} style={[styles.listRow, idx < favoritePreview.length - 1 && styles.listRowBorder]}>
                    <View style={styles.productImageBox}>
                      {imageSource ? (
                        <Image source={imageSource} style={styles.productImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.emoji}>
                          <Text style={styles.emojiText}>{getBadge(product.name)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{product.name}</Text>
                    </View>
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>{t("home.noFavorites")}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}> 
            <Text style={styles.sectionTitle}>{t("home.nearbyDeals")}</Text>
            <TouchableOpacity onPress={() => onNavigate("prices")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
              <ChevronRight size={16} color={colors.primary600} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {deals.length ? (
              deals.map((deal) => (
                <TouchableOpacity key={deal.id} style={[styles.dealCard, { backgroundColor: deal.color }]} onPress={() => onNavigate("prices")} activeOpacity={0.85}>
                  <Text style={styles.dealBadgeCode}>{deal.badge}</Text>
                  <Text style={styles.dealName}>{deal.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.dealPrice}>{formatCurrency(deal.price, i18n.language)}</Text>
                    <Text style={styles.dealOriginal}>{formatCurrency(deal.original, i18n.language)}</Text>
                  </View>
                  <Text style={styles.dealStore}>{deal.store}</Text>
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>{t("home.discountOff", { value: deal.discount })}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyHorizontalCard}>
                <Text style={styles.emptyStateText}>{t("home.noDeals")}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={[styles.section, { paddingBottom: 24 }]}> 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.activeAlerts")}</Text>
            <TouchableOpacity onPress={() => onNavigate("alerts")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
              <ChevronRight size={16} color={colors.primary600} />
            </TouchableOpacity>
          </View>
          <View style={{ gap: 10 }}>
            {alerts.length ? (
              alerts.map((alert) => (
                <View key={alert.id} style={styles.alertRow}>
                  <View style={styles.alertIcon}>
                    <TrendingDown size={16} color={colors.success500} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertName}>{alert.name}</Text>
                    <Text style={styles.alertStore}>{alert.store}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.alertDrop}>{t("home.priceDrop", { value: alert.drop })}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.alertTo}>{formatCurrency(alert.to, i18n.language)}</Text>
                      <Text style={styles.alertFrom}>{formatCurrency(alert.from, i18n.language)}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>{t("home.noAlerts")}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getBadge(value?: string) {
  return (value ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "PK";
}

function getProductImage(product: Product) {
  const raw = product.image?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return { uri: raw };
  return getCategoryImage(product.image, product.categoryId);
}

function getCardColor(index: number, colors: ReturnType<typeof useTheme>["colors"]) {
  const palette = [colors.greenCard, colors.blueCard, colors.orangeCard, colors.purpleCard];
  return palette[index % palette.length];
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.surface },
    greeting: { fontSize: 13, color: colors.gray400 },
    name: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
    bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary50, alignItems: "center", justifyContent: "center" },
    bellDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary600, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    quickAddRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surface },
    searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 48 },
    searchInput: { flex: 1, fontSize: Typography.base, color: colors.gray900 },
    addBtn: { width: 48, height: 48, borderRadius: Radii["2xl"], backgroundColor: colors.primary600, alignItems: "center", justifyContent: "center", shadowColor: colors.primary600, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
    statCard: { flex: 1, borderRadius: Radii["2xl"], padding: 12, gap: 4 },
    statIcon: { width: 32, height: 32, borderRadius: Radii.lg, alignItems: "center", justifyContent: "center" },
    statValue: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
    statLabel: { fontSize: 11, color: colors.gray500 },
    section: { paddingHorizontal: 20, marginBottom: 16 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
    sectionSubtitle: { fontSize: 12, color: colors.gray500, marginTop: 2 },
    seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
    seeAllText: { fontSize: 13, fontWeight: "600", color: colors.primary600 },
    card: { backgroundColor: colors.surface, borderRadius: Radii["3xl"], overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
    productImageBox: { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    productImage: { width: "100%", height: "100%" },
    emoji: { width: 40, height: 40, borderRadius: Radii.lg, alignItems: "center", justifyContent: "center" },
    emojiText: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
    itemName: { fontSize: 14, fontWeight: "600", color: colors.gray900 },
    itemSub: { fontSize: 12, color: colors.gray400 },
    itemPrice: { fontSize: 14, fontWeight: "700", color: colors.success500 },
    dealCard: { width: 176, borderRadius: Radii["3xl"], padding: 16, flexShrink: 0, position: "relative", overflow: "hidden" },
    dealBadgeCode: { fontSize: 18, fontWeight: "800", color: colors.gray900, marginBottom: 6 },
    dealName: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 },
    dealPrice: { fontSize: 16, fontWeight: "800", color: colors.success500 },
    dealOriginal: { fontSize: 11, color: colors.gray400, textDecorationLine: "line-through" },
    dealStore: { fontSize: 11, color: colors.gray500, marginTop: 8 },
    dealBadge: { position: "absolute", top: 12, right: 12, backgroundColor: colors.success500, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
    dealBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
    alertRow: { backgroundColor: colors.surface, borderRadius: Radii["2xl"], paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    alertIcon: { width: 32, height: 32, borderRadius: Radii.lg, backgroundColor: colors.success50, alignItems: "center", justifyContent: "center" },
    alertName: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
    alertStore: { fontSize: 12, color: colors.gray400 },
    alertDrop: { fontSize: 11, fontWeight: "700", color: colors.success500 },
    alertTo: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
    alertFrom: { fontSize: 11, color: colors.gray400, textDecorationLine: "line-through" },
    emptyStateCard: { paddingHorizontal: 16, paddingVertical: 24, alignItems: "center", justifyContent: "center" },
    emptyHorizontalCard: { width: 220, borderRadius: Radii["3xl"], padding: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
    emptyStateText: { fontSize: 13, color: colors.gray500, textAlign: "center" },
  });
}
