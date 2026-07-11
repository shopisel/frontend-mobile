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

const STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "uns",
  "umas",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "com",
  "sem",
  "ao",
  "aos",
  "and",
  "of",
  "the",
  "to",
  "for",
  "from",
  "in",
  "on",
  "with",
]);

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

const splitWords = (value: string): string[] =>
  value
    .replace(/^[a-z]{2}:/i, "")
    .replace(/[_-]+/g, " ")
    .split(/[\s/().,;:+{}\[\]]+/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const normalizeToken = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[a-z]{2}:/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

const isUsefulToken = (token: string): boolean =>
  Boolean(token) &&
  token.length >= 2 &&
  !STOPWORDS.has(token) &&
  !/^e\d+[a-z]?$/i.test(token) &&
  !/^\d+$/.test(token);

export const extractKeywordsFromOff = (off: OpenFoodFactsResponse): string[] => {
  const product = off.product ?? {};
  const collected: string[] = [];

  const maybeAddMany = (values: unknown, splitIntoWords = false) => {
    if (!values) return;
    if (Array.isArray(values)) {
      for (const value of values) {
        const text = String(value);
        collected.push(...(splitIntoWords ? splitWords(text) : splitTags(text)));
      }
      return;
    }
    if (typeof values === "string") {
      collected.push(...(splitIntoWords ? splitWords(values) : splitTags(values)));
    }
  };

  // Put the strongest signals first so the backend sees them early.
  maybeAddMany(product.product_name_pt, true);
  maybeAddMany(product.product_name, true);
  maybeAddMany(product.brands, true);

  // Secondary signals from Open Food Facts metadata.
  maybeAddMany(product._keywords);
  maybeAddMany(product.keywords);
  maybeAddMany(product.categories_tags, true);
  maybeAddMany(product.labels_tags, true);
  maybeAddMany(product.ingredients_tags, true);

  const normalized = collected
    .flatMap((value) => splitWords(value))
    .map(normalizeToken)
    .filter(isUsefulToken);

  return Array.from(new Set(normalized)).slice(0, 30);
};
