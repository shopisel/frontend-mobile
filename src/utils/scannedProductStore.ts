import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Product } from "../api/useProducts";

const SCANNED_PRODUCT_KEY = "shopisel_lastScannedProduct";
let inMemoryScannedProduct: Product | null = null;

export const saveScannedProduct = async (product: Product) => {
  inMemoryScannedProduct = product;
  const serialized = JSON.stringify(product);

  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(SCANNED_PRODUCT_KEY, serialized);
    return;
  }

  await SecureStore.setItemAsync(SCANNED_PRODUCT_KEY, serialized);
};

export const readScannedProduct = async (): Promise<Product | null> => {
  if (inMemoryScannedProduct) {
    return inMemoryScannedProduct;
  }

  const raw =
    Platform.OS === "web"
      ? globalThis.localStorage?.getItem(SCANNED_PRODUCT_KEY) ?? null
      : await SecureStore.getItemAsync(SCANNED_PRODUCT_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Product;
    if (!parsed?.id || !parsed?.name || !parsed?.barcode || !parsed?.categoryId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearScannedProduct = async () => {
  inMemoryScannedProduct = null;

  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(SCANNED_PRODUCT_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SCANNED_PRODUCT_KEY);
};
