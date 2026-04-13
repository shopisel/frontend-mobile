import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronLeft, Search, Store, X } from "lucide-react-native";
import { useProducts, type Product } from "../../api/useProducts";
import { usePrices } from "../../api/usePrices";
import { useStores, type StoreResponse } from "../../api/useStores";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";

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

export function AddProductModal({ visible, onClose, onAddItem }: AddProductModalProps) {
  const { searchProducts } = useProducts();
  const { getPrices } = usePrices();
  const { getStores } = useStores();

  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [priceByStore, setPriceByStore] = useState<Record<string, number>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSelectedProduct(null);
      setProducts([]);
      setStores([]);
      setPriceByStore({});
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || selectedProduct || !query.trim()) {
      if (!query.trim()) setProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const result = await searchProducts(query.trim());
        setProducts(result ?? []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, searchProducts, selectedProduct, visible]);

  useEffect(() => {
    if (!selectedProduct) return;

    void (async () => {
      setLoadingStores(true);
      try {
        const prices = await getPrices(selectedProduct.id);
        const storeIds = [...new Set(prices.map((entry) => entry.storeId))];
        const priceMap = prices.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.storeId] = entry.price;
          return acc;
        }, {});
        setPriceByStore(priceMap);

        if (!storeIds.length) {
          setStores([]);
          return;
        }

        const storeResults = await getStores({ ids: storeIds.join(",") });
        setStores(storeResults ?? []);
      } catch (error) {
        console.error(error);
        setStores([]);
        setPriceByStore({});
      } finally {
        setLoadingStores(false);
      }
    })();
  }, [getPrices, getStores, selectedProduct]);

  const sortedStores = useMemo(() => {
    return [...stores].sort((left, right) => {
      const leftPrice = priceByStore[left.id] ?? Number.MAX_SAFE_INTEGER;
      const rightPrice = priceByStore[right.id] ?? Number.MAX_SAFE_INTEGER;
      return leftPrice - rightPrice;
    });
  }, [priceByStore, stores]);

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

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            {selectedProduct ? (
              <TouchableOpacity style={styles.iconButton} onPress={() => setSelectedProduct(null)}>
                <ChevronLeft size={18} color={Colors.gray600} />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconSpacer} />
            )}

            <View style={styles.headerText}>
              <Text style={styles.title}>{selectedProduct ? "Escolher loja" : "Adicionar produto"}</Text>
              <Text style={styles.subtitle}>
                {selectedProduct ? selectedProduct.name : "Pesquisa um produto e escolhe a loja"}
              </Text>
            </View>

            <TouchableOpacity style={styles.iconButton} onPress={onClose}>
              <X size={18} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {!selectedProduct ? (
            <>
              <View style={styles.searchBox}>
                <Search size={16} color={Colors.gray400} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Pesquisar produto..."
                  placeholderTextColor={Colors.gray400}
                  style={styles.searchInput}
                  autoFocus
                />
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {loadingProducts ? (
                  <ActivityIndicator color={Colors.primary600} />
                ) : products.length ? (
                  products.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productRow}
                      onPress={() => setSelectedProduct(product)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.emojiBubble}>
                        <Text style={styles.emojiText}>{product.emoji ?? "📦"}</Text>
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>{product.name}</Text>
                        <Text style={styles.rowSubtitle}>Escolher loja e preço</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {query.trim() ? "Nenhum produto encontrado." : "Escreve para começar a pesquisa."}
                  </Text>
                )}
              </ScrollView>
            </>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {loadingStores ? (
                <ActivityIndicator color={Colors.primary600} />
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
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{store.name}</Text>
                      <Text style={styles.rowSubtitle}>
                        {index === 0 ? "Melhor preço disponível" : "Preço disponível"}
                      </Text>
                    </View>
                    <Text style={styles.priceLabel}>€{(priceByStore[store.id] ?? 0).toFixed(2)}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>Não existem lojas com preço disponível para este produto.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    minHeight: "58%",
    maxHeight: "82%",
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii["3xl"],
    borderTopRightRadius: Radii["3xl"],
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.gray200,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: "700",
    color: Colors.gray900,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 36,
    height: 36,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.gray50,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.gray900,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.gray50,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  emojiBubble: {
    width: 42,
    height: 42,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 20,
  },
  storeIcon: {
    width: 42,
    height: 42,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: Typography.md,
    fontWeight: "700",
    color: Colors.gray900,
  },
  rowSubtitle: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  priceLabel: {
    fontSize: Typography.lg,
    fontWeight: "800",
    color: Colors.success500,
  },
  emptyText: {
    textAlign: "center",
    fontSize: Typography.base,
    color: Colors.gray500,
    paddingVertical: 24,
  },
});
