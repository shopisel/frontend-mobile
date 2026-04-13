import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import { useState } from "react";
import { MapPin, Search, ArrowUpDown, Tag, Navigation } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";

const products = [
  {
    id: 1, name: "Organic Whole Milk 2L", emoji: "🥛", category: "Dairy",
    stores: [
      { name: "FreshMart",  price: 2.99, dist: "0.3 km", promo: "10% off",     rating: 4.5 },
      { name: "NatureMart", price: 3.29, dist: "0.7 km", promo: null,          rating: 4.2 },
      { name: "CostPlus",   price: 3.60, dist: "1.1 km", promo: null,          rating: 3.9 },
      { name: "BioShop",    price: 3.89, dist: "1.8 km", promo: "Member only", rating: 4.7 },
    ],
  },
  {
    id: 2, name: "Free-Range Eggs x12", emoji: "🥚", category: "Protein",
    stores: [
      { name: "NatureMart", price: 3.99, dist: "0.7 km", promo: "20% off", rating: 4.4 },
      { name: "FreshMart",  price: 4.49, dist: "0.3 km", promo: null,      rating: 4.5 },
      { name: "CostPlus",   price: 4.79, dist: "1.1 km", promo: null,      rating: 3.9 },
    ],
  },
  {
    id: 3, name: "Sourdough Bread Loaf", emoji: "🍞", category: "Bakery",
    stores: [
      { name: "BakeryHub", price: 4.50, dist: "0.5 km", promo: "Fresh today", rating: 4.8 },
      { name: "FreshMart", price: 4.99, dist: "0.3 km", promo: null,          rating: 4.5 },
      { name: "CostPlus",  price: 3.80, dist: "1.1 km", promo: null,          rating: 3.9 },
    ],
  },
];

const categories = ["All", "Dairy", "Produce", "Protein", "Bakery", "Grains"];

