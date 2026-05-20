export interface OpenFoodFactsResponse {
  status?: number;
  code?: string;
  product?: {
    product_name?: string;
    product_name_pt?: string;
    brands?: string;
    _keywords?: string[];
    keywords?: string[] | string;
    categories_tags?: string[];
    labels_tags?: string[];
    ingredients_tags?: string[];
  };
}

export const fetchOpenFoodFactsProduct = async (ean: string, timeoutMs = 8000): Promise<OpenFoodFactsResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(ean)}.json`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OpenFoodFacts HTTP ${res.status}`);
    return (await res.json()) as OpenFoodFactsResponse;
  } finally {
    clearTimeout(timeout);
  }
};

const splitTags = (value: string): string[] =>
  value
    .split(/[,\n;]/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const cleanTag = (raw: string): string => raw.replace(/^[a-z]{2}:/i, "").trim();

export const extractKeywordsFromOff = (off: OpenFoodFactsResponse): string[] => {
  const product = off.product ?? {};
  const collected: string[] = [];

  const maybeAddMany = (values: unknown) => {
    if (!values) return;
    if (Array.isArray(values)) {
      collected.push(...values.map((v) => String(v)));
      return;
    }
    if (typeof values === "string") {
      collected.push(...splitTags(values));
    }
  };

  maybeAddMany(product._keywords);
  maybeAddMany(product.keywords);
  maybeAddMany(product.categories_tags);
  maybeAddMany(product.labels_tags);
  maybeAddMany(product.ingredients_tags);

  // Keep as a last-resort fallback: a few tokens from name/brands.
  if (!collected.length) {
    if (product.product_name_pt) collected.push(...splitTags(product.product_name_pt));
    if (product.product_name) collected.push(...splitTags(product.product_name));
    if (product.brands) collected.push(...splitTags(product.brands));
  }

  const normalized = collected
    .map((v) => cleanTag(String(v).toLowerCase()))
    .map((v) => v.replace(/[_-]+/g, " ").trim())
    .filter(Boolean);

  return Array.from(new Set(normalized)).slice(0, 40);
};

