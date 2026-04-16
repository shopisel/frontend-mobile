import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, ArrowUpDown, Tag, Navigation } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { formatCurrency } from "../../i18n/formatters";

type StoreOffer = {
  name: string;
  price: number;
  dist: string;
  promo: string | null;
  rating: number;
};

type PriceProduct = {
  id: number;
  name: string;
  badge: string;
  categoryKey: string;
  stores: StoreOffer[];
};

const products: PriceProduct[] = [
  {
    id: 1,
    name: "Organic Whole Milk 2L",
    badge: "ML",
    categoryKey: "categoryDairy",
    stores: [
      { name: "FreshMart", price: 2.99, dist: "0.3 km", promo: "10% off", rating: 4.5 },
      { name: "NatureMart", price: 3.29, dist: "0.7 km", promo: null, rating: 4.2 },
      { name: "CostPlus", price: 3.6, dist: "1.1 km", promo: null, rating: 3.9 },
      { name: "BioShop", price: 3.89, dist: "1.8 km", promo: "memberOnly", rating: 4.7 },
    ],
  },
  {
    id: 2,
    name: "Free-Range Eggs x12",
    badge: "EG",
    categoryKey: "categoryProtein",
    stores: [
      { name: "NatureMart", price: 3.99, dist: "0.7 km", promo: "20% off", rating: 4.4 },
      { name: "FreshMart", price: 4.49, dist: "0.3 km", promo: null, rating: 4.5 },
      { name: "CostPlus", price: 4.79, dist: "1.1 km", promo: null, rating: 3.9 },
    ],
  },
  {
    id: 3,
    name: "Sourdough Bread Loaf",
    badge: "BR",
    categoryKey: "categoryBakery",
    stores: [
      { name: "BakeryHub", price: 4.5, dist: "0.5 km", promo: "freshToday", rating: 4.8 },
      { name: "FreshMart", price: 4.99, dist: "0.3 km", promo: null, rating: 4.5 },
      { name: "CostPlus", price: 3.8, dist: "1.1 km", promo: null, rating: 3.9 },
    ],
  },
];

const categoryKeys = ["categoryAll", "categoryDairy", "categoryProduce", "categoryProtein", "categoryBakery", "categoryGrains"] as const;

