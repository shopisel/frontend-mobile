import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, Plus, RefreshCw, Search, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLists, type ListItemRequest, type ListItemResponse, type ListResponse } from "../../api/useLists";
import { useProducts, type Product } from "../../api/useProducts";
import { useStores, type StoreResponse } from "../../api/useStores";
import { AddProductModal, type AddListItemPayload } from "../modals/AddProductModal";
import { Colors } from "../../styles/colors";
import { Radii } from "../../styles/typography";

interface EnrichedItem extends ListItemResponse {
  name: string;
  emoji: string;
  storeName: string;
}

export function ListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ listId?: string | string[] }>();
  const listId = Array.isArray(params.listId) ? params.listId[0] : params.listId;

  const { getList, updateList } = useLists();
  const { getProductsByIds } = useProducts();
  const { getStores } = useStores();

  const [listDetails, setListDetails] = useState<ListResponse | null>(null);
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadItems = useCallback(async (currentListId: string) => {
    setIsLoading(true);
    try {
      const listData = await getList(currentListId);
      setListDetails(listData);

      const rawItems = listData.items ?? [];
      const productIds = [...new Set(rawItems.map((item) => item.productId))];
      const storeIds = [...new Set(rawItems.map((item) => item.storeId))];

      const productsMap: Record<string, Product> = {};
      const storesMap: Record<string, StoreResponse> = {};

      if (productIds.length) {
        const products = await getProductsByIds(productIds).catch(() => []);
        products.forEach((product) => { productsMap[product.id] = product; });
      }

      if (storeIds.length) {
        const stores = await getStores({ ids: storeIds.join(",") }).catch(() => []);
        stores.forEach((store) => { storesMap[store.id] = store; });
      }

      const enriched: EnrichedItem[] = rawItems.map((item) => ({
        ...item,
        name: productsMap[item.productId]?.name ?? "Unknown Product",
        emoji: productsMap[item.productId]?.emoji ?? "??",
        storeName: storesMap[item.storeId]?.name ?? "Unknown Store",
      }));

      setItems(enriched);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [getList, getProductsByIds, getStores]);

  useEffect(() => {
    if (listId) void loadItems(listId);
  }, [listId, loadItems]);

  const commitUpdates = async (currentListId: string, updated: EnrichedItem[]) => {
    const req: ListItemRequest[] = updated.map((item) => ({
      productId: item.productId,
      storeId: item.storeId,
      quantity: item.quantity,
      price: item.price,
      checked: item.checked,
    }));

    await updateList(currentListId, undefined, req).catch(console.error);
  };

  const handleToggle = (id: number) => {
    if (!listId) return;
    const updated = items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
    setItems(updated);
    void commitUpdates(listId, updated);
  };

  const handleDelete = (id: number) => {
    if (!listId) return;
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    void commitUpdates(listId, updated);
  };

  const handleAddItem = async (item: AddListItemPayload) => {
    if (!listId) return;

    const updated: EnrichedItem[] = [
      ...items,
      {
        id: Date.now(),
        productId: item.productId,
        storeId: item.storeId,
        quantity: item.quantity,
        price: item.price,
        checked: item.checked,
        name: item.name,
        emoji: item.emoji,
        storeName: item.storeName,
      },
    ];

    setItems(updated);
    await commitUpdates(listId, updated);
  };

  const filteredItems = useMemo(() => (
    searchInput.trim()
      ? items.filter((item) => item.name.toLowerCase().includes(searchInput.toLowerCase()))
      : items
  ), [items, searchInput]);

  const total = items.filter((item) => !item.checked).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const checkedCount = items.filter((item) => item.checked).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={18} color={Colors.gray500} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { flex: 1 }]} numberOfLines={1}>{listDetails?.name ?? "Lista"}</Text>
        <TouchableOpacity style={styles.iconBtnSm} onPress={() => listId && void loadItems(listId)}>
          <RefreshCw size={16} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: items.length ? `${(checkedCount / items.length) * 100}%` : "0%" }]} />
        </View>
        <Text style={styles.progressText}>{checkedCount}/{items.length}</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.gray400} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search items..."
            placeholderTextColor={Colors.gray400}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>EUR {total.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 96 }}>
        {isLoading && filteredItems.length === 0 ? (
          <ActivityIndicator color={Colors.primary600} />
        ) : !filteredItems.length ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Nenhum item adicionado.</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemEmoji}>
                <Text style={{ fontSize: 20 }}>{item.emoji ?? "??"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.quantity} un · {item.storeName}</Text>
              </View>
              <Text style={[styles.itemPrice, item.checked && { color: Colors.gray400 }]}>
                EUR {(item.price * item.quantity).toFixed(2)}
              </Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Trash2 size={14} color="#F87171" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkCircle, item.checked && styles.checkCircleChecked]}
                onPress={() => handleToggle(item.id)}
              >
                {item.checked && <Check size={12} color="#fff" />}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setShowAddModal(true)}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={(item) => {
          void handleAddItem(item);
          setShowAddModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: Colors.surface, gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.gray900 },
  iconBtnSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: "center", justifyContent: "center" },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.surface },
  progressTrack: { flex: 1, height: 8, backgroundColor: Colors.gray100, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.primary500, borderRadius: 99 },
  progressText: { fontSize: 12, fontWeight: "600", color: Colors.gray500 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: Colors.surface },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.gray50, borderRadius: Radii.xl, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 13, color: Colors.gray900 },
  totalBadge: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.primary50, borderRadius: Radii.xl },
  totalText: { fontSize: 13, fontWeight: "700", color: Colors.primary600 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii["3xl"], padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  emptyText: { fontSize: 13, color: Colors.gray500, textAlign: "center" },
  itemCard: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemEmoji: { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.gray900 },
  itemNameChecked: { textDecorationLine: "line-through", color: Colors.gray400 },
  itemSub: { fontSize: 12, color: Colors.gray400 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: Colors.success500 },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.gray300, alignItems: "center", justifyContent: "center" },
  checkCircleChecked: { borderColor: Colors.success500, backgroundColor: Colors.success500 },
  fab: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary600, alignItems: "center", justifyContent: "center", shadowColor: Colors.primary600, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
});
