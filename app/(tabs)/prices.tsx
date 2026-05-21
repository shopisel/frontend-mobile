import { PricesScreen } from "../../src/components/screens/PricesScreen";
import { useFavorites } from "../../src/favorites/FavoritesProvider";
import { useLocalSearchParams } from "expo-router";

export default function PricesTab() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { favoriteProductIds, toggleFavorite } = useFavorites();

  return (
    <PricesScreen
      favoriteProductIds={favoriteProductIds}
      onToggleFavorite={toggleFavorite}
      initialProductId={typeof productId === "string" ? productId : undefined}
    />
  );
}
