import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus, RefreshCw, ShoppingCart, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLists, type ListResponse } from "../../api/useLists";
import { Colors } from "../../styles/colors";
import { Radii } from "../../styles/typography";

export function ListsOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { getLists, createList } = useLists();

  const [lists, setLists] = useState<ListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getLists();
      setLists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLists([]);
      setLoadError(error instanceof Error ? error.message : t("lists.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [getLists, t]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setIsLoading(true);
    try {
      const newList = await createList(newListName.trim());
      setLists((current) => [newList, ...current]);
      setNewListName("");
      setLoadError(null);
      router.push(`/lists/${newList.id}` as never);
    } catch (error) {
      console.error(error);
      setLoadError(error instanceof Error ? error.message : t("lists.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t("lists.title")}</Text>
          <Text style={styles.headerSub}>{t("lists.subtitle")}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => void loadLists()}>
          <RefreshCw size={20} color={Colors.gray500} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
        {isLoading && lists.length === 0 ? (
          <View style={styles.card}>
            <ActivityIndicator color={Colors.primary600} />
          </View>
        ) : (
          <>
            {loadError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>{t("lists.loadError")}</Text>
                <Text style={styles.errorText}>{loadError}</Text>
              </View>
            )}

            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={styles.card}
                onPress={() => router.push(`/lists/${list.id}` as never)}
                activeOpacity={0.85}
              >
                <View style={styles.listCardRow}>
                  <View style={styles.listCardIcon}>
                    <ShoppingCart size={20} color={Colors.primary600} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listCardName}>{list.name}</Text>
                    <Text style={styles.listCardCount}>{t("lists.itemCount", { count: list.items?.length ?? 0 })}</Text>
                  </View>
                  <ChevronRight size={20} color={Colors.gray300} />
                </View>
              </TouchableOpacity>
            ))}

            {!lists.length && !isLoading && !loadError && (
              <View style={styles.card}>
                <Text style={styles.emptyText}>{t("lists.noLists")}</Text>
              </View>
            )}

            <View style={styles.createListCard}>
              <View style={styles.createListInput}>
                <TextInput
                  value={newListName}
                  onChangeText={setNewListName}
                  placeholder={t("lists.newListPlaceholder")}
                  placeholderTextColor={Colors.gray400}
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity style={styles.newListBtn} onPress={() => void handleCreateList()} activeOpacity={0.8}>
                <Plus size={20} color={Colors.gray400} />
                <Text style={styles.newListText}>{t("lists.createNewList")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: Colors.surface, gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.gray900 },
  headerSub: { fontSize: 14, color: Colors.gray400 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray50, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: Radii["3xl"], padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  errorCard: { backgroundColor: "#FEF2F2", borderRadius: Radii["3xl"], padding: 20, borderWidth: 1, borderColor: "#FECACA" },
  errorTitle: { fontSize: 14, fontWeight: "700", color: "#B91C1C", marginBottom: 6 },
  errorText: { fontSize: 13, color: "#DC2626" },
  listCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  listCardIcon: { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  listCardName: { fontSize: 15, fontWeight: "700", color: Colors.gray900 },
  listCardCount: { fontSize: 12, color: Colors.gray400 },
  createListCard: { gap: 10 },
  createListInput: { backgroundColor: Colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 48, justifyContent: "center" },
  searchInput: { flex: 1, fontSize: 13, color: Colors.gray900 },
  newListBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: Radii["3xl"], borderWidth: 2, borderStyle: "dashed", borderColor: Colors.gray200 },
  newListText: { fontSize: 14, fontWeight: "600", color: Colors.gray400 },
  emptyText: { fontSize: 14, color: Colors.gray500 },
});
