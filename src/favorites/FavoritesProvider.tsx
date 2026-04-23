import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { useAccounts } from "../api/useAccounts";
import { useProducts, type Product } from "../api/useProducts";

type FavoritesContextValue = {
  favoriteProductIds: string[];
  favoriteProducts: Product[];
  favoritesLoading: boolean;
  favoritesError: string | null;
  reloadFavorites: () => Promise<void>;
  toggleFavorite: (product: Product) => Promise<void>;
  isFavorite: (productId: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { initialized, isAuthenticated } = useAuth();
  const { syncMyAccount, getMyFavoriteProductIds, addFavoriteProduct, removeFavoriteProduct } = useAccounts();
  const { getProductsByIds } = useProducts();

  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) return;

    setFavoritesLoading(true);
    setFavoritesError(null);

    try {
      const ids = await getMyFavoriteProductIds();
      setFavoriteProductIds(ids);

      if (!ids.length) {
        setFavoriteProducts([]);
        return;
      }

      const products = await getProductsByIds(ids);
      const productById = new Map(products.map((product) => [product.id, product] as const));
      const orderedProducts = ids
        .map((id) => productById.get(id))
        .filter((product): product is Product => Boolean(product));

      setFavoriteProducts(orderedProducts);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Falha ao carregar favoritos.");
    } finally {
      setFavoritesLoading(false);
    }
  }, [getMyFavoriteProductIds, getProductsByIds, isAuthenticated]);

  useEffect(() => {
    if (!initialized || !isAuthenticated) {
      setFavoriteProductIds([]);
      setFavoriteProducts([]);
      setFavoritesError(null);
      setFavoritesLoading(false);
      return;
    }

    let cancelled = false;

    const initializeFavorites = async () => {
      try {
        await syncMyAccount();
      } catch {
        // Continue even if the sync fails once.
      }

      if (cancelled) return;
      await loadFavorites();
    };

    void initializeFavorites();

    return () => {
      cancelled = true;
    };
  }, [initialized, isAuthenticated, loadFavorites, syncMyAccount]);

  const toggleFavorite = useCallback(async (product: Product) => {
    const alreadyFavorite = favoriteProductIds.includes(product.id);
    const previousIds = favoriteProductIds;
    const previousProducts = favoriteProducts;

    setFavoritesError(null);

    if (alreadyFavorite) {
      setFavoriteProductIds((prev) => prev.filter((id) => id !== product.id));
      setFavoriteProducts((prev) => prev.filter((item) => item.id !== product.id));
    } else {
      setFavoriteProductIds((prev) => [...prev, product.id]);
      setFavoriteProducts((prev) => (prev.some((item) => item.id === product.id) ? prev : [product, ...prev]));
    }

    try {
      if (alreadyFavorite) {
        await removeFavoriteProduct(product.id);
      } else {
        await addFavoriteProduct(product.id);
      }
    } catch (error) {
      setFavoriteProductIds(previousIds);
      setFavoriteProducts(previousProducts);
      setFavoritesError(error instanceof Error ? error.message : "Falha ao atualizar favoritos.");
      throw error;
    }
  }, [addFavoriteProduct, favoriteProductIds, favoriteProducts, removeFavoriteProduct]);

  const value = useMemo<FavoritesContextValue>(() => ({
    favoriteProductIds,
    favoriteProducts,
    favoritesLoading,
    favoritesError,
    reloadFavorites: loadFavorites,
    toggleFavorite,
    isFavorite: (productId: string) => favoriteProductIds.includes(productId),
  }), [favoriteProductIds, favoriteProducts, favoritesLoading, favoritesError, loadFavorites, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within FavoritesProvider");
  return context;
}
