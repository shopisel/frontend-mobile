import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Trash2, ChevronRight, Check, Search, ShoppingCart, RefreshCw, ChevronLeft,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLists, type ListResponse, type ListItemResponse, type ListItemRequest } from "../../api/useLists";
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

interface ListsScreenProps {
  onNavigate?: (tab: string) => void;
}

export function ListsScreen({ onNavigate }: ListsScreenProps) {
  const insets = useSafeAreaInsets();
  const { getLists, getList, createList, updateList } = useLists();
  const { getProductsByIds } = useProducts();
  const { getStores } = useStores();

  const [lists, setLists] = useState<ListResponse[]>([]);
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [view, setView] = useState<"lists" | "items">("lists");
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState("");

  const activeList = useMemo(() => lists.find((list) => list.id === activeListId) ?? null, [lists, activeListId]);

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLists();
      setLists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [getLists]);

  useEffect(() => {
    if (view === "lists") void loadLists();
  }, [loadLists, view]);

  const loadItems = useCallback(async (listId: string) => {
    setIsLoading(true);
    try {
      const listData = await getList(listId);
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

      setLists((current) => current.map((list) => (list.id === listId ? { ...list, ...listData } : list)));
      setItems(enriched);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [getList, getProductsByIds, getStores]);

  useEffect(() => {
    if (activeListId && view === "items") void loadItems(activeListId);
  }, [activeListId, view, loadItems]);

  const commitUpdates = async (listId: string, updated: EnrichedItem[]) => {
    const req: ListItemRequest[] = updated.map((item) => ({
      productId: item.productId,
      storeId: item.storeId,
      quantity: item.quantity,
      price: item.price,
      checked: item.checked,
    }));
    await updateList(listId, undefined, req).catch(console.error);
  };

  const handleToggle = (id: number) => {
    if (!activeListId) return;
    const updated = items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
    setItems(updated);
    void commitUpdates(activeListId, updated);
  };

  const handleDelete = (id: number) => {
    if (!activeListId) return;
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    void commitUpdates(activeListId, updated);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsLoading(true);
    try {
      const newList = await createList(newListName.trim());
      setLists((current) => [newList, ...current]);
      setActiveListId(newList.id);
      setView("items");
      setNewListName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (item: AddListItemPayload) => {
    if (!activeListId) return;

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
    await commitUpdates(activeListId, updated);
  };

  const filteredItems = useMemo(() => {
    return searchInput.trim()
      ? items.filter((item) => item.name.toLowerCase().includes(searchInput.toLowerCase()))
      : items;
  }, [items, searchInput]);

  const total = items.filter((item) => !item.checked).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const checkedCount = items.filter((item) => item.checked).length;

  if (view === "lists") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Minhas Listas</Text>
            <Text style={styles.headerSub}>Gere as tuas compras</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => void loadLists()}>
            <RefreshCw size={20} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
          {isLoading && lists.length === 0 ? (
            <View style={styles.card}><ActivityIndicator color={Colors.primary600} /></View>
          ) : (
            <>
              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.card}
                  onPress={() => { setActiveListId(list.id); setView("items"); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.listCardRow}>
                    <View style={styles.listCardIcon}>
                      <ShoppingCart size={20} color={Colors.primary600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listCardName}>{list.name}</Text>
                      <Text style={styles.listCardCount}>{list.items?.length ?? 0} itens</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.gray300} />
                  </View>
                </TouchableOpacity>
              ))}

              {!lists.length && !isLoading && (
                <View style={styles.card}>
                  <Text style={{ fontSize: 14, color: Colors.gray500 }}>Ainda não tens listas.</Text>
                </View>
              )}

              <View style={styles.createListCard}>
                <View style={styles.createListInput}>
                  <TextInput
                    value={newListName}
                    onChangeText={setNewListName}
                    placeholder="Nome da nova lista"
                    placeholderTextColor={Colors.gray400}
                    style={styles.searchInput}
                  />
                </View>
                <TouchableOpacity style={styles.newListBtn} onPress={() => void handleCreateList()} activeOpacity={0.8}>
                  <Plus size={20} color={Colors.gray400} />
                  <Text style={styles.newListText}>Create New List</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setView("lists")}>
          <ChevronLeft size={18} color={Colors.gray500} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { flex: 1 }]} numberOfLines={1}>{activeList?.name ?? "Lista"}</Text>
        <TouchableOpacity style={styles.iconBtnSm} onPress={() => activeListId && void loadItems(activeListId)}>
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
          <Text style={styles.totalText}>€{total.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 96 }}>
        {isLoading && filteredItems.length === 0 ? (
          <ActivityIndicator color={Colors.primary600} />
        ) : !filteredItems.length ? (
          <View style={styles.card}><Text style={{ fontSize: 13, color: Colors.gray500, textAlign: "center" }}>Nenhum item adicionado.</Text></View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemEmoji}><Text style={{ fontSize: 20 }}>{item.emoji ?? "??"}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.quantity} un · {item.storeName}</Text>
              </View>
              <Text style={[styles.itemPrice, item.checked && { color: Colors.gray400 }]}>
                €{(item.price * item.quantity).toFixed(2)}
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
  headerSub: { fontSize: 14, color: Colors.gray400 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center" },
  iconBtnSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: Radii["3xl"], padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  listCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  listCardIcon: { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  listCardName: { fontSize: 15, fontWeight: "700", color: Colors.gray900 },
  listCardCount: { fontSize: 12, color: Colors.gray400 },
  createListCard: { gap: 10 },
  createListInput: { backgroundColor: Colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 48, justifyContent: "center" },
  newListBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: Radii["3xl"], borderWidth: 2, borderStyle: "dashed", borderColor: Colors.gray200 },
  newListText: { fontSize: 14, fontWeight: "600", color: Colors.gray400 },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.surface },
  progressTrack: { flex: 1, height: 8, backgroundColor: Colors.gray100, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.primary500, borderRadius: 99 },
  progressText: { fontSize: 12, fontWeight: "600", color: Colors.gray500 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: Colors.surface },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.gray50, borderRadius: Radii.xl, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 13, color: Colors.gray900 },
  totalBadge: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.primary50, borderRadius: Radii.xl },
  totalText: { fontSize: 13, fontWeight: "700", color: Colors.primary600 },
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
