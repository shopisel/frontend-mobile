import { useApi } from "./useApi";
import { useCallback } from "react";

export interface Category {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  image?: string;
  emoji?: string;
}

export function useProducts() {
  const { get } = useApi();

  const searchProducts       = useCallback(async (query: string): Promise<Product[]>              => get(`/products?name=${encodeURIComponent(query)}`),             [get]);
  const getMainCategories    = useCallback(async (): Promise<Category[]>                          => get("/categories/main"),                                         [get]);
  const getSubCategories     = useCallback(async (categoryId: string): Promise<Category[]>        => get(`/categories/${categoryId}/subcategories`),                  [get]);
  const getProductsByCategory= useCallback(async (categoryId: string): Promise<Product[]>         => get(`/products?categoryId=${encodeURIComponent(categoryId)}`),   [get]);
  const getProductsByIds     = useCallback(async (ids: string[]): Promise<Product[]>              => ids.length ? get(`/products?ids=${encodeURIComponent(ids.join(","))}`) : [], [get]);

  return { searchProducts, getMainCategories, getSubCategories, getProductsByCategory, getProductsByIds };
}
