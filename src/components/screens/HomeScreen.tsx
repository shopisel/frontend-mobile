import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { Search, Bell, Plus, ChevronRight, TrendingDown, MapPin, ShoppingBag, Zap } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { useAuth } from "../../auth/AuthProvider";

const listItems = [
  { id: 1, name: "Organic Apples", qty: "1 kg",   price: "€2.49", store: "FreshMart",  checked: false, color: Colors.greenCard,  emoji: "🍎" },
  { id: 2, name: "Whole Milk 2L",  qty: "2 pcs",  price: "€3.20", store: "CostPlus",   checked: true,  color: Colors.blueCard,   emoji: "🥛" },
  { id: 3, name: "Sourdough Bread",qty: "1 loaf", price: "€4.50", store: "BakeryHub",  checked: false, color: Colors.orangeCard, emoji: "🍞" },
];
const deals = [
  { id: 1, name: "Greek Yogurt",    discount: "30% off", price: "€1.89", original: "€2.69", store: "FreshMart",  dist: "0.3 km", color: Colors.purpleCard, emoji: "🥣" },
  { id: 2, name: "Free-Range Eggs", discount: "20% off", price: "€3.99", original: "€4.99", store: "NatureMart", dist: "0.7 km", color: Colors.greenCard,  emoji: "🥚" },
  { id: 3, name: "Pasta Pack x5",   discount: "15% off", price: "€2.50", original: "€2.95", store: "CostPlus",   dist: "1.1 km", color: Colors.orangeCard, emoji: "🍝" },
];
const alerts = [
  { id: 1, name: "Salmon Fillet", drop: "↓ 22%", from: "€12.99", to: "€10.10", store: "FreshMart" },
  { id: 2, name: "Almond Milk",   drop: "↓ 15%", from: "€3.49",  to: "€2.99",  store: "NatureMart" },
];

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [quickAdd, setQuickAdd] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set([2]));

  const displayName = user?.name ?? user?.username ?? "Utilizador";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const toggleItem = (id: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => onNavigate("alerts")}>
            <Bell size={20} color={Colors.primary600} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      {/* Quick add */}
      <View style={styles.quickAddRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.gray400} />
          <TextInput
            value={quickAdd}
            onChangeText={setQuickAdd}
            placeholder="Quick add to list..."
            placeholderTextColor={Colors.gray400}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => onNavigate("lists")} activeOpacity={0.85}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Summary stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Items", value: "12", Icon: ShoppingBag, color: Colors.primary600, bg: Colors.purpleCard },
            { label: "Saved", value: "€4.80", Icon: TrendingDown, color: Colors.success500, bg: Colors.greenCard },
            { label: "Alerts", value: "3",  Icon: Zap,          color: Colors.warning500, bg: Colors.warning50 },
          ].map(({ label, value, Icon, color, bg }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: bg }]}>
              <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
                <Icon size={16} color={color} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Shopping list preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My List</Text>
            <TouchableOpacity onPress={() => onNavigate("lists")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {listItems.map((item, idx) => (
              <View key={item.id} style={[styles.listRow, idx < listItems.length - 1 && styles.listRowBorder]}>
                <View style={[styles.emoji, { backgroundColor: item.color }]}>
                  <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, checkedItems.has(item.id) && styles.itemNameChecked]}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.qty} · {item.store}</Text>
                </View>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <TouchableOpacity
                  onPress={() => toggleItem(item.id)}
                  style={[styles.checkbox, checkedItems.has(item.id) && styles.checkboxChecked]}
                >
                  {checkedItems.has(item.id) && <Text style={{ color: "#fff", fontSize: 10 }}>✓</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Nearby deals */}
        <View style={{ marginBottom: 16 }}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <Text style={styles.sectionTitle}>Nearby Deals</Text>
            <TouchableOpacity onPress={() => onNavigate("prices")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {deals.map(deal => (
              <TouchableOpacity key={deal.id} style={[styles.dealCard, { backgroundColor: deal.color }]} onPress={() => onNavigate("prices")} activeOpacity={0.85}>
                <Text style={{ fontSize: 36, marginBottom: 6 }}>{deal.emoji}</Text>
                <Text style={styles.dealName}>{deal.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                  <Text style={styles.dealPrice}>{deal.price}</Text>
                  <Text style={styles.dealOriginal}>{deal.original}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 6 }}>
                  <MapPin size={10} color={Colors.gray400} />
                  <Text style={styles.dealDist}>{deal.dist}</Text>
                </View>
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>{deal.discount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Active alerts */}
        <View style={[styles.section, { paddingBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <TouchableOpacity onPress={() => onNavigate("alerts")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={16} color={Colors.primary600} />
            </TouchableOpacity>
          </View>
          <View style={{ gap: 10 }}>
            {alerts.map(alert => (
              <View key={alert.id} style={styles.alertRow}>
                <View style={styles.alertIcon}>
                  <TrendingDown size={16} color={Colors.success500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertName}>{alert.name}</Text>
                  <Text style={styles.alertStore}>{alert.store}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.alertDrop}>{alert.drop}</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                    <Text style={styles.alertTo}>{alert.to}</Text>
                    <Text style={styles.alertFrom}>{alert.from}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: Colors.surface },
  greeting: { fontSize: 13, color: Colors.gray400 },
  name: { fontSize: 22, fontWeight: "700", color: Colors.gray900 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary50, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary600, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  quickAddRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.surface },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.gray900 },
  addBtn: { width: 48, height: 48, borderRadius: Radii["2xl"], backgroundColor: Colors.primary600, alignItems: "center", justifyContent: "center", shadowColor: Colors.primary600, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  statCard: { flex: 1, borderRadius: Radii["2xl"], padding: 12, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: Radii.lg, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.gray900 },
  statLabel: { fontSize: 11, color: Colors.gray500 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.gray900 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: Colors.primary600 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii["3xl"], overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  emoji: { width: 40, height: 40, borderRadius: Radii.lg, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.gray900 },
  itemNameChecked: { textDecorationLine: "line-through", color: Colors.gray400 },
  itemSub: { fontSize: 12, color: Colors.gray400 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: Colors.success500 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.gray300, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { borderColor: Colors.success500, backgroundColor: Colors.success500 },
  dealCard: { width: 176, borderRadius: Radii["3xl"], padding: 16, flexShrink: 0, position: "relative", overflow: "hidden" },
  dealName: { fontSize: 13, fontWeight: "700", color: Colors.gray900 },
  dealPrice: { fontSize: 16, fontWeight: "800", color: Colors.success500 },
  dealOriginal: { fontSize: 11, color: Colors.gray400, textDecorationLine: "line-through" },
  dealDist: { fontSize: 11, color: Colors.gray400 },
  dealBadge: { position: "absolute", top: 12, right: 12, backgroundColor: Colors.success500, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  dealBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  alertRow: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  alertIcon: { width: 32, height: 32, borderRadius: Radii.lg, backgroundColor: Colors.success50, alignItems: "center", justifyContent: "center" },
  alertName: { fontSize: 13, fontWeight: "600", color: Colors.gray900 },
  alertStore: { fontSize: 12, color: Colors.gray400 },
  alertDrop: { fontSize: 11, fontWeight: "700", color: Colors.success500 },
  alertTo: { fontSize: 13, fontWeight: "700", color: Colors.gray900 },
  alertFrom: { fontSize: 11, color: Colors.gray400, textDecorationLine: "line-through" },
});
