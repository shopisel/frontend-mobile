import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus, RefreshCw, ShoppingCart, ChevronRight, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLists, type ListResponse } from "../../api/useLists";
import { Radii } from "../../styles/typography";
import { useTheme } from "../../theme/ThemeProvider";

export function ListsOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { getLists, createList, removeList } = useLists();

  const [lists, setLists] = useState<ListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      setShowCreateModal(false);
      setLoadError(null);
      router.push(`/lists/${newList.id}` as never);
    } catch (error) {
      console.error(error);
      setLoadError(error instanceof Error ? error.message : t("lists.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    setIsLoading(true);
    try {
      await removeList(listId);
      setLists((current) => current.filter((list) => list.id !== listId));
      setLoadError(null);
    } catch (error) {
      console.error(error);
      setLoadError(error instanceof Error ? error.message : t("lists.deleteError"));
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
          <RefreshCw size={20} color={colors.gray500} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
        {isLoading && lists.length === 0 ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.primary600} />
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
              <View key={list.id} style={styles.card}>
                <View style={styles.listCardRow}>
                  <TouchableOpacity
                    style={styles.listCardMain}
                    onPress={() => router.push(`/lists/${list.id}` as never)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.listCardIcon}>
                      <ShoppingCart size={20} color={colors.primary600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listCardName}>{list.name}</Text>
                      <Text style={styles.listCardCount}>{t("lists.itemCount", { count: list.items?.length ?? 0 })}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.gray300} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteListButton}
                    onPress={() => void handleDeleteList(list.id)}
                    activeOpacity={0.85}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {!lists.length && !isLoading && !loadError && (
              <View style={styles.card}>
                <Text style={styles.emptyText}>{t("lists.noLists")}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.openCreateButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.85}
            >
              <Plus size={20} color={colors.surface} />
              <Text style={styles.openCreateButtonText}>{t("lists.openCreateForm")}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCreateModal(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("lists.createFormTitle")}</Text>
            <View style={styles.createListInput}>
              <TextInput
                value={newListName}
                onChangeText={setNewListName}
                placeholder={t("lists.newListPlaceholder")}
                placeholderTextColor={colors.gray400}
                style={styles.searchInput}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewListName("");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSecondaryButtonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={() => void handleCreateList()} activeOpacity={0.85}>
                <Text style={styles.modalPrimaryButtonText}>{t("common.create")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: colors.surface, gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.gray900 },
  headerSub: { fontSize: 14, color: colors.gray400 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.surface, borderRadius: Radii["3xl"], padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  errorCard: { backgroundColor: "#FEF2F2", borderRadius: Radii["3xl"], padding: 20, borderWidth: 1, borderColor: "#FECACA" },
  errorTitle: { fontSize: 14, fontWeight: "700", color: "#B91C1C", marginBottom: 6 },
  errorText: { fontSize: 13, color: "#DC2626" },
  listCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  listCardMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  listCardIcon: { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: colors.primary50, alignItems: "center", justifyContent: "center" },
  listCardName: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  listCardCount: { fontSize: 12, color: colors.gray400 },
  deleteListButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  createListInput: { backgroundColor: colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 48, justifyContent: "center" },
  searchInput: { flex: 1, fontSize: 13, color: colors.gray900 },
  openCreateButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: Radii["3xl"], backgroundColor: colors.primary600 },
  openCreateButtonText: { fontSize: 14, fontWeight: "700", color: colors.surface },
  emptyText: { fontSize: 14, color: colors.gray500 },
  modalOverlay: { flex: 1, justifyContent: "center", paddingHorizontal: 20, backgroundColor: "rgba(17,24,39,0.32)" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalCard: { backgroundColor: colors.surface, borderRadius: Radii["3xl"], padding: 20, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalSecondaryButton: { flex: 1, height: 48, borderRadius: Radii["2xl"], backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  modalSecondaryButtonText: { fontSize: 14, fontWeight: "700", color: colors.gray700 },
  modalPrimaryButton: { flex: 1, height: 48, borderRadius: Radii["2xl"], backgroundColor: colors.primary600, alignItems: "center", justifyContent: "center" },
  modalPrimaryButtonText: { fontSize: 14, fontWeight: "700", color: colors.surface },
  });
}
