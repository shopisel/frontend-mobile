import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Search,
  Store,
  Type,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { getCategoryImage } from "../../utils/categoryImages";
import { useProducts, type Category, type Product } from "../../api/useProducts";
import { usePrices } from "../../api/usePrices";
import { useStores, type StoreResponse } from "../../api/useStores";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { formatCurrency } from "../../i18n/formatters";

type InputMethod = "text" | "category";

export type AddListItemPayload = {
  productId: string;
  storeId: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  saleDate?: string;
  checked: boolean;
  name: string;
  image?: string;
  categoryId?: string;
  emoji: string;
  storeName: string;
};

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onAddItem: (item: AddListItemPayload) => void;
}

function MethodToggle({ method, onChange }: { method: InputMethod; onChange: (m: InputMethod) => void }) {
  const { t } = useTranslation();
  const tabs: { id: InputMethod; label: string; Icon: typeof Type }[] = [
    { id: "text", label: t("addProduct.methodSearch"), Icon: Type },
    { id: "category", label: t("addProduct.methodCategory"), Icon: Grid3X3 },
  ];

  const background: Record<InputMethod, string> = { text: Colors.primary50, category: "#ECFDF5" };
  const color: Record<InputMethod, string> = { text: Colors.primary600, category: "#10B981" };

  return (
    <View style={methodStyles.row}>
      {tabs.map(({ id, label, Icon }) => {
        const active = method === id;
        return (
          <TouchableOpacity
            key={id}
            style={[methodStyles.tab, active && { backgroundColor: background[id] }]}
            onPress={() => onChange(id)}
            activeOpacity={0.8}
          >
            <Icon size={15} color={active ? color[id] : Colors.gray500} />
            <Text style={[methodStyles.tabLabel, active && { color: color[id] }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const { t } = useTranslation();
  const imageSource = getCategoryImage(product.image, product.categoryId);

  return (
    <TouchableOpacity style={productStyles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={productStyles.emoji}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 36, height: 36, borderRadius: 8 }} resizeMode="contain" />
        ) : (
          <Text style={productStyles.fallbackBadge}>{product.emoji ?? "PK"}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={productStyles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={productStyles.sub}>{t("addProduct.tapToChooseStore")}</Text>
      </View>
      <ChevronRight size={16} color={Colors.gray300} />
    </TouchableOpacity>
  );
}

function CategoryCard({ cat, onPress }: { cat: Category; onPress: () => void }) {
  const imageSource = getCategoryImage(cat.image, cat.name);
  return (
    <TouchableOpacity style={categoryStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={categoryStyles.icon}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 44, height: 44 }} resizeMode="contain" />
        ) : (
          <Text style={categoryStyles.fallbackBadge}>{cat.name.slice(0, 2).toUpperCase()}</Text>
        )}
      </View>
      <Text style={categoryStyles.label} numberOfLines={2}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

export function AddProductModal({ visible, onClose, onAddItem }: AddProductModalProps) {
  const { t, i18n } = useTranslation();
  const { searchProducts, getMainCategories, getSubCategories, getProductsByCategory } = useProducts();
  const { getPrices } = usePrices();
  const { getStores } = useStores();

  const [method, setMethod] = useState<InputMethod>("text");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [mainCats, setMainCats] = useState<Category[]>([]);
  const [subCats, setSubCats] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<Category | null>(null);
  const [loadingCats, setLoadingCats] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [pricesByStore, setPricesByStore] = useState<Record<string, { price: number; originalPrice?: number; saleDate?: string }>>({});
  const [loadingStores, setLoadingStores] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setMethod("text");
      setQuery("");
      setProducts([]);
      setMainCats([]);
      setSubCats([]);
      setSelectedCat(null);
      setSelectedSubCat(null);
      setSelectedProduct(null);
      setStores([]);
      setPricesByStore({});
      setAddedCount(0);
    }
  }, [visible]);

  useEffect(() => {
    if (method !== "text" || selectedProduct) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        setProducts((await searchProducts(query.trim())) ?? []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [method, query, searchProducts, selectedProduct]);

  useEffect(() => {
    if (method !== "category" || mainCats.length > 0) return;
    setLoadingCats(true);
    getMainCategories()
      .then((data) => setMainCats(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [getMainCategories, mainCats.length, method]);

  useEffect(() => {
    if (!selectedCat) {
      setSubCats([]);
      setProducts([]);
      return;
    }

    setLoadingCats(true);
    getSubCategories(selectedCat.id)
      .then((data) => setSubCats(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [getSubCategories, selectedCat]);

  useEffect(() => {
    if (!selectedSubCat) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    getProductsByCategory(selectedSubCat.id)
      .then((data) => setProducts(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, [getProductsByCategory, selectedSubCat]);

  useEffect(() => {
    if (!selectedProduct) {
      setStores([]);
      setPricesByStore({});
      return;
    }

    setLoadingStores(true);
    void (async () => {
      try {
        const prices = await getPrices(selectedProduct.id);
        const storeIds = [...new Set(prices.map((price) => price.storeId))];
        const nextPriceMap = prices.reduce<Record<string, { price: number; originalPrice?: number; saleDate?: string }>>((acc, price) => {
          const hasSale = typeof price.sale === "number" && price.sale > 0 && price.sale < price.price;
          acc[price.storeId] = {
            price: hasSale ? price.sale as number : price.price,
            originalPrice: hasSale ? price.price : undefined,
            saleDate: hasSale ? price.saleDate : undefined,
          };
          return acc;
        }, {});
        setPricesByStore(nextPriceMap);
        if (!storeIds.length) {
          setStores([]);
          return;
        }
        setStores((await getStores({ ids: storeIds.join(",") })) ?? []);
      } catch (error) {
        console.error(error);
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    })();
  }, [getPrices, getStores, selectedProduct]);

  const sortedStores = useMemo(
    () => [...stores].sort((a, b) => (pricesByStore[a.id]?.price ?? Infinity) - (pricesByStore[b.id]?.price ?? Infinity)),
    [pricesByStore, stores],
  );

  const handleSelectStore = (store: StoreResponse) => {
    if (!selectedProduct) return;

    onAddItem({
      productId: selectedProduct.id,
      storeId: store.id,
      quantity: 1,
      price: pricesByStore[store.id]?.price ?? 0,
      originalPrice: pricesByStore[store.id]?.originalPrice,
      saleDate: pricesByStore[store.id]?.saleDate,
      checked: false,
      name: selectedProduct.name,
      image: selectedProduct.image,
      categoryId: selectedProduct.categoryId,
      emoji: selectedProduct.emoji ?? "PK",
      storeName: store.name,
    });

    setAddedCount((current) => current + 1);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const headerTitle = selectedProduct
    ? t("addProduct.chooseStore")
    : selectedSubCat
      ? selectedSubCat.name
      : selectedCat
        ? selectedCat.name
        : t("addProduct.title");

  const canGoBack = Boolean(selectedProduct || selectedSubCat || selectedCat);

  const handleBack = () => {
    if (selectedProduct) setSelectedProduct(null);
    else if (selectedSubCat) setSelectedSubCat(null);
    else if (selectedCat) setSelectedCat(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {canGoBack ? (
              <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
                <ChevronLeft size={18} color={Colors.gray600} />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconSpacer} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{headerTitle}</Text>
              {addedCount > 0 && !selectedProduct && (
                <Text style={styles.addedBadge}>{t("addProduct.addedCount", { count: addedCount })}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <X size={18} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {selectedProduct ? (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.productPreview}>
                <View style={styles.productPreviewEmoji}>
                  {getCategoryImage(selectedProduct.image, selectedProduct.categoryId) ? (
                    <Image source={getCategoryImage(selectedProduct.image, selectedProduct.categoryId)!} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <Text style={styles.previewBadge}>{selectedProduct.emoji ?? "PK"}</Text>
                  )}
                </View>
                <Text style={styles.productPreviewName} numberOfLines={2}>{selectedProduct.name}</Text>
              </View>

              <Text style={styles.sectionLabel}>{t("addProduct.whereToBuy")}</Text>

              {loadingStores ? (
                <ActivityIndicator color={Colors.primary600} style={{ marginTop: 24 }} />
              ) : sortedStores.length ? (
                sortedStores.map((store, index) => (
                  <TouchableOpacity
                    key={store.id}
                    style={styles.storeRow}
                    onPress={() => handleSelectStore(store)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.storeIcon}>
                      <Store size={16} color={Colors.primary600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName}>{store.name}</Text>
                      <Text style={styles.storeSub}>{index === 0 ? t("addProduct.bestPrice") : t("addProduct.priceAvailable")}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.storePrice}>{formatCurrency(pricesByStore[store.id]?.price ?? 0, i18n.language)}</Text>
                      {typeof pricesByStore[store.id]?.originalPrice === "number" ? (
                        <Text style={styles.storeOriginalPrice}>
                          {formatCurrency(pricesByStore[store.id]?.originalPrice ?? 0, i18n.language)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>{t("addProduct.noStores")}</Text>
              )}
            </ScrollView>
          ) : (
            <>
              {!selectedCat && <MethodToggle method={method} onChange={setMethod} />}

              {method === "text" && !selectedCat && (
                <>
                  <View style={styles.searchBox}>
                    <Search size={16} color={Colors.gray400} />
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder={t("addProduct.searchPlaceholder")}
                      placeholderTextColor={Colors.gray400}
                      style={styles.searchInput}
                      autoFocus
                    />
                    {loadingProducts && <ActivityIndicator size="small" color={Colors.primary600} />}
                  </View>
                  <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {products.length > 0
                      ? products.map((product) => <ProductRow key={product.id} product={product} onPress={() => setSelectedProduct(product)} />)
                      : <Text style={styles.emptyText}>{query.trim() ? t("addProduct.noProducts") : t("addProduct.typeToSearch")}</Text>}
                  </ScrollView>
                </>
              )}

              {method === "category" && (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.catScrollContent}>
                  {!selectedCat && (
                    loadingCats
                      ? <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
                      : (
                        <View style={styles.catGrid}>
                          {mainCats.map((cat) => (
                            <CategoryCard key={cat.id} cat={cat} onPress={() => { setSelectedCat(cat); setSelectedSubCat(null); }} />
                          ))}
                        </View>
                      )
                  )}

                  {selectedCat && !selectedSubCat && (
                    loadingCats
                      ? <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
                      : subCats.length > 0
                        ? (
                          <View style={styles.catGrid}>
                            {subCats.map((subCat) => (
                              <CategoryCard key={subCat.id} cat={subCat} onPress={() => setSelectedSubCat(subCat)} />
                            ))}
                          </View>
                        )
                        : <Text style={styles.emptyText}>{t("addProduct.noSubcategories")}</Text>
                  )}

                  {selectedSubCat && (
                    loadingProducts
                      ? <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
                      : products.length > 0
                        ? products.map((product) => <ProductRow key={product.id} product={product} onPress={() => setSelectedProduct(product)} />)
                        : <Text style={styles.emptyText}>{t("addProduct.noCategoryProducts")}</Text>
                  )}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.4)" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { minHeight: "60%", maxHeight: "88%", backgroundColor: Colors.surface, borderTopLeftRadius: Radii["3xl"], borderTopRightRadius: Radii["3xl"], paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 99, backgroundColor: Colors.gray200, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  title: { fontSize: Typography.xl, fontWeight: "700", color: Colors.gray900 },
  addedBadge: { fontSize: 12, fontWeight: "600", color: Colors.success500, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center" },
  iconSpacer: { width: 36, height: 36 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, borderRadius: Radii["2xl"], backgroundColor: Colors.gray50, paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.gray900 },
  scroll: { flex: 1 },
  scrollContent: { gap: 10, paddingBottom: 8 },
  catScrollContent: { paddingBottom: 8 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  emptyText: { textAlign: "center", fontSize: Typography.base, color: Colors.gray500, paddingVertical: 24 },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: Colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  productPreview: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.primary50, borderRadius: Radii["2xl"], padding: 14, marginBottom: 20 },
  productPreviewEmoji: { width: 52, height: 52, borderRadius: Radii.xl, backgroundColor: Colors.primary100, alignItems: "center", justifyContent: "center" },
  previewBadge: { fontSize: 16, fontWeight: "800", color: Colors.gray900 },
  productPreviewName: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.gray900 },
  storeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: Radii["2xl"], backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.gray100, marginBottom: 10 },
  storeIcon: { width: 42, height: 42, borderRadius: Radii.lg, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: Typography.md, fontWeight: "700", color: Colors.gray900 },
  storeSub: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
  storePrice: { fontSize: Typography.lg, fontWeight: "800", color: Colors.success500 },
  storeOriginalPrice: { fontSize: Typography.sm, color: Colors.gray400, textDecorationLine: "line-through", marginTop: 2 },
});

const methodStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: Radii.xl, backgroundColor: Colors.gray100 },
  tabLabel: { fontSize: 13, fontWeight: "600", color: Colors.gray500 },
});

const productStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: Radii["2xl"], backgroundColor: Colors.gray50 },
  emoji: { width: 42, height: 42, borderRadius: Radii.lg, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  fallbackBadge: { fontSize: 12, fontWeight: "800", color: Colors.gray900 },
  name: { fontSize: Typography.md, fontWeight: "700", color: Colors.gray900 },
  sub: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
});

const categoryStyles = StyleSheet.create({
  card: { width: "31%", aspectRatio: 1, margin: "1%", backgroundColor: Colors.gray50, borderRadius: Radii.xl, alignItems: "center", justifyContent: "center", gap: 6 },
  icon: { width: 56, height: 56, borderRadius: Radii.lg, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  fallbackBadge: { fontSize: 12, fontWeight: "800", color: Colors.gray900 },
  label: { fontSize: 11, fontWeight: "600", color: Colors.gray900, textAlign: "center" },
});
