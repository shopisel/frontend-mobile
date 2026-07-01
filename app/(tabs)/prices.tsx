import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { PricesScreen } from "../../src/components/screens/PricesScreen";
import { useFavorites } from "../../src/favorites/FavoritesProvider";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { clearScannedProduct, readScannedProduct } from "../../src/utils/scannedProductStore";

export default function PricesTab() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { favoriteProductIds, toggleFavorite } = useFavorites();
  const [storedProduct, setStoredProduct] = useState<Awaited<ReturnType<typeof readScannedProduct>>>(null);
  const [isLoadingStoredProduct, setIsLoadingStoredProduct] = useState(true);
  const hasRouteProduct = typeof productId === "string" && productId.trim().length > 0;
  const log = (...args: unknown[]) => {
    if (__DEV__) {
      console.log("[PricesTab]", ...args);
    }
  };

  useFocusEffect(
    useCallback(() => {
      log("focus", { hasRouteProduct, productId });
      if (hasRouteProduct) {
        setStoredProduct(null);
        setIsLoadingStoredProduct(false);
        log("skip stored product because route product exists");
        return;
      }

      let cancelled = false;

      const loadStoredProduct = async () => {
        setIsLoadingStoredProduct(true);
        try {
          const product = await readScannedProduct();
          log("stored product read", product?.id ?? null);
          if (!cancelled) {
            setStoredProduct(product);
            if (product) {
              void clearScannedProduct().catch((error) => {
                console.error("[PricesTab] failed to clear scanned product", error);
              });
            }
          }
        } finally {
          if (!cancelled) {
            setIsLoadingStoredProduct(false);
          }
        }
      };

      void loadStoredProduct();

      return () => {
        cancelled = true;
      };
    }, [hasRouteProduct]),
  );

  if (!hasRouteProduct && isLoadingStoredProduct) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const screenKey =
    hasRouteProduct && typeof productId === "string" && productId.trim()
      ? `prices-${productId.trim()}`
      : storedProduct?.id
        ? `prices-${storedProduct.id}`
        : "prices";

  log("render", { screenKey, hasRouteProduct, routeProductId: productId ?? null, storedProductId: storedProduct?.id ?? null });

  return (
    <PricesScreen
      key={screenKey}
      favoriteProductIds={favoriteProductIds}
      onToggleFavorite={toggleFavorite}
      initialProductId={hasRouteProduct ? productId : undefined}
      initialProduct={hasRouteProduct ? undefined : storedProduct ?? undefined}
    />
  );
}
