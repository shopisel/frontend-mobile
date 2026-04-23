import { useRouter } from "expo-router";
import { ProfileScreen } from "../../src/components/screens/ProfileScreen";
import { useAuth } from "../../src/auth/AuthProvider";
import { useFavorites } from "../../src/favorites/FavoritesProvider";

export default function ProfileTab() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { favoriteProducts, favoritesLoading, favoritesError, reloadFavorites } = useFavorites();

  return (
    <ProfileScreen
      user={user}
      favoriteProducts={favoriteProducts}
      favoritesLoading={favoritesLoading}
      favoritesError={favoritesError}
      onReloadFavorites={reloadFavorites}
      onLogout={() => {
        void logout().finally(() => router.replace("/auth"));
      }}
    />
  );
}
