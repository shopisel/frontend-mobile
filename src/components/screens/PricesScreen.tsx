import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ArrowUpDown, Loader, MapPin, Navigation, Search, Star, Tag } from "lucide-react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { usePrices } from "../../api/usePrices";
import { useProducts, type Category, type Product } from "../../api/useProducts";
import { useStores } from "../../api/useStores";
import { formatCurrency } from "../../i18n/formatters";
import { Radii, Typography } from "../../styles/typography";
import { getCategoryImage } from "../../utils/categoryImages";
import { useTheme } from "../../theme/ThemeProvider";

type StoreRow = {
  id: string;
  name: string;
  brand?: string;
  address?: string;
  city?: string;
  price: number;
  distanceKm?: number;
  originalPrice?: number;
  discountPercent?: number;
  saleDate?: string;
};

type PricesScreenProps = {
  favoriteProductIds: string[];
  onToggleFavorite: (product: Product) => Promise<void>;
};

export function PricesScreen({ favoriteProductIds, onToggleFavorite }: PricesScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { searchProducts, getMainCategories, getSubCategories, getProductsByCategory, getRelatedProducts } = useProducts();
  const { getPrices } = usePrices();
  const { getStores } = useStores();

  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState<Category | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeRows, setStoreRows] = useState<StoreRow[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "distance">("price");
  const [mapView, setMapView] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingCats, setIsLoadingCats] = useState(false);
  const [isLoadingSubCats, setIsLoadingSubCats] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingRelatedProducts, setIsLoadingRelatedProducts] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getFallbackStoreName = (storeId: string) => {
    switch (storeId) {
      case "store-1":
        return "Continente";
      case "store-2":
        return "Pingo Doce";
      default:
        return t("common.unknownStore");
    }
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const calculateDistanceKm = (
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
  ) => {
    const earthRadiusKm = 6371;
    const deltaLatitude = toRadians(toLatitude - fromLatitude);
    const deltaLongitude = toRadians(toLongitude - fromLongitude);
    const a =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(toRadians(fromLatitude)) *
        Math.cos(toRadians(toLatitude)) *
        Math.sin(deltaLongitude / 2) ** 2;

    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const resetCategorySelection = () => {
    setSelectedMainCat(null);
    setSelectedSubCat(null);
    setSubCategories([]);
  };

  const resetProductSelection = () => {
    setProducts([]);
    setSelectedProduct(null);
    setStoreRows([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      resetCategorySelection();
      resetProductSelection();
    }
  };

  const handleSelectMainCategory = (category: Category | null) => {
    if (searchQuery.trim()) setSearchQuery("");
    setSelectedMainCat(category);
  };

  const handleSelectSubCategory = (category: Category) => {
    if (searchQuery.trim()) setSearchQuery("");
    setSelectedSubCat(category);
  };

  useEffect(() => {
    let cancelled = false;

    const loadUserLocation = async () => {
      setIsLoadingLocation(true);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (permission.status !== "granted") {
          setError(t("prices.locationDenied"));
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        setUserLocation({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
        }
      } finally {
        if (!cancelled) setIsLoadingLocation(false);
      }
    };

    void loadUserLocation();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoadingCats(true);
      setError(null);
      try {
        const data = await getMainCategories();
        if (cancelled) return;
        setMainCategories(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("errors.requestFailed"));
      } finally {
        if (!cancelled) setIsLoadingCats(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [getMainCategories, t]);

  useEffect(() => {
    let cancelled = false;

    const loadSubCategories = async (mainCategoryId: string) => {
      setIsLoadingSubCats(true);
      setError(null);
      try {
        const data = await getSubCategories(mainCategoryId);
        if (cancelled) return;
        setSubCategories(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setSubCategories([]);
        }
      } finally {
        if (!cancelled) setIsLoadingSubCats(false);
      }
    };

    setSelectedSubCat(null);
    setSubCategories([]);
    resetProductSelection();

    if (selectedMainCat) {
      void loadSubCategories(selectedMainCat.id);
    }

    return () => {
      cancelled = true;
    };
  }, [getSubCategories, selectedMainCat, t]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoadingProducts(true);
      setError(null);
      try {
        const data = await searchProducts(query);
        if (cancelled) return;
        setProducts(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchProducts, searchQuery, t]);

  useEffect(() => {
    if (searchQuery.trim()) return;

    let cancelled = false;

    const loadProducts = async (subCategoryId: string) => {
      setIsLoadingProducts(true);
      setError(null);
      try {
        const data = await getProductsByCategory(subCategoryId);
        if (cancelled) return;
        setProducts(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };

    resetProductSelection();

    if (selectedSubCat) {
      void loadProducts(selectedSubCat.id);
    }

    return () => {
      cancelled = true;
    };
  }, [getProductsByCategory, searchQuery, selectedSubCat, t]);

  useEffect(() => {
    if (!products.length) {
      setSelectedProduct(null);
      setStoreRows([]);
      setRelatedProducts([]);
      return;
    }

    if (!selectedProduct || !products.some((product) => product.id === selectedProduct.id)) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      setStoreRows([]);
      setRelatedProducts([]);
      return;
    }

    let cancelled = false;

    const loadStores = async () => {
      setIsLoadingStores(true);
      setError(null);
      try {
        const prices = await getPrices(selectedProduct.id);
        const storeIds = Array.from(new Set((prices ?? []).map((price) => price.storeId)));
        const stores = storeIds.length ? await getStores({ ids: storeIds.join(",") }) : [];
        const storesById = new Map((stores ?? []).map((store) => [store.id, store] as const));
        const brandNames = Array.from(new Set(
          (stores ?? [])
            .map((store) => store.brand?.trim())
            .filter((brand): brand is string => Boolean(brand)),
        ));
        const branchStores = brandNames.length ? await getStores({ brands: brandNames.join(",") }) : [];

        const branchesByBrand = branchStores.reduce<Record<string, typeof branchStores>>((acc, store) => {
          const brand = store.brand?.trim();
          if (!brand) return acc;
          acc[brand] = acc[brand] ? [...acc[brand], store] : [store];
          return acc;
        }, {});

        const rows: StoreRow[] = (prices ?? []).flatMap((price) => {
          const hasSale = typeof price.sale === "number" && price.sale > 0 && price.sale < price.price;
          const store = storesById.get(price.storeId);
          const candidateBranches = store?.brand ? branchesByBrand[store.brand] ?? [] : [];

          const orderedBranches = [...candidateBranches].sort((left, right) => {
            const leftHasCoordinates = typeof left.latitude === "number" && typeof left.longitude === "number";
            const rightHasCoordinates = typeof right.latitude === "number" && typeof right.longitude === "number";

            if (userLocation && leftHasCoordinates && rightHasCoordinates) {
              const leftDistance = calculateDistanceKm(userLocation.latitude, userLocation.longitude, left.latitude!, left.longitude!);
              const rightDistance = calculateDistanceKm(userLocation.latitude, userLocation.longitude, right.latitude!, right.longitude!);
              return leftDistance - rightDistance;
            }

            if (leftHasCoordinates && !rightHasCoordinates) return -1;
            if (!leftHasCoordinates && rightHasCoordinates) return 1;
            return left.name.localeCompare(right.name);
          });

          const displayStores = orderedBranches.length > 0 ? orderedBranches.slice(0, 3) : [store].filter(Boolean);

          return displayStores.map((displayStore, index) => ({
            id: `${price.storeId}-${displayStore?.id ?? "fallback"}-${index}`,
            name: displayStore?.name ?? store?.name ?? getFallbackStoreName(price.storeId),
            brand: store?.brand,
            address: displayStore?.address,
            city: displayStore?.city,
            price: hasSale ? price.sale as number : price.price,
            distanceKm:
              userLocation && typeof displayStore?.latitude === "number" && typeof displayStore?.longitude === "number"
                ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, displayStore.latitude, displayStore.longitude)
                : undefined,
            originalPrice: hasSale ? price.price : undefined,
            discountPercent: hasSale ? Math.round(((price.price - (price.sale as number)) / price.price) * 100) : undefined,
            saleDate: hasSale ? price.saleDate : undefined,
          }));
        });

        if (cancelled) return;
        setStoreRows(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("errors.requestFailed"));
          setStoreRows([]);
        }
      } finally {
        if (!cancelled) setIsLoadingStores(false);
      }
    };

    void loadStores();
    return () => {
      cancelled = true;
    };
  }, [getPrices, getStores, selectedProduct, t, userLocation]);

  useEffect(() => {
    if (!selectedProduct) {
      setRelatedProducts([]);
      return;
    }

    let cancelled = false;

    const loadRelated = async () => {
      setIsLoadingRelatedProducts(true);
      try {
        const data = await getRelatedProducts([selectedProduct.id], 6);
        if (cancelled) return;
        setRelatedProducts((data ?? []).filter((product) => product.id !== selectedProduct.id));
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setRelatedProducts([]);
        }
      } finally {
        if (!cancelled) setIsLoadingRelatedProducts(false);
      }
    };

    void loadRelated();
    return () => {
      cancelled = true;
    };
  }, [getRelatedProducts, selectedProduct]);

  const sortedStores = useMemo(() => {
    return [...storeRows].sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (typeof a.distanceKm === "number" && typeof b.distanceKm === "number") return a.distanceKm - b.distanceKm;
      if (typeof a.distanceKm === "number") return -1;
      if (typeof b.distanceKm === "number") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [sortBy, storeRows]);

  const savings = useMemo(() => {
    if (sortedStores.length < 2) return 0;
    return sortedStores[sortedStores.length - 1].price - sortedStores[0].price;
  }, [sortedStores]);

  const maxSavingsValue = useMemo(() => {
    const discountedStore = sortedStores.find(
      (store) => typeof store.originalPrice === "number" && store.originalPrice > store.price,
    );

    if (discountedStore?.originalPrice) {
      return discountedStore.originalPrice - discountedStore.price;
    }

    return savings;
  }, [savings, sortedStores]);

  const formatSaleDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("pt-PT");
  };

  const selectedProductFavorite = selectedProduct ? favoriteProductIds.includes(selectedProduct.id) : false;

  const getProductImageSource = (product: Product) => {
    const raw = product.image?.trim();
    if (raw && /^https?:\/\//i.test(raw)) return { uri: raw };
    return getCategoryImage(product.image, product.categoryId);
  };

  const handleToggleFavorite = async (product: Product) => {
    setFavoritePendingId(product.id);
    try {
      await onToggleFavorite(product);
    } catch (err) {
      console.error(err);
    } finally {
      setFavoritePendingId(null);
    }
  };

  const emptyProductsMessage = searchQuery.trim()
    ? t("prices.noProductsFound")
    : selectedMainCat && !selectedSubCat
      ? t("prices.selectSubcategory")
      : t("prices.noProductsToShow");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>{t("prices.title")}</Text>
        <Text style={styles.subtitle}>{t("prices.subtitle")}</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.gray400} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={t("prices.searchPlaceholder")}
            placeholderTextColor={colors.gray400}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
        <TouchableOpacity
          onPress={() => handleSelectMainCategory(null)}
          style={[styles.catChip, selectedMainCat === null && styles.catChipActive]}
          activeOpacity={0.85}
        >
          <Text style={[styles.catText, selectedMainCat === null && styles.catTextActive]}>{t("common.all")}</Text>
        </TouchableOpacity>

        {isLoadingCats ? (
          <View style={styles.loadingInline}>
            <Loader size={16} color={colors.gray400} />
            <Text style={styles.loadingInlineText}>{t("prices.loading")}</Text>
          </View>
        ) : (
          mainCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleSelectMainCategory(category)}
              style={[styles.catChip, category.id === selectedMainCat?.id && styles.catChipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.catText, category.id === selectedMainCat?.id && styles.catTextActive]}>{category.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedMainCat && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCatScroll} contentContainerStyle={styles.catScrollContent}>
          {isLoadingSubCats ? (
            <View style={styles.loadingInline}>
              <Loader size={16} color={colors.gray400} />
              <Text style={styles.loadingInlineText}>{t("prices.loading")}</Text>
            </View>
          ) : subCategories.length > 0 ? (
            subCategories.map((subCategory) => (
              <TouchableOpacity
                key={subCategory.id}
                onPress={() => handleSelectSubCategory(subCategory)}
                style={[styles.subCatChip, subCategory.id === selectedSubCat?.id && styles.subCatChipActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.subCatText, subCategory.id === selectedSubCat?.id && styles.subCatTextActive]}>{subCategory.name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyInline}>{t("prices.noSubcategories")}</Text>
          )}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("prices.selectProduct")}</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {isLoadingProducts ? (
            <View style={styles.loadingRow}>
              <Loader size={16} color={colors.gray400} />
              <Text style={styles.loadingText}>{t("prices.loadingProducts")}</Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsWrap}>
              {products.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                const imageSource = getProductImageSource(product);
                const isFavorite = favoriteProductIds.includes(product.id);

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, isSelected && styles.productCardActive]}
                    onPress={() => setSelectedProduct(product)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.productRow}>
                      <View style={styles.productImageBox}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.productFallback}>{product.emoji ?? "PK"}</Text>
                        )}
                      </View>
                      <Text style={[styles.productName, isSelected && styles.productNameActive]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      {isFavorite ? <Star size={14} color="#F59E0B" fill="#F59E0B" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>{emptyProductsMessage}</Text>
          )}
        </View>

        <View style={styles.section}>
          {selectedProduct ? (
            <View style={styles.detailCard}>
              <View style={styles.detailTopRow}>
                <View style={styles.detailImageBox}>
                  {getProductImageSource(selectedProduct) ? (
                    <Image source={getProductImageSource(selectedProduct)!} style={styles.detailImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.detailFallback}>{selectedProduct.emoji ?? "PK"}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailCategory}>{selectedSubCat?.name ?? selectedMainCat?.name ?? t("common.all")}</Text>
                  <Text style={styles.detailName}>{selectedProduct.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => void handleToggleFavorite(selectedProduct)}
                  activeOpacity={0.85}
                  disabled={favoritePendingId === selectedProduct.id}
                >
                  {favoritePendingId === selectedProduct.id ? (
                    <Loader size={18} color={colors.surface} />
                  ) : (
                    <Star
                      size={20}
                      color={selectedProductFavorite ? "#FCD34D" : "#E0E7FF"}
                      fill={selectedProductFavorite ? "#FCD34D" : "transparent"}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.detailStatsRow}>
                <View>
                  <Text style={styles.detailLabel}>{t("prices.bestPrice")}</Text>
                  <Text style={styles.detailPrice}>{sortedStores[0] ? formatCurrency(sortedStores[0].price, i18n.language) : "-"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.detailLabel}>{t("prices.maxSavings")}</Text>
                  <View style={styles.detailSavingsRow}>
                    <Tag size={14} color="#6EE7B7" />
                    <Text style={styles.detailSavings}>
                      {maxSavingsValue > 0 ? t("prices.savingsOff", { amount: formatCurrency(maxSavingsValue, i18n.language) }) : "-"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.relatedSection}>
                <Text style={styles.relatedSectionTitle}>{t("prices.relatedProducts")}</Text>

                {isLoadingRelatedProducts ? (
                  <View style={styles.relatedLoadingRow}>
                    <Loader size={16} color="#E0E7FF" />
                    <Text style={styles.relatedLoadingText}>{t("prices.loadingRelatedProducts")}</Text>
                  </View>
                ) : relatedProducts.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScrollContent}>
                    {relatedProducts.map((product) => {
                      const imageSource = getProductImageSource(product);

                      return (
                        <TouchableOpacity
                          key={product.id}
                          style={styles.relatedProductCard}
                          onPress={() => setSelectedProduct(product)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.relatedProductImageBox}>
                            {imageSource ? (
                              <Image source={imageSource} style={styles.relatedProductImage} resizeMode="cover" />
                            ) : (
                              <Text style={styles.relatedProductFallback}>{product.emoji ?? "PK"}</Text>
                            )}
                          </View>
                          <Text style={styles.relatedProductName} numberOfLines={2}>{product.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={styles.relatedEmptyText}>{t("prices.noRelatedProducts")}</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>{t("prices.noProductSelected")}</Text>
              <Text style={styles.placeholderText}>{t("prices.pickProduct")}</Text>
            </View>
          )}
        </View>

        <View style={styles.sortRow}>
          <View style={styles.storeCountRow}>
            <Text style={styles.storeCount}>{t("prices.stores", { count: sortedStores.length })}</Text>
            {isLoadingStores && <Loader size={16} color={colors.gray400} />}
          </View>
          <View style={styles.sortButtonsRow}>
            <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy(sortBy === "price" ? "distance" : "price")} activeOpacity={0.85}>
              <ArrowUpDown size={14} color={colors.gray500} />
              <Text style={styles.sortBtnText}>{sortBy === "price" ? t("prices.sortPrice") : t("prices.sortDistance")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortBtn, mapView && styles.mapBtnActive]} onPress={() => setMapView(!mapView)} activeOpacity={0.85}>
              <MapPin size={14} color={mapView ? colors.surface : colors.gray500} />
              <Text style={[styles.sortBtnText, mapView && styles.mapBtnTextActive]}>{t("prices.map")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {mapView && (
          <View style={styles.mapPlaceholder}>
            {sortedStores.map((store, index) => (
              <View
                key={store.id}
                style={[
                  styles.mapPin,
                  {
                    left: `${20 + index * 22}%`,
                    top: `${25 + (index % 2) * 35}%`,
                    backgroundColor: index === 0 ? colors.primary600 : colors.surface,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: index === 0 ? colors.surface : colors.gray900 }}>
                  {formatCurrency(store.price, i18n.language)}
                </Text>
              </View>
            ))}
            <View style={styles.userPin}>
              <Navigation size={16} color={colors.surface} fill={colors.surface} />
            </View>
          </View>
        )}

        <View style={styles.storesSection}>
          {sortBy === "distance" && !isLoadingLocation && !userLocation ? (
            <Text style={styles.emptyStateText}>{t("prices.enableLocationToSort")}</Text>
          ) : null}
          {sortedStores.length === 0 ? (
            <Text style={styles.emptyStateText}>{selectedProduct ? t("prices.noPrices") : t("prices.selectProductToSeePrices")}</Text>
          ) : (
            sortedStores.map((store, index) => (
              <View
                key={`${selectedProduct?.id ?? "none"}-${store.id}`}
                style={[styles.storeCard, index === 0 && styles.storeCardBest]}
              >
                <View style={styles.storeHeaderRow}>
                  <View style={styles.storeLeftRow}>
                    <View style={[styles.rankBadge, index === 0 && styles.rankBadgeActive]}>
                      <Text style={[styles.rankText, index === 0 && styles.rankTextActive]}>#{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.storeName}>{store.name}</Text>
                      {store.address || store.city ? (
                        <Text style={styles.storeAddress} numberOfLines={1}>
                          {[store.address, store.city].filter(Boolean).join(", ")}
                        </Text>
                      ) : null}
                      {typeof store.distanceKm === "number" ? (
                        <Text style={styles.storeDistance}>{t("prices.distanceAway", { value: store.distanceKm.toFixed(1) })}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.storePrice, index === 0 && { color: colors.success500 }]}>{formatCurrency(store.price, i18n.language)}</Text>
                    {typeof store.originalPrice === "number" && store.originalPrice > store.price ? (
                      <Text style={styles.storeOriginalPrice}>{formatCurrency(store.originalPrice, i18n.language)}</Text>
                    ) : null}
                    {typeof store.discountPercent === "number" ? (
                      <Text style={styles.storeDiscount}>-{store.discountPercent}%</Text>
                    ) : null}
                    {store.saleDate ? (
                      <Text style={styles.storeSaleDate}>Validade: {formatSaleDate(store.saleDate)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: colors.gray900 },
  subtitle: { fontSize: 14, color: colors.gray400, marginBottom: 16 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.gray50, borderRadius: Radii["2xl"], paddingHorizontal: 16, height: 44 },
  searchInput: { flex: 1, fontSize: Typography.base, color: colors.gray900 },
  catScroll: { backgroundColor: colors.surface, paddingVertical: 10, maxHeight: 56 },
  subCatScroll: { backgroundColor: colors.surface, paddingBottom: 10, maxHeight: 56 },
  catScrollContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.lg, backgroundColor: colors.gray100 },
  catChipActive: { backgroundColor: colors.primary600 },
  catText: { fontSize: 13, fontWeight: "600", color: colors.gray500 },
  catTextActive: { color: colors.surface },
  subCatChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.lg, backgroundColor: colors.gray100 },
  subCatChipActive: { backgroundColor: colors.gray900 },
  subCatText: { fontSize: 13, fontWeight: "600", color: colors.gray500 },
  subCatTextActive: { color: colors.surface },
  loadingInline: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6 },
  loadingInlineText: { fontSize: 13, fontWeight: "600", color: colors.gray400 },
  emptyInline: { fontSize: 13, fontWeight: "600", color: colors.gray400, paddingVertical: 8 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  errorText: { marginBottom: 10, fontSize: 12, fontWeight: "600", color: "#DC2626" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontWeight: "600", color: colors.gray400 },
  productsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  productCard: { width: "48.5%", borderRadius: Radii["2xl"], borderWidth: 2, borderColor: colors.gray100, backgroundColor: colors.surface, padding: 12 },
  productCardActive: { borderColor: colors.primary600, backgroundColor: colors.primary50 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  productImageBox: { width: 44, height: 44, borderRadius: Radii.xl, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  productImage: { width: "100%", height: "100%" },
  productFallback: { fontSize: 12, fontWeight: "800", color: colors.gray900 },
  productName: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.gray900, lineHeight: 18 },
  productNameActive: { color: colors.primary600 },
  emptyStateText: { fontSize: 13, fontWeight: "600", color: colors.gray400 },
  detailCard: { borderRadius: Radii["3xl"], padding: 20, backgroundColor: colors.primary600, shadowColor: colors.primary600, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  detailTopRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  detailImageBox: { width: 56, height: 56, borderRadius: Radii.xl, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  detailImage: { width: "100%", height: "100%" },
  detailFallback: { fontSize: 16, fontWeight: "800", color: colors.surface },
  detailCategory: { fontSize: 12, color: "#C7D2FE" },
  detailName: { fontSize: 16, fontWeight: "700", color: colors.surface },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.xl,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailStatsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  detailLabel: { fontSize: 11, color: "#C7D2FE" },
  detailPrice: { fontSize: 26, fontWeight: "800", color: colors.surface },
  detailSavingsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailSavings: { fontSize: 18, fontWeight: "700", color: "#6EE7B7" },
  relatedSection: { marginTop: 18, gap: 10 },
  relatedSectionTitle: { fontSize: 12, fontWeight: "700", color: "#E0E7FF", textTransform: "uppercase", letterSpacing: 0.5 },
  relatedLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  relatedLoadingText: { fontSize: 12, color: "#E0E7FF" },
  relatedScrollContent: { gap: 10, paddingRight: 4 },
  relatedProductCard: { width: 126, borderRadius: Radii.xl, backgroundColor: "rgba(255,255,255,0.12)", padding: 10, gap: 8 },
  relatedProductImageBox: { height: 72, borderRadius: Radii.lg, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  relatedProductImage: { width: "100%", height: "100%" },
  relatedProductFallback: { fontSize: 13, fontWeight: "800", color: colors.surface },
  relatedProductName: { fontSize: 12, fontWeight: "700", color: colors.surface, lineHeight: 16 },
  relatedEmptyText: { fontSize: 12, color: "#E0E7FF" },
  placeholderCard: { backgroundColor: colors.surface, borderRadius: Radii["3xl"], padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  placeholderTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  placeholderText: { marginTop: 4, fontSize: 12, color: colors.gray400 },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  storeCountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  storeCount: { fontSize: 14, fontWeight: "700", color: colors.gray700 },
  sortButtonsRow: { flexDirection: "row", gap: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.gray100, borderRadius: Radii.xl },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: colors.gray600 },
  mapBtnActive: { backgroundColor: colors.primary600 },
  mapBtnTextActive: { color: colors.surface },
  mapPlaceholder: { marginHorizontal: 20, marginBottom: 16, height: 160, borderRadius: Radii["2xl"], backgroundColor: colors.primary50, position: "relative", overflow: "hidden" },
  mapPin: { position: "absolute", paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  userPin: { position: "absolute", bottom: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  storesSection: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  storeCard: { backgroundColor: colors.surface, borderRadius: Radii["2xl"], padding: 16, borderWidth: 1, borderColor: colors.gray100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  storeCardBest: { borderColor: "#D4AF37", borderWidth: 2, shadowColor: "#D4AF37", shadowOpacity: 0.12 },
  storeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  storeLeftRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: Radii.lg, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  rankBadgeActive: { backgroundColor: colors.primary600 },
  rankText: { fontSize: 13, fontWeight: "700", color: colors.gray500 },
  rankTextActive: { color: colors.surface },
  storeName: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  storeAddress: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  storeDistance: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  storePrice: { fontSize: 20, fontWeight: "800", color: colors.gray900 },
  storeOriginalPrice: { fontSize: 11, color: colors.gray400, textDecorationLine: "line-through", marginTop: 2 },
  storeDiscount: { fontSize: 11, fontWeight: "700", color: colors.success500, marginTop: 1 },
  storeSaleDate: { fontSize: 11, color: colors.gray500, marginTop: 1 },
  });
}