export function PricesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [sortBy, setSortBy]                   = useState<"price" | "distance">("price");
  const [selectedCat, setSelectedCat]         = useState("All");
  const [mapView, setMapView]                 = useState(false);

  const sortedStores = [...selectedProduct.stores].sort((a, b) =>
    sortBy === "price" ? a.price - b.price : parseFloat(a.dist) - parseFloat(b.dist)
  );
  const savings = sortedStores[sortedStores.length - 1].price - sortedStores[0].price;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Price Compare</Text>
        <Text style={styles.subtitle}>Find the best deals nearby</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.gray400} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search any product..."
            placeholderTextColor={Colors.gray400}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCat(cat)}
            style={[styles.catChip, cat === selectedCat && styles.catChipActive]}
          >
            <Text style={[styles.catText, cat === selectedCat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Product selector */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={styles.sectionLabel}>SELECT PRODUCT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {products.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedProduct(p)}
                style={[styles.productChip, p.id === selectedProduct.id && styles.productChipActive]}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                <Text style={[styles.productChipText, p.id === selectedProduct.id && { color: Colors.primary600 }]} numberOfLines={1}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product detail card */}
        <View style={{ paddingHorizontal: 20, marginVertical: 16 }}>
          <View style={styles.detailCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={styles.detailEmoji}>
                <Text style={{ fontSize: 30 }}>{selectedProduct.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCategory}>{selectedProduct.category}</Text>
                <Text style={styles.detailName}>{selectedProduct.name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
              <View>
                <Text style={styles.detailLabel}>Best price</Text>
                <Text style={styles.detailPrice}>€{sortedStores[0].price.toFixed(2)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.detailLabel}>Max savings</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Tag size={14} color="#6EE7B7" />
                  <Text style={styles.detailSavings}>€{savings.toFixed(2)} off</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Sort + Map toggle */}
        <View style={styles.sortRow}>
          <Text style={styles.storeCount}>Stores ({sortedStores.length})</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortBy(sortBy === "price" ? "distance" : "price")}
            >
              <ArrowUpDown size={14} color={Colors.gray500} />
              <Text style={styles.sortBtnText}>{sortBy === "price" ? "Price" : "Distance"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortBtn, mapView && { backgroundColor: Colors.primary600 }]}
              onPress={() => setMapView(!mapView)}
            >
              <MapPin size={14} color={mapView ? "#fff" : Colors.gray500} />
              <Text style={[styles.sortBtnText, mapView && { color: "#fff" }]}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map view (visual placeholder) */}
        {mapView && (
          <View style={styles.mapPlaceholder}>
            {sortedStores.map((store, i) => (
              <View
                key={i}
                style={[styles.mapPin, {
                  left: `${20 + i * 22}%` as any,
                  top: `${25 + (i % 2) * 35}%` as any,
                  backgroundColor: i === 0 ? Colors.primary600 : Colors.surface,
                }]}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: i === 0 ? "#fff" : Colors.gray900 }}>
                  €{store.price.toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.userPin}>
              <Navigation size={16} color="#fff" fill="#fff" />
            </View>
          </View>
        )}

        {/* Store list */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}>
          {sortedStores.map((store, i) => (
            <View key={store.name} style={styles.storeCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.rankBadge, i === 0 && { backgroundColor: Colors.primary600 }]}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: i === 0 ? "#fff" : Colors.gray500 }}>#{i + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <MapPin size={12} color={Colors.gray400} />
                      <Text style={styles.storeDist}>{store.dist}</Text>
                      <Text style={styles.storeRating}>★ {store.rating}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.storePrice, i === 0 && { color: Colors.success500 }]}>€{store.price.toFixed(2)}</Text>
                  {i > 0 && <Text style={styles.storeExtra}>+€{(store.price - sortedStores[0].price).toFixed(2)} more</Text>}
                </View>
              </View>
              {store.promo && (
                <View style={styles.promoBadge}>
                  <Tag size={12} color="#059669" />
                  <Text style={styles.promoText}>{store.promo}</Text>
                </View>
              )}
            </View>
          ))}
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
  catScroll: { backgroundColor: Colors.surface, paddingVertical: 10, maxHeight: 52 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.lg, backgroundColor: Colors.gray100 },
  catChipActive: { backgroundColor: Colors.primary600 },
  catText: { fontSize: 13, fontWeight: "600", color: Colors.gray500 },
  catTextActive: { color: "#fff" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: Colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  productChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radii["2xl"], borderWidth: 2, borderColor: Colors.gray100, backgroundColor: Colors.surface, maxWidth: 160 },
  productChipActive: { borderColor: Colors.primary600, backgroundColor: Colors.primary50 },
  productChipText: { fontSize: 12, fontWeight: "600", color: Colors.gray500, flexShrink: 1 },
  detailCard: { borderRadius: Radii["3xl"], padding: 20, backgroundColor: Colors.primary600, shadowColor: Colors.primary600, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  detailEmoji: { width: 56, height: 56, borderRadius: Radii.xl, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  detailCategory: { fontSize: 12, color: "#C7D2FE" },
  detailName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  detailLabel: { fontSize: 11, color: "#C7D2FE" },
  detailPrice: { fontSize: 26, fontWeight: "800", color: "#fff" },
  detailSavings: { fontSize: 18, fontWeight: "700", color: "#6EE7B7" },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  storeCount: { fontSize: 14, fontWeight: "700", color: Colors.gray700 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.gray100, borderRadius: Radii.xl },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: Colors.gray600 },
  mapPlaceholder: { marginHorizontal: 20, marginBottom: 16, height: 160, borderRadius: Radii["2xl"], backgroundColor: Colors.primary50, position: "relative", overflow: "hidden" },
  mapPin: { position: "absolute", paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  userPin: { position: "absolute", bottom: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  storeCard: { backgroundColor: Colors.surface, borderRadius: Radii["2xl"], padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  rankBadge: { width: 32, height: 32, borderRadius: Radii.lg, backgroundColor: Colors.gray100, alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: 14, fontWeight: "700", color: Colors.gray900 },
  storeDist: { fontSize: 12, color: Colors.gray400 },
  storeRating: { fontSize: 11, color: "#FBBF24" },
  storePrice: { fontSize: 20, fontWeight: "800", color: Colors.gray900 },
  storeExtra: { fontSize: 11, color: "#F87171" },
  promoBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.success50, borderRadius: Radii.lg, alignSelf: "flex-start" },
  promoText: { fontSize: 11, fontWeight: "600", color: "#059669" },
});
