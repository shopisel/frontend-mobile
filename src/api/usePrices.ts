import { useApi } from "./useApi";
import { useCallback } from "react";

export interface PriceResponse {
  id: string;
  productId: string;
  storeId: string;
  priceText: string;
  saleText?: string | null;
  quantityText?: string | null;
  unitPriceText?: string | null;
  price: number;
  sale?: number;
  saleDate?: string;
  updatedAt: string;
}

const toValidNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const parsePriceText = (value: unknown): number | undefined => {
  if (typeof value === "number") return toValidNumber(value);
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  return toValidNumber(match[0]);
};

const normalizePrice = (raw: any): PriceResponse => {
  const priceText = String(raw?.priceText ?? raw?.price_text ?? raw?.price ?? "");
  const saleTextRaw = raw?.saleText ?? raw?.sale_text ?? raw?.sale;
  const saleText = saleTextRaw === null || saleTextRaw === undefined ? null : String(saleTextRaw);
  const quantityTextRaw = raw?.quantityText ?? raw?.quantity_text;
  const unitPriceTextRaw = raw?.unitPriceText ?? raw?.unit_price_text;

  const price = parsePriceText(raw?.priceText ?? raw?.price_text) ?? toValidNumber(raw?.price) ?? 0;
  const sale = parsePriceText(raw?.saleText ?? raw?.sale_text) ?? toValidNumber(raw?.sale);

  return {
    id: String(raw?.id ?? ""),
    productId: String(raw?.productId ?? raw?.product_id ?? ""),
    storeId: String(raw?.storeId ?? raw?.store_id ?? ""),
    priceText,
    saleText,
    quantityText: quantityTextRaw === null || quantityTextRaw === undefined ? null : String(quantityTextRaw),
    unitPriceText: unitPriceTextRaw === null || unitPriceTextRaw === undefined ? null : String(unitPriceTextRaw),
    price,
    sale,
    saleDate: raw?.saleDate ?? raw?.sale_date,
    updatedAt: String(raw?.updatedAt ?? raw?.updated_at ?? ""),
  };
};

export function usePrices() {
  const { get } = useApi();

  const getPrices = useCallback(async (productId: string, storeId?: string): Promise<PriceResponse[]> => {
    let url = `/prices?productId=${encodeURIComponent(productId)}`;
    if (storeId) url += `&storeId=${encodeURIComponent(storeId)}`;
    const res = await get(url);
    if (Array.isArray(res)) return res.map(normalizePrice);
    if (res) return [normalizePrice(res)];
    return [];
  }, [get]);

  return { getPrices };
}

export const calculateDiscountPercentage = (original: number, discounted: number) => {
  if (original <= 0 || discounted >= original) return 0;
  return Math.round(((original - discounted) / original) * 100);
};
