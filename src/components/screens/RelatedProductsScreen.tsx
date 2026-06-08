import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Loader, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { Product } from "../../api/useProducts";
import { useProducts } from "../../api/useProducts";
import { useTheme } from "../../theme/ThemeProvider";
import { Radii, Typography } from "../../styles/typography";
import { getCategoryImage } from "../../utils/categoryImages";
import { useFavorites } from "../../favorites/FavoritesProvider";

type RelatedProductsScreenProps = {
  productId: string;
};

export function RelatedProductsScreen({ productId }: RelatedProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { favoriteProductIds } = useFavorites();
  const { getProductsByIds, getRelatedProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!productId.trim()) {
        setProduct(null);
        setRelatedProducts([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [current] = await getProductsByIds([productId]);
        if (cancelled) return;
        setProduct(current ?? null);

        const related = await getRelatedProducts([productId], 24);
        if (cancelled) return;
        setRelatedProducts((related ?? []).filter((item) => item.id !== productId));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setProduct(null);
          setRelatedProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [getProductsByIds, getRelatedProducts, productId, t]);

  const openProductPrices = (targetId: string) => {
    router.push({
      pathname: "/(tabs)/prices",
      params: { productId: targetId },
    } as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <ChevronLeft size={18} color={colors.gray900} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("prices.relatedProductsMoreTitle")}</Text>
          <Text style={styles.subtitle}>{t("prices.relatedProductsMoreSubtitle")}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <Loader size={18} color={colors.primary600} />
            <Text style={styles.loadingText}>{t("prices.loadingRelatedProducts")}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <>
            {product ? (
              <View style={styles.productHero}>
                <View style={styles.productHeroImageBox}>
                  {getProductImageSource(product) ? (
                    <Image source={getProductImageSource(product)!} style={styles.productHeroImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.productHeroFallback}>{product.emoji ?? "PK"}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productHeroLabel}>{t("prices.relatedProducts")}</Text>
                  <Text style={styles.productHeroName} numberOfLines={2}>{product.name}</Text>
                  {product.brand ? <Text style={styles.productHeroBrand} numberOfLines={1}>{product.brand}</Text> : null}
                </View>
              </View>
            ) : null}

            {relatedProducts.length > 0 ? (
              <View style={styles.grid}>
                {relatedProducts.map((related) => {
                  const imageSource = getProductImageSource(related);
                  const isFavorite = favoriteProductIds.includes(related.id);

                  return (
                    <TouchableOpacity
                      key={related.id}
                      style={styles.card}
                      activeOpacity={0.9}
                      onPress={() => openProductPrices(related.id)}
                    >
                      <View style={styles.cardImageBox}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.cardFallback}>{related.emoji ?? "PK"}</Text>
                        )}
                      </View>
                      <Text style={styles.cardName} numberOfLines={2}>{related.name}</Text>
                      {related.brand ? <Text style={styles.cardBrand} numberOfLines={1}>{related.brand}</Text> : null}
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardAction}>{t("prices.selectProduct")}</Text>
                        {isFavorite ? <Star size={13} color="#F59E0B" fill="#F59E0B" /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t("prices.noRelatedProducts")}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getProductImageSource(product: Product) {
  const raw = product.image?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return { uri: raw };
  return getCategoryImage(product.image, product.categoryId);
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 14,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.gray100,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: Typography.xl, fontWeight: "800", color: colors.gray900 },
    subtitle: { marginTop: 2, fontSize: Typography.sm, color: colors.gray500 },
    content: { padding: 20, paddingBottom: 28, gap: 16 },
    loadingState: {
      marginTop: 18,
      paddingVertical: 28,
      borderRadius: Radii["3xl"],
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    loadingText: { fontSize: Typography.sm, fontWeight: "600", color: colors.gray600 },
    emptyState: {
      paddingVertical: 28,
      borderRadius: Radii["3xl"],
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: { fontSize: Typography.sm, color: colors.gray500, textAlign: "center" },
    productHero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: Radii["3xl"],
      padding: 16,
      backgroundColor: colors.primary600,
      shadowColor: colors.primary600,
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    productHeroImageBox: {
      width: 44,
      height: 44,
      borderRadius: Radii["2xl"],
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    productHeroImage: { width: "100%", height: "100%" },
    productHeroFallback: { fontSize: 16, fontWeight: "800", color: colors.surface },
    productHeroLabel: { fontSize: Typography.xs, color: "#E0E7FF", textTransform: "uppercase", letterSpacing: 0.6 },
    productHeroName: { fontSize: Typography.lg, fontWeight: "800", color: colors.surface, marginTop: 2 },
    productHeroBrand: { marginTop: 3, fontSize: Typography.sm, color: "#E0E7FF" },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      width: "48.5%",
      borderRadius: Radii["2xl"],
      backgroundColor: colors.surface,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    cardImageBox: {
      height: 64,
      borderRadius: Radii.xl,
      backgroundColor: colors.gray50,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: 10,
    },
    cardImage: { width: "100%", height: "100%" },
    cardFallback: { fontSize: 14, fontWeight: "800", color: colors.gray900 },
    cardName: { fontSize: Typography.sm, fontWeight: "700", color: colors.gray900, lineHeight: 18 },
    cardBrand: { marginTop: 2, fontSize: Typography.xs, color: colors.gray500 },
    cardFooter: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    cardAction: { fontSize: Typography.xs, fontWeight: "800", color: colors.primary600 },
  });
}
