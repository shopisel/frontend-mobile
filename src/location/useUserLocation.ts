import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

export type UserLocation = {
  latitude: number;
  longitude: number;
};

const toUserLocation = (position: Location.LocationObject): UserLocation => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
});

export function useUserLocation() {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const startForegroundTracking = async () => {
      setIsLoadingLocation(true);
      setLocationError(null);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (permission.status !== "granted") {
          setLocationError(t("prices.locationDenied"));
          return;
        }

        const options: Location.LocationOptions = {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 10000,
        };

        const currentPosition = await Location.getCurrentPositionAsync(options);
        if (cancelled) return;

        setUserLocation(toUserLocation(currentPosition));
        setIsLoadingLocation(false);

        const foregroundSubscription = await Location.watchPositionAsync(options, (position) => {
          if (!cancelled) setUserLocation(toUserLocation(position));
        });

        if (cancelled) {
          foregroundSubscription.remove();
          return;
        }

        subscription = foregroundSubscription;
      } catch (err) {
        if (!cancelled) {
          setLocationError(err instanceof Error ? err.message : t("errors.requestFailed"));
        }
      } finally {
        if (!cancelled) setIsLoadingLocation(false);
      }
    };

    void startForegroundTracking();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [t]);

  return {
    userLocation,
    isLoadingLocation,
    locationError,
  };
}
