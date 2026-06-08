import { PricesScreen } from "../../src/components/screens/PricesScreen";
import { useFavorites } from "../../src/favorites/FavoritesProvider";
import { useGlobalSearchParams } from "expo-router";

export default function PricesTab() {
  const { productId } = useGlobalSearchParams<{ productId?: string }>();
  const { favoriteProductIds, toggleFavorite } = useFavorites();
  const screenKey = typeof productId === "string" && productId.trim() ? `prices-${productId.trim()}` : "prices";

  return (
    <PricesScreen
      key={screenKey}
      favoriteProductIds={favoriteProductIds}
      onToggleFavorite={toggleFavorite}
      initialProductId={typeof productId === "string" ? productId : undefined}
    />
  );
}
