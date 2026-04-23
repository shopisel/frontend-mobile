import { PricesScreen } from "../../src/components/screens/PricesScreen";
import { useFavorites } from "../../src/favorites/FavoritesProvider";

export default function PricesTab() {
  const { favoriteProductIds, toggleFavorite } = useFavorites();

  return <PricesScreen favoriteProductIds={favoriteProductIds} onToggleFavorite={toggleFavorite} />;
}
