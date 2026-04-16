import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ArrowUpDown, Loader, MapPin, Navigation, Search, Tag } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { usePrices } from "../../api/usePrices";
import { useProducts, type Category, type Product } from "../../api/useProducts";
import { useStores } from "../../api/useStores";
import { formatCurrency } from "../../i18n/formatters";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { getCategoryImage } from "../../utils/categoryImages";

type StoreRow = {
  id: string;
  name: string;
  price: number;
};

export function PricesScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { searchProducts, getMainCategories, getSubCategories, getProductsByCategory } = useProducts();
  const { getPrices } = usePrices();
  const { getStores } = useStores();

  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState<Category | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeRows, setStoreRows] = useState<StoreRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "distance">("price");
  const [mapView, setMapView] = useState(false);
  const [isLoadingCats, setIsLoadingCats] = useState(false);
  const [isLoadingSubCats, setIsLoadingSubCats] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetCategorySelection = () => {
    setSelectedMainCat(null);
    setSelectedSubCat(null);
    setSubCategories([]);
  };

  const resetProductSelection = () => {
    setProducts([]);
    setSelectedProduct(null);
    setStoreRows([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      resetCategorySelection();
      resetProductSelection();
    }
  };

  const handleSelectMainCategory = (category: Category | null) => {
    if (searchQuery.trim()) setSearchQuery("");
    setSelectedMainCat(category);
  };

  const handleSelectSubCategory = (category: Category) => {
    if (searchQuery.trim()) setSearchQuery("");
    setSelectedSubCat(category);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoadingCats(true);
      setError(null);
      try {
        const data = await getMainCategories();
        if (cancelled) return;
        setMainCategories(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("errors.requestFailed"));
      } finally {
        if (!cancelled) setIsLoadingCats(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [getMainCategories, t]);

  useEffect(() => {
    let cancelled = false;

    const loadSubCategories = async (mainCategoryId: string) => {
      setIsLoadingSubCats(true);
      setError(null);
      try {
        const data = await getSubCategories(mainCategoryId);
        if (cancelled) return;
        setSubCategories(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setSubCategories([]);
        }
      } finally {
        if (!cancelled) setIsLoadingSubCats(false);
      }
    };

    setSelectedSubCat(null);
    setSubCategories([]);
    resetProductSelection();

    if (selectedMainCat) {
      void loadSubCategories(selectedMainCat.id);
    }

    return () => {
      cancelled = true;
    };
  }, [getSubCategories, selectedMainCat, t]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoadingProducts(true);
      setError(null);
      try {
        const data = await searchProducts(query);
        if (cancelled) return;
        setProducts(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchProducts, searchQuery, t]);

  useEffect(() => {
    if (searchQuery.trim()) return;

    let cancelled = false;

    const loadProducts = async (subCategoryId: string) => {
      setIsLoadingProducts(true);
      setError(null);
      try {
        const data = await getProductsByCategory(subCategoryId);
        if (cancelled) return;
        setProducts(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };

    resetProductSelection();

    if (selectedSubCat) {
      void loadProducts(selectedSubCat.id);
    }

    return () => {
      cancelled = true;
    };
  }, [getProductsByCategory, searchQuery, selectedSubCat, t]);

  useEffect(() => {
    if (!products.length) {
      setSelectedProduct(null);
      setStoreRows([]);
      return;
    }

    if (!selectedProduct || !products.some((product) => product.id === selectedProduct.id)) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      setStoreRows([]);
      return;
    }

    let cancelled = false;

    const loadStores = async () => {
      setIsLoadingStores(true);
      setError(null);
      try {
        const prices = await getPrices(selectedProduct.id);
        const storeIds = Array.from(new Set((prices ?? []).map((price) => price.storeId)));
        const stores = storeIds.length ? await getStores({ ids: storeIds.join(",") }) : [];
        const storeNames = new Map((stores ?? []).map((store) => [store.id, store.name] as const));
        const rows: StoreRow[] = (prices ?? []).map((price) => ({
          id: price.storeId,
          name: storeNames.get(price.storeId) ?? price.storeId,
          price: price.price,
        }));

        if (cancelled) return;
        setStoreRows(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setStoreRows([]);
        }
      } finally {
        if (!cancelled) setIsLoadingStores(false);
      }
    };

    void loadStores();
    return () => {
      cancelled = true;
    };
  }, [getPrices, getStores, selectedProduct, t]);

  const sortedStores = useMemo(() => {
    return [...storeRows].sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      return a.name.localeCompare(b.name);
    });
  }, [sortBy, storeRows]);

  const savings = useMemo(() => {
    if (sortedStores.length < 2) return 0;
    return sortedStores[sortedStores.length - 1].price - sortedStores[0].price;
  }, [sortedStores]);

  const getProductImageSource = (product: Product) => {
    const raw = product.image?.trim();
    if (raw && /^https?:\/\//i.test(raw)) return { uri: raw };
    return getCategoryImage(product.image, product.name);
  };

  const emptyProductsMessage = searchQuery.trim()
    ? t("prices.noProductsFound")
    : selectedMainCat && !selectedSubCat
      ? t("prices.selectSubcategory")
      : t("prices.noProductsToShow");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>{t("prices.title")}</Text>
        <Text style={styles.subtitle}>{t("prices.subtitle")}</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.gray400} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={t("prices.searchPlaceholder")}
            placeholderTextColor={Colors.gray400}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
        <TouchableOpacity
          onPress={() => handleSelectMainCategory(null)}
          style={[styles.catChip, selectedMainCat === null && styles.catChipActive]}
          activeOpacity={0.85}
        >
          <Text style={[styles.catText, selectedMainCat === null && styles.catTextActive]}>{t("common.all")}</Text>
        </TouchableOpacity>

        {isLoadingCats ? (
          <View style={styles.loadingInline}>
            <Loader size={16} color={Colors.gray400} />
            <Text style={styles.loadingInlineText}>{t("prices.loading")}</Text>
          </View>
        ) : (
          mainCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleSelectMainCategory(category)}
              style={[styles.catChip, category.id === selectedMainCat?.id && styles.catChipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.catText, category.id === selectedMainCat?.id && styles.catTextActive]}>{category.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedMainCat && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCatScroll} contentContainerStyle={styles.catScrollContent}>
          {isLoadingSubCats ? (
            <View style={styles.loadingInline}>
              <Loader size={16} color={Colors.gray400} />
              <Text style={styles.loadingInlineText}>{t("prices.loading")}</Text>
            </View>
          ) : subCategories.length > 0 ? (
            subCategories.map((subCategory) => (
              <TouchableOpacity
                key={subCategory.id}
                onPress={() => handleSelectSubCategory(subCategory)}
                style={[styles.subCatChip, subCategory.id === selectedSubCat?.id && styles.subCatChipActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.subCatText, subCategory.id === selectedSubCat?.id && styles.subCatTextActive]}>{subCategory.name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyInline}>{t("prices.noSubcategories")}</Text>
          )}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("prices.selectProduct")}</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {isLoadingProducts ? (
            <View style={styles.loadingRow}>
              <Loader size={16} color={Colors.gray400} />
              <Text style={styles.loadingText}>{t("prices.loadingProducts")}</Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsWrap}>
              {products.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                const imageSource = getProductImageSource(product);

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, isSelected && styles.productCardActive]}
                    onPress={() => setSelectedProduct(product)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.productRow}>
                      <View style={styles.productImageBox}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.productFallback}>{product.emoji ?? "PK"}</Text>
                        )}
                      </View>
                      <Text style={[styles.productName, isSelected && styles.productNameActive]} numberOfLines={2}>
                        {product.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>{emptyProductsMessage}</Text>
          )}
        </View>

        <View style={styles.section}>
          {selectedProduct ? (
            <View style={styles.detailCard}>
              <View style={styles.detailTopRow}>
                <View style={styles.detailImageBox}>
                  {getProductImageSource(selectedProduct) ? (
                    <Image source={getProductImageSource(selectedProduct)!} style={styles.detailImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.detailFallback}>{selectedProduct.emoji ?? "PK"}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailCategory}>{selectedSubCat?.name ?? selectedMainCat?.name ?? t("common.all")}</Text>
                  <Text style={styles.detailName}>{selectedProduct.name}</Text>
                </View>
              </View>

              <View style={styles.detailStatsRow}>
                <View>
                  <Text style={styles.detailLabel}>{t("prices.bestPrice")}</Text>
                  <Text style={styles.detailPrice}>{sortedStores[0] ? formatCurrency(sortedStores[0].price, i18n.language) : "-"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.detailLabel}>{t("prices.maxSavings")}</Text>
                  <View style={styles.detailSavingsRow}>
                    <Tag size={14} color="#6EE7B7" />
                    <Text style={styles.detailSavings}>{sortedStores.length >= 2 ? t("prices.savingsOff", { amount: formatCurrency(savings, i18n.language) }) : "-"}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>{t("prices.noProductSelected")}</Text>
              <Text style={styles.placeholderText}>{t("prices.pickProduct")}</Text>
            </View>
          )}
        </View>

        <View style={styles.sortRow}>
          <View style={styles.storeCountRow}>
            <Text style={styles.storeCount}>{t("prices.stores", { count: sortedStores.length })}</Text>
            {isLoadingStores && <Loader size={16} color={Colors.gray400} />}
          </View>
          <View style={styles.sortButtonsRow}>
            <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy(sortBy === "price" ? "distance" : "price")} activeOpacity={0.85}>
              <ArrowUpDown size={14} color={Colors.gray500} />
              <Text style={styles.sortBtnText}>{sortBy === "price" ? t("prices.sortPrice") : t("prices.sortDistance")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortBtn, mapView && styles.mapBtnActive]} onPress={() => setMapView(!mapView)} activeOpacity={0.85}>
              <MapPin size={14} color={mapView ? Colors.surface : Colors.gray500} />
              <Text style={[styles.sortBtnText, mapView && styles.mapBtnTextActive]}>{t("prices.map")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {mapView && (
          <View style={styles.mapPlaceholder}>
            {sortedStores.map((store, index) => (
              <View
                key={store.id}
                style={[
                  styles.mapPin,
                  {
                    left: `${20 + index * 22}%`,
                    top: `${25 + (index % 2) * 35}%`,
                    backgroundColor: index === 0 ? Colors.primary600 : Colors.surface,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: index === 0 ? Colors.surface : Colors.gray900 }}>
                  {formatCurrency(store.price, i18n.language)}
                </Text>
              </View>
            ))}
            <View style={styles.userPin}>
              <Navigation size={16} color={Colors.surface} fill={Colors.surface} />
            </View>
          </View>
        )}

        <View style={styles.storesSection}>
          {sortedStores.length === 0 ? (
            <Text style={styles.emptyStateText}>{selectedProduct ? t("prices.noPrices") : t("prices.selectProductToSeePrices")}</Text>
          ) : (
            sortedStores.map((store, index) => (
              <View key={`${selectedProduct?.id ?? "none"}-${store.id}`} style={styles.storeCard}>
                <View style={styles.storeHeaderRow}>
                  <View style={styles.storeLeftRow}>
                    <View style={[styles.rankBadge, index === 0 && styles.rankBadgeActive]}>
                      <Text style={[styles.rankText, index === 0 && styles.rankTextActive]}>#{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.storeName}>{store.name}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.storePrice, index === 0 && { color: Colors.success500 }]}>{formatCurrency(store.price, i18n.language)}</Text>
                    {index > 0 && sortedStores[0] && (
                      <Text style={styles.storeExtra}>{t("prices.more", { amount: formatCurrency(store.price - sortedStores[0].price, i18n.language) })}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
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
  catScroll: { backgroundColor: Colors.surface, paddingVertical: 10, maxHeight: 56 },
  subCatScroll: { backgroundColor: Colors.surface, paddingBottom: 10, maxHeight: 56 },
  catScrollContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.lg, backgroundColor: Colors.gray100 },
  catChipActive: { backgroundColor: Colors.primary600 },
  catText: { fontSize: 13, fontWeight: "600", color: Colors.gray500 },
  catTextActive: { color: Colors.surface },
  subCatChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.lg, backgroundColor: Colors.gray100 },
  subCatChipActive: { backgroundColor: Colors.gray900 },
  subCatText: { fontSize: 13, fontWeight: "600", color: Colors.gray500 },
  subCatTextActive: { color: Colors.surface },
  loadingInline: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6 },
  loadingInlineText: { fontSize: 13, fontWeight: "600", color: Colors.gray400 },
  emptyInline: { fontSize: 13, fontWeight: "600", color: Colors.gray400, paddingVertical: 8 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: Colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  errorText: { marginBottom: 10, fontSize: 12, fontWeight: "600", color: "#DC2626" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontWeight: "600", color: Colors.gray400 },
  productsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  productCard: { width: "48.5%", borderRadius: Radii["2xl"], borderWidth: 2, borderColor: Colors.gray100, backgroundColor: Colors.surface, padding: 12 },
  productCardActive: { borderColor: Colors.primary600, backgroundColor: Colors.primary50 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  productImageBox: { width: 44, height: 44, borderRadius: Radii.xl, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  productImage: { width: "100%", height: "100%" },
  productFallback: { fontSize: 12, fontWeight: "800", color: Colors.gray900 },
  productName: { flex: 1, fontSize: 13, fontWeight: "700", color: Colors.gray900, lineHeight: 18 },
  productNameActive: { color: Colors.primary600 },
  emptyStateText: { fontSize: 13, fontWeight: "600", color: Colors.gray400 },
  detailCard: { borderRadius: Radii["3xl"], padding: 20, backgroundColor: Colors.primary600, shadowColor: Colors.primary600, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  detailTopRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  detailImageBox: { width: 56, height: 56, borderRadius: Radii.xl, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  detailImage: { width: "100%", height: "100%" },
  detailFallback: { fontSize: 16, fontWeight: "800", color: Colors.surface },
  detailCategory: { fontSize: 12, color: "#C7D2FE" },
  detailName: { fontSize: 16, fontWeight: "700", color: Colors.surface },
  detailStatsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  detailLabel: { fontSize: 11, color: "#C7D2FE" },
  detailPrice: { fontSize: 26, fontWeight: "800", color: Colors.surface },
  detailSavingsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailSavings: { fontSize: 18, fontWeight: "700", color: "#6EE7B7" },
  placeholderCard: { backgroundColor: Colors.surface, borderRadius: Radii["3xl"], padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  placeholderTitle: { fontSize: 14, fontWeight: "700", color: Colors.gray900 },
  placeholderText: { marginTop: 4, fontSize: 12, color: Colors.gray400 },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  storeCountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  storeCount: { fontSize: 14, fontWeight: "700", color: Colors.gray700 },
  sortButtonsRow: { flexDirection: "row", gap: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.gray100, borderRadius: Radii.xl },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: Colors.gray600 },
  mapBtnActive: { backgroundColor: Colors.primary600 },
  mapBtnTextActive: { color: Colors.surface },
  mapPlaceholder: { marginHorizontal: 20, marginBottom: 16, height: 160, borderRadius: Radii["2xl"], backgroundColor: Colors.primary50, position: "relative", overflow: "hidden" },
  mapPin: { position: "absolute", paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  userPin: { position: "absolute", bottom: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  storesSection: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  storeCard: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  storeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  storeLeftRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: Radii.lg, backgroundColor: Colors.gray100, alignItems: "center", justifyContent: "center" },
  rankBadgeActive: { backgroundColor: Colors.primary600 },
  rankText: { fontSize: 13, fontWeight: "700", color: Colors.gray500 },
  rankTextActive: { color: Colors.surface },
  storeName: { fontSize: 14, fontWeight: "700", color: Colors.gray900 },
  storePrice: { fontSize: 20, fontWeight: "800", color: Colors.gray900 },
  storeExtra: { fontSize: 11, color: "#F87171" },
});
