import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, ChevronDown, Filter, TrendingDown, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";

type AlertItem = {
  id: number;
  product: string;
  emoji: string;
  dropPct: number;
  from: number;
  to: number;
  store: string;
  time: string;
  expanded: boolean;
};

const initialAlerts: AlertItem[] = [
  { id: 1, product: "Salmon Fillet", emoji: "🐟", dropPct: 22, from: 12.99, to: 10.1, store: "FreshMart", time: "2 min ago", expanded: false },
  { id: 2, product: "Almond Milk 1L", emoji: "🥛", dropPct: 15, from: 3.49, to: 2.99, store: "NatureMart", time: "18 min ago", expanded: false },
  { id: 3, product: "Avocado x4", emoji: "🥑", dropPct: 30, from: 4.99, to: 3.49, store: "FreshMart", time: "1 hr ago", expanded: false },
];

const storeFilters = ["Todas", "FreshMart", "NatureMart"];
const savingsFilters = [0, 10, 20, 30];

export function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showFilters, setShowFilters] = useState(false);
  const [storeFilter, setStoreFilter] = useState("Todas");
  const [minSavings, setMinSavings] = useState(0);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesStore = storeFilter === "Todas" || alert.store === storeFilter;
      const matchesSavings = alert.dropPct >= minSavings;
      return matchesStore && matchesSavings;
    });
  }, [alerts, minSavings, storeFilter]);

  const totalSavings = filteredAlerts.reduce((sum, alert) => sum + (alert.from - alert.to), 0);

  const toggleExpand = (id: number) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, expanded: !alert.expanded } : alert)),
    );
  };

  const dismissAlert = (id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Price alerts</Text>
          <Text style={styles.subtitle}>
            {filteredAlerts.length} alertas · poupança potencial de €{totalSavings.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters((value) => !value)}>
          <Filter size={18} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Loja</Text>
          <View style={styles.chipRow}>
            {storeFilters.map((store) => (
              <TouchableOpacity
                key={store}
                style={[styles.chip, storeFilter === store && styles.chipActive]}
                onPress={() => setStoreFilter(store)}
              >
                <Text style={[styles.chipText, storeFilter === store && styles.chipTextActive]}>{store}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Desconto mínimo</Text>
          <View style={styles.chipRow}>
            {savingsFilters.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, minSavings === value && styles.greenChipActive]}
                onPress={() => setMinSavings(value)}
              >
                <Text style={[styles.chipText, minSavings === value && styles.chipTextActive]}>
                  {value === 0 ? "Todos" : `${value}%+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <TrendingDown size={16} color={Colors.surface} />
        </View>
        <View>
          <Text style={styles.summaryTitle}>Quedas de preço hoje</Text>
          <Text style={styles.summarySubtitle}>{filteredAlerts.length} produtos com desconto</Text>
        </View>
        <Text style={styles.summaryValue}>€{totalSavings.toFixed(2)}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredAlerts.length ? (
          filteredAlerts.map((alert) => (
            <View key={alert.id} style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(alert.id)} activeOpacity={0.85}>
                <View style={styles.emojiBox}>
                  <Text style={styles.emoji}>{alert.emoji}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.productName}>{alert.product}</Text>
                  <Text style={styles.metaText}>
                    {alert.store} · {alert.time}
                  </Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.dropText}>↓ {alert.dropPct}%</Text>
                  <Text style={styles.newPrice}>€{alert.to.toFixed(2)}</Text>
                  <Text style={styles.oldPrice}>€{alert.from.toFixed(2)}</Text>
                </View>
                <ChevronDown
                  size={18}
                  color={Colors.gray400}
                  style={{ transform: [{ rotate: alert.expanded ? "180deg" : "0deg" }] }}
                />
              </TouchableOpacity>

              {alert.expanded && (
                <View style={styles.expanded}>
                  <Text style={styles.expandedText}>
                    Melhor preço atual em {alert.store}. Diferença total: €{(alert.from - alert.to).toFixed(2)}.
                  </Text>
                  <View style={styles.expandedActions}>
                    <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
                      <Text style={styles.addButtonText}>Adicionar à lista</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dismissButton} onPress={() => dismissAlert(alert.id)} activeOpacity={0.85}>
                      <X size={16} color={Colors.gray600} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Bell size={34} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Sem alertas com estes filtros</Text>
            <Text style={styles.emptySubtitle}>Ajusta os filtros para voltares a ver resultados.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  title: { fontSize: Typography["3xl"], fontWeight: "700", color: Colors.gray900 },
  subtitle: { fontSize: Typography.base, color: Colors.gray500, marginTop: 4 },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanel: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  filterLabel: { fontSize: Typography.sm, fontWeight: "700", color: Colors.gray500, textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.xl, backgroundColor: Colors.gray100 },
  chipActive: { backgroundColor: Colors.primary600 },
  greenChipActive: { backgroundColor: Colors.success500 },
  chipText: { fontSize: Typography.sm, fontWeight: "600", color: Colors.gray600 },
  chipTextActive: { color: Colors.surface },
  summaryCard: {
    margin: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.success50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.success500,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontSize: Typography.base, fontWeight: "700", color: Colors.gray900 },
  summarySubtitle: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
  summaryValue: { marginLeft: "auto", fontSize: Typography["2xl"], fontWeight: "800", color: Colors.success500 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: Radii.xl,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 24 },
  cardBody: { flex: 1 },
  productName: { fontSize: Typography.md, fontWeight: "700", color: Colors.gray900 },
  metaText: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 3 },
  priceBox: { alignItems: "flex-end", marginRight: 4 },
  dropText: { fontSize: Typography.sm, fontWeight: "700", color: Colors.success500 },
  newPrice: { fontSize: Typography.lg, fontWeight: "800", color: Colors.gray900, marginTop: 3 },
  oldPrice: { fontSize: Typography.sm, color: Colors.gray400, textDecorationLine: "line-through" },
  expanded: { borderTopWidth: 1, borderTopColor: Colors.gray100, padding: 16, gap: 12 },
  expandedText: { fontSize: Typography.base, color: Colors.gray600, lineHeight: 20 },
  expandedActions: { flexDirection: "row", gap: 10 },
  addButton: {
    flex: 1,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: Colors.primary600,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { fontSize: Typography.base, fontWeight: "700", color: Colors.surface },
  dismissButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: Typography.lg, fontWeight: "700", color: Colors.gray700 },
  emptySubtitle: { fontSize: Typography.base, color: Colors.gray500, textAlign: "center" },
});
