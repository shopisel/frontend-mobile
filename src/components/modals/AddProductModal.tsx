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
  ScanLine,
  Search,
  Store,
  Type,
  X,
} from "lucide-react-native";
import { getCategoryImage } from "../../utils/categoryImages";
import { useProducts, type Category, type Product } from "../../api/useProducts";
import { usePrices } from "../../api/usePrices";
import { useStores, type StoreResponse } from "../../api/useStores";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";

// ─── Types ────────────────────────────────────────────────────────────────────
type InputMethod = "text" | "scan" | "category";

export type AddListItemPayload = {
  productId: string;
  storeId: string;
  quantity: number;
  price: number;
  checked: boolean;
  name: string;
  emoji: string;
  storeName: string;
};

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onAddItem: (item: AddListItemPayload) => void;
}



// ─── Method toggle ────────────────────────────────────────────────────────────
function MethodToggle({ method, onChange }: { method: InputMethod; onChange: (m: InputMethod) => void }) {
  const tabs: { id: InputMethod; label: string; Icon: typeof Type }[] = [
    { id: "text",     label: "Search",   Icon: Type     },
    { id: "scan",     label: "Scan",     Icon: ScanLine },
    { id: "category", label: "Category", Icon: Grid3X3  },
  ];

  const BG:  Record<InputMethod, string> = { text: Colors.primary50,   scan: "#F3E8FF",           category: "#ECFDF5" };
  const CLR: Record<InputMethod, string> = { text: Colors.primary600,  scan: "#9333EA",           category: "#10B981" };

  return (
    <View style={mStyles.row}>
      {tabs.map(({ id, label, Icon }) => {
        const active = method === id;
        return (
          <TouchableOpacity
            key={id}
            style={[mStyles.tab, active && { backgroundColor: BG[id] }]}
            onPress={() => onChange(id)}
            activeOpacity={0.8}
          >
            <Icon size={15} color={active ? CLR[id] : Colors.gray500} />
            <Text style={[mStyles.tabLabel, active && { color: CLR[id] }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────
function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const imgSrc = getCategoryImage(product.image);
  return (
    <TouchableOpacity style={pStyles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={pStyles.emoji}>
        {imgSrc ? (
          <Image source={imgSrc} style={{ width: 36, height: 36, borderRadius: 8 }} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: 20 }}>{product.emoji ?? "📦"}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={pStyles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={pStyles.sub}>Toca para escolher loja</Text>
      </View>
      <ChevronRight size={16} color={Colors.gray300} />
    </TouchableOpacity>
  );
}

// ─── Category card (grid) ─────────────────────────────────────────────────────
function CatCard({ cat, onPress }: { cat: Category; onPress: () => void }) {
  const imgSrc = getCategoryImage(cat.image, cat.name);
  return (
    <TouchableOpacity style={catStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={catStyles.icon}>
        {imgSrc ? (
          <Image source={imgSrc} style={{ width: 44, height: 44 }} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: 28 }}>🏷️</Text>
        )}
      </View>
      <Text style={catStyles.label} numberOfLines={2}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export function AddProductModal({ visible, onClose, onAddItem }: AddProductModalProps) {
  const { searchProducts, getMainCategories, getSubCategories, getProductsByCategory } = useProducts();
  const { getPrices } = usePrices();
  const { getStores } = useStores();

  const [method, setMethod]                     = useState<InputMethod>("text");
  const [query, setQuery]                       = useState("");
  const [products, setProducts]                 = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts]   = useState(false);

  // Category browse
  const [mainCats, setMainCats]                 = useState<Category[]>([]);
  const [subCats, setSubCats]                   = useState<Category[]>([]);
  const [selectedCat, setSelectedCat]           = useState<Category | null>(null);
  const [selectedSubCat, setSelectedSubCat]     = useState<Category | null>(null);
  const [loadingCats, setLoadingCats]           = useState(false);

  // Scan
  const [isScanning, setIsScanning]             = useState(false);

  // Store selection
  const [selectedProduct, setSelectedProduct]   = useState<Product | null>(null);
  const [stores, setStores]                     = useState<StoreResponse[]>([]);
  const [priceByStore, setPriceByStore]         = useState<Record<string, number>>({});
  const [loadingStores, setLoadingStores]       = useState(false);
  const [addedCount, setAddedCount]             = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setMethod("text");
      setQuery("");
      setProducts([]);
      setMainCats([]);
      setSubCats([]);
      setSelectedCat(null);
      setSelectedSubCat(null);
      setIsScanning(false);
      setSelectedProduct(null);
      setStores([]);
      setPriceByStore({});
      setAddedCount(0);
    }
  }, [visible]);

  // ── Text search ──
  useEffect(() => {
    if (method !== "text" || selectedProduct) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setProducts([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoadingProducts(true);
      try { setProducts(await searchProducts(query.trim()) ?? []); }
      catch (e) { console.error(e); setProducts([]); }
      finally { setLoadingProducts(false); }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, method, selectedProduct, searchProducts]);

  // ── Load main categories (once, when method=category) ──
  useEffect(() => {
    if (method !== "category" || mainCats.length > 0) return;
    setLoadingCats(true);
    getMainCategories()
      .then((data) => setMainCats(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [method, mainCats.length, getMainCategories]);

  // ── Load subcategories when a main cat is selected ──
  useEffect(() => {
    if (!selectedCat) { setSubCats([]); setProducts([]); return; }
    setLoadingCats(true);
    getSubCategories(selectedCat.id)
      .then((data) => setSubCats(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [selectedCat, getSubCategories]);

  // ── Load products when a sub-cat is selected ──
  useEffect(() => {
    if (!selectedSubCat) { setProducts([]); return; }
    setLoadingProducts(true);
    getProductsByCategory(selectedSubCat.id)
      .then((data) => setProducts(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, [selectedSubCat, getProductsByCategory]);

  // ── Load stores + prices when a product is selected ──
  useEffect(() => {
    if (!selectedProduct) { setStores([]); setPriceByStore({}); return; }
    setLoadingStores(true);
    void (async () => {
      try {
        const prices = await getPrices(selectedProduct.id);
        const storeIds = [...new Set(prices.map((p) => p.storeId))];
        const priceMap = prices.reduce<Record<string, number>>((acc, p) => {
          acc[p.storeId] = p.price;
          return acc;
        }, {});
        setPriceByStore(priceMap);
        if (!storeIds.length) { setStores([]); return; }
        setStores(await getStores({ ids: storeIds.join(",") }) ?? []);
      } catch (e) { console.error(e); setStores([]); }
      finally { setLoadingStores(false); }
    })();
  }, [selectedProduct, getPrices, getStores]);

  // Simulate scan
  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1500);
  };

  const sortedStores = useMemo(
    () => [...stores].sort((a, b) => (priceByStore[a.id] ?? Infinity) - (priceByStore[b.id] ?? Infinity)),
    [stores, priceByStore]
  );

  const handleSelectStore = (store: StoreResponse) => {
    if (!selectedProduct) return;
    onAddItem({
      productId: selectedProduct.id,
      storeId: store.id,
      quantity: 1,
      price: priceByStore[store.id] ?? 0,
      checked: false,
      name: selectedProduct.name,
      emoji: selectedProduct.emoji ?? "📦",
      storeName: store.name,
    });
    setAddedCount((c) => c + 1);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // ── Header title ──
  const headerTitle = selectedProduct
    ? "Escolher loja"
    : selectedSubCat
    ? selectedSubCat.name
    : selectedCat
    ? selectedCat.name
    : "Adicionar produto";

  const canGoBack = !!(selectedProduct || selectedSubCat || selectedCat);
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
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
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
                <Text style={styles.addedBadge}>{addedCount} item{addedCount !== 1 ? "s" : ""} adicionado{addedCount !== 1 ? "s" : ""}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <X size={18} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {/* ── Store selection step ── */}
          {selectedProduct ? (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {/* Product preview */}
              <View style={styles.productPreview}>
                <View style={styles.productPreviewEmoji}>
                  <Text style={{ fontSize: 28 }}>{selectedProduct.emoji ?? "📦"}</Text>
                </View>
                <Text style={styles.productPreviewName} numberOfLines={2}>{selectedProduct.name}</Text>
              </View>

              <Text style={styles.sectionLabel}>Onde vais comprar?</Text>

              {loadingStores ? (
                <ActivityIndicator color={Colors.primary600} style={{ marginTop: 24 }} />
              ) : sortedStores.length ? (
                sortedStores.map((store, i) => (
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
                      <Text style={styles.storeSub}>{i === 0 ? "Melhor preço" : "Preço disponível"}</Text>
                    </View>
                    <Text style={styles.storePrice}>
                      €{(priceByStore[store.id] ?? 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Sem lojas com preço disponível para este produto.</Text>
              )}
            </ScrollView>
          ) : (
            <>
              {/* Method toggle — only at top level */}
              {!selectedCat && (
                <MethodToggle method={method} onChange={setMethod} />
              )}

              {/* ── TEXT search ── */}
              {method === "text" && !selectedCat && (
                <>
                  <View style={styles.searchBox}>
                    <Search size={16} color={Colors.gray400} />
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Pesquisar por nome..."
                      placeholderTextColor={Colors.gray400}
                      style={styles.searchInput}
                      autoFocus
                    />
                    {loadingProducts && <ActivityIndicator size="small" color={Colors.primary600} />}
                  </View>
                  <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {products.length > 0
                      ? products.map((p) => <ProductRow key={p.id} product={p} onPress={() => setSelectedProduct(p)} />)
                      : <Text style={styles.emptyText}>{query.trim() ? "Nenhum produto encontrado." : "Escreve para começar a pesquisa."}</Text>
                    }
                  </ScrollView>
                </>
              )}

              {/* ── SCAN ── */}
              {method === "scan" && !selectedCat && (
                <View style={styles.scanArea}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    <Text style={{ fontSize: 48 }}>📦</Text>
                    <Text style={styles.scanHint}>{isScanning ? "A escanear..." : "Aponta para um código de barras"}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.scanBtn, isScanning && { opacity: 0.7 }]}
                    onPress={startScan}
                    disabled={isScanning}
                    activeOpacity={0.85}
                  >
                    <ScanLine size={20} color="#fff" />
                    <Text style={styles.scanBtnText}>{isScanning ? "A escanear..." : "Iniciar scan"}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── CATEGORY browse ── */}
              {method === "category" && (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.catScrollContent}>
                  {/* Main categories grid */}
                  {!selectedCat && (
                    loadingCats
                      ? <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
                      : (
                        <View style={styles.catGrid}>
                          {mainCats.map((cat) => (
                            <CatCard key={cat.id} cat={cat} onPress={() => { setSelectedCat(cat); setSelectedSubCat(null); }} />
                          ))}
                        </View>
                      )
                  )}

                  {/* Subcategories grid */}
                  {selectedCat && !selectedSubCat && (
                    loadingCats
                      ? <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
                      : subCats.length > 0
                      ? (
                        <View style={styles.catGrid}>
                          {subCats.map((sub) => (
                            <CatCard key={sub.id} cat={sub} onPress={() => setSelectedSubCat(sub)} />
                          ))}
                        </View>
                      )
                      : <Text style={styles.emptyText}>Sem subcategorias.</Text>
                  )}

                  {/* Products list */}
                  {selectedSubCat && (
                    loadingProducts
                      ? <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
                      : products.length > 0
                      ? products.map((p) => <ProductRow key={p.id} product={p} onPress={() => setSelectedProduct(p)} />)
                      : <Text style={styles.emptyText}>Sem produtos nesta categoria.</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay:          { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.4)" },
  backdrop:         { ...StyleSheet.absoluteFillObject },
  sheet:            { minHeight: "60%", maxHeight: "88%", backgroundColor: Colors.surface, borderTopLeftRadius: Radii["3xl"], borderTopRightRadius: Radii["3xl"], paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  handle:           { alignSelf: "center", width: 42, height: 4, borderRadius: 99, backgroundColor: Colors.gray200, marginBottom: 16 },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  title:            { fontSize: Typography.xl, fontWeight: "700", color: Colors.gray900 },
  addedBadge:       { fontSize: 12, fontWeight: "600", color: Colors.success500, marginTop: 2 },
  iconBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center" },
  iconSpacer:       { width: 36, height: 36 },
  searchBox:        { flexDirection: "row", alignItems: "center", gap: 10, height: 48, borderRadius: Radii["2xl"], backgroundColor: Colors.gray50, paddingHorizontal: 16, marginBottom: 16 },
  searchInput:      { flex: 1, fontSize: Typography.base, color: Colors.gray900 },
  scroll:           { flex: 1 },
  scrollContent:    { gap: 10, paddingBottom: 8 },
  catScrollContent: { paddingBottom: 8 },
  emptyText:        { textAlign: "center", fontSize: Typography.base, color: Colors.gray500, paddingVertical: 24 },
  sectionLabel:     { fontSize: 12, fontWeight: "600", color: Colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },

  // Product preview (store step)
  productPreview:      { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.primary50, borderRadius: Radii["2xl"], padding: 14, marginBottom: 20 },
  productPreviewEmoji: { width: 52, height: 52, borderRadius: Radii.xl, backgroundColor: Colors.primary100, alignItems: "center", justifyContent: "center" },
  productPreviewName:  { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.gray900 },

  // Store rows
  storeRow:   { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: Radii["2xl"], backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.gray100, marginBottom: 10 },
  storeIcon:  { width: 42, height: 42, borderRadius: Radii.lg, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  storeName:  { fontSize: Typography.md, fontWeight: "700", color: Colors.gray900 },
  storeSub:   { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
  storePrice: { fontSize: Typography.lg, fontWeight: "800", color: Colors.success500 },

  // Scan area
  scanArea:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 24, paddingVertical: 20 },
  scanFrame:  { width: 220, height: 220, borderRadius: 20, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center", position: "relative" },
  scanHint:   { fontSize: 13, color: Colors.gray500, marginTop: 10, textAlign: "center" },
  scanBtn:    { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 15, backgroundColor: Colors.primary600, borderRadius: Radii["2xl"] },
  scanBtnText:{ fontSize: 15, fontWeight: "700", color: "#fff" },
  corner:     { position: "absolute", width: 24, height: 24, borderColor: Colors.primary600 },
  topLeft:    { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  topRight:   { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  bottomRight:{ bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
});

// ─── Method toggle styles ─────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  row:      { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: Radii.xl, backgroundColor: Colors.gray100 },
  tabLabel: { fontSize: 13, fontWeight: "600", color: Colors.gray500 },
});

// ─── Product row styles ───────────────────────────────────────────────────────
const pStyles = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: Radii["2xl"], backgroundColor: Colors.gray50 },
  emoji: { width: 42, height: 42, borderRadius: Radii.lg, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  name:  { fontSize: Typography.md, fontWeight: "700", color: Colors.gray900 },
  sub:   { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
});

// ─── Category grid styles ─────────────────────────────────────────────────────
const catStyles = StyleSheet.create({
  card:  { width: "31%", aspectRatio: 1, margin: "1%", backgroundColor: Colors.gray50, borderRadius: Radii.xl, alignItems: "center", justifyContent: "center", gap: 6 },
  icon:  { width: 56, height: 56, borderRadius: Radii.lg, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "600", color: Colors.gray900, textAlign: "center" },
});