export function PricesScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "distance">("price");
  const [selectedCat, setSelectedCat] = useState<(typeof categoryKeys)[number]>("categoryAll");
  const [mapView, setMapView] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchQuery.trim()
        ? product.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        : true;
      const matchesCategory = selectedCat === "categoryAll" || product.categoryKey === selectedCat;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCat]);

  const [selectedProductId, setSelectedProductId] = useState(products[0].id);

  useEffect(() => {
    if (!filteredProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0]?.id ?? products[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  const selectedProduct = filteredProducts.find((product) => product.id === selectedProductId) ?? filteredProducts[0] ?? products[0];

  const sortedStores = useMemo(
    () => [...selectedProduct.stores].sort((a, b) => (sortBy === "price" ? a.price - b.price : parseFloat(a.dist) - parseFloat(b.dist))),
    [selectedProduct, sortBy],
  );

  const savings = sortedStores.length ? sortedStores[sortedStores.length - 1].price - sortedStores[0].price : 0;

  const renderPromo = (promo: string | null) => {
    if (!promo) return null;
    if (promo === "memberOnly" || promo === "freshToday") {
      return t(`prices.${promo}`);
    }
    return promo;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>{t("prices.title")}</Text>
        <Text style={styles.subtitle}>{t("prices.subtitle")}</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.gray400} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("prices.searchPlaceholder")}
            placeholderTextColor={Colors.gray400}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {categoryKeys.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCat(cat)}
            style={[styles.catChip, cat === selectedCat && styles.catChipActive]}
          >
            <Text style={[styles.catText, cat === selectedCat && styles.catTextActive]}>{t(`prices.${cat}`)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={styles.sectionLabel}>{t("prices.selectProduct")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => setSelectedProductId(product.id)}
                style={[styles.productChip, product.id === selectedProduct.id && styles.productChipActive]}
                activeOpacity={0.85}
              >
                <Text style={styles.productBadge}>{product.badge}</Text>
                <Text style={[styles.productChipText, product.id === selectedProduct.id && { color: Colors.primary600 }]} numberOfLines={1}>
                  {product.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 20, marginVertical: 16 }}>
          <View style={styles.detailCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeText}>{selectedProduct.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCategory}>{t(`prices.${selectedProduct.categoryKey}`)}</Text>
                <Text style={styles.detailName}>{selectedProduct.name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
              <View>
                <Text style={styles.detailLabel}>{t("prices.bestPrice")}</Text>
                <Text style={styles.detailPrice}>{formatCurrency(sortedStores[0]?.price ?? 0, i18n.language)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.detailLabel}>{t("prices.maxSavings")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Tag size={14} color="#6EE7B7" />
                  <Text style={styles.detailSavings}>{t("prices.savingsOff", { amount: formatCurrency(savings, i18n.language) })}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.storeCount}>{t("prices.stores", { count: sortedStores.length })}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy(sortBy === "price" ? "distance" : "price")}>
              <ArrowUpDown size={14} color={Colors.gray500} />
              <Text style={styles.sortBtnText}>{sortBy === "price" ? t("prices.sortPrice") : t("prices.sortDistance")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortBtn, mapView && { backgroundColor: Colors.primary600 }]} onPress={() => setMapView(!mapView)}>
              <MapPin size={14} color={mapView ? "#fff" : Colors.gray500} />
              <Text style={[styles.sortBtnText, mapView && { color: "#fff" }]}>{t("prices.map")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {mapView && (
          <View style={styles.mapPlaceholder}>
            {sortedStores.map((store, index) => (
              <View
                key={store.name}
                style={[
                  styles.mapPin,
                  {
                    left: `${20 + index * 22}%` as const,
                    top: `${25 + (index % 2) * 35}%` as const,
                    backgroundColor: index === 0 ? Colors.primary600 : Colors.surface,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: index === 0 ? "#fff" : Colors.gray900 }}>
                  {formatCurrency(store.price, i18n.language)}
                </Text>
              </View>
            ))}
            <View style={styles.userPin}>
              <Navigation size={16} color="#fff" fill="#fff" />
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}>
          {sortedStores.map((store, index) => (
            <View key={store.name} style={styles.storeCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.rankBadge, index === 0 && { backgroundColor: Colors.primary600 }]}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: index === 0 ? "#fff" : Colors.gray500 }}>#{index + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <MapPin size={12} color={Colors.gray400} />
                      <Text style={styles.storeDist}>{store.dist}</Text>
                      <Text style={styles.storeRating}>{store.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.storePrice, index === 0 && { color: Colors.success500 }]}>{formatCurrency(store.price, i18n.language)}</Text>
                  {index > 0 && <Text style={styles.storeExtra}>{t("prices.more", { amount: formatCurrency(store.price - sortedStores[0].price, i18n.language) })}</Text>}
                </View>
              </View>
              {store.promo && (
                <View style={styles.promoBadge}>
                  <Tag size={12} color="#059669" />
                  <Text style={styles.promoText}>{renderPromo(store.promo)}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.gray900 },
  subtitle: { fontSize: 14, color: Colors.gray400, marginBottom: 16 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 44 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.gray900 },
  catScroll: { backgroundColor: Colors.surface, paddingVertical: 10, maxHeight: 52 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.lg, backgroundColor: Colors.gray100 },
  catChipActive: { backgroundColor: Colors.primary600 },
  catText: { fontSize: 13, fontWeight: "600", color: Colors.gray500 },
  catTextActive: { color: "#fff" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: Colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  productChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radii["2xl"], borderWidth: 2, borderColor: Colors.gray100, backgroundColor: Colors.surface, maxWidth: 170 },
  productChipActive: { borderColor: Colors.primary600, backgroundColor: Colors.primary50 },
  productBadge: { fontSize: 12, fontWeight: "800", color: Colors.gray900 },
  productChipText: { fontSize: 12, fontWeight: "600", color: Colors.gray500, flexShrink: 1 },
  detailCard: { borderRadius: Radii["3xl"], padding: 20, backgroundColor: Colors.primary600, shadowColor: Colors.primary600, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  detailBadge: { width: 56, height: 56, borderRadius: Radii.xl, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  detailBadgeText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  detailCategory: { fontSize: 12, color: "#C7D2FE" },
  detailName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  detailLabel: { fontSize: 11, color: "#C7D2FE" },
  detailPrice: { fontSize: 26, fontWeight: "800", color: "#fff" },
  detailSavings: { fontSize: 18, fontWeight: "700", color: "#6EE7B7" },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  storeCount: { fontSize: 14, fontWeight: "700", color: Colors.gray700 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.gray100, borderRadius: Radii.xl },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: Colors.gray600 },
  mapPlaceholder: { marginHorizontal: 20, marginBottom: 16, height: 160, borderRadius: Radii["2xl"], backgroundColor: Colors.primary50, position: "relative", overflow: "hidden" },
  mapPin: { position: "absolute", paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  userPin: { position: "absolute", bottom: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  storeCard: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  rankBadge: { width: 32, height: 32, borderRadius: Radii.lg, backgroundColor: Colors.gray100, alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: 14, fontWeight: "700", color: Colors.gray900 },
  storeDist: { fontSize: 12, color: Colors.gray400 },
  storeRating: { fontSize: 11, color: "#FBBF24" },
  storePrice: { fontSize: 20, fontWeight: "800", color: Colors.gray900 },
  storeExtra: { fontSize: 11, color: "#F87171" },
  promoBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.success50, borderRadius: Radii.lg, alignSelf: "flex-start" },
  promoText: { fontSize: 11, fontWeight: "600", color: "#059669" },
});
