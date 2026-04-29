import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { usePrices } from "./usePrices";
import { useStores } from "./useStores";

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export type StoreRow = {
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

const getFallbackStoreName = (storeId: string, unknownStoreLabel: string) => {
  switch (storeId) {
    case "store-1":
      return "Continente";
    case "store-2":
      return "Pingo Doce";
    default:
      return unknownStoreLabel;
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

export function useNearbyStorePrices(productId?: string) {
  const { t } = useTranslation();
  const { getPrices } = usePrices();
  const { getStores } = useStores();
  const [storeRows, setStoreRows] = useState<StoreRow[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUserLocation = async () => {
      setIsLoadingLocation(true);
      setLocationError(null);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (permission.status !== "granted") {
          setLocationError(t("prices.locationDenied"));
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
          setLocationError(err instanceof Error ? err.message : t("errors.requestFailed"));
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
    if (!productId) {
      setStoreRows([]);
      setStoresError(null);
      return;
    }

    let cancelled = false;

    const loadStores = async () => {
      setIsLoadingStores(true);
      setStoresError(null);

      try {
        const prices = await getPrices(productId);
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
            name: displayStore?.name ?? store?.name ?? getFallbackStoreName(price.storeId, t("common.unknownStore")),
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
          setStoresError(err instanceof Error ? err.message : t("errors.requestFailed"));
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
  }, [getPrices, getStores, productId, t, userLocation]);

  return {
    storeRows,
    userLocation,
    isLoadingStores,
    isLoadingLocation,
    storesError,
    locationError,
  };
}
