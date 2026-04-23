import { useRouter } from "expo-router";
import { HomeScreen } from "../../src/components/screens/HomeScreen";
import { useFavorites } from "../../src/favorites/FavoritesProvider";

export default function HomeTab() {
  const router = useRouter();
  const { favoriteProducts, favoritesLoading, favoritesError } = useFavorites();

  return (
    <HomeScreen
      favoriteProducts={favoriteProducts}
      favoritesLoading={favoritesLoading}
      favoritesError={favoritesError}
      onOpenList={(listId) => {
        router.push(`/lists/${listId}` as never);
      }}
      onNavigate={(tab) => {
        if (tab === "alerts") {
          router.push("/alerts");
          return;
        }

        router.push(`/(tabs)/${tab}` as never);
      }}
    />
  );
}
