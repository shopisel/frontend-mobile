/**
 * Static map of category image filenames → require() calls.
 * React Native requires static require() at build time — no dynamic imports.
 *
 * The key is the normalized filename (without extension, lowercase, no accents).
 */

type ImageSource = ReturnType<typeof require>;

// Normalize a string the same way the web does:
// lowercase, remove accents, replace & → e, collapse non-alnum to -
export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_IMAGES: Record<string, ImageSource> = {
  "agua":                      require("../../assets/images/agua.png"),
  "bebidas-vegetais":          require("../../assets/images/bebidas-vegetais.png"),
  "bebidas":                   require("../../assets/images/bebidas.png"),
  "cervejas-e-sidras":         require("../../assets/images/cervejas-e-sidras.png"),
  "charcutaria":               require("../../assets/images/charcutaria.png"),
  "frescos":                   require("../../assets/images/frescos.png"),
  "frutas":                    require("../../assets/images/frutas.png"),
  "iogurtes":                  require("../../assets/images/iogurtes.png"),
  "laticinios-e-ovos":         require("../../assets/images/laticinios-e-ovos.png"),
  "legumes":                   require("../../assets/images/legumes.png"),
  "leite":                     require("../../assets/images/leite.png"),
  "manteigas-cremes-e-natas":  require("../../assets/images/manteigas-cremes-e-natas.png"),
  "ovos":                      require("../../assets/images/ovos.png"),
  "padaria-pastelaria":        require("../../assets/images/padaria-pastelaria.png"),
  "peixaria":                  require("../../assets/images/peixaria.png"),
  "queijos":                   require("../../assets/images/queijos.png"),
  "sobremesas":                require("../../assets/images/sobremesas.png"),
  "sumos-e-refrigerantes":     require("../../assets/images/sumos-e-refrigerantes.png"),
  "talho":                     require("../../assets/images/talho.png"),
  "vinhos":                    require("../../assets/images/vinhos.png"),
};

/**
 * Resolve an image source for a category.
 * Accepts:
 *  - A full URL (https://...) → returned as { uri }
 *  - A filename like "laticinios-e-ovos.png" → resolved from local assets
 *  - A category name like "Laticínios e Ovos" → normalized and resolved
 * Returns null if nothing matches.
 */
export function getCategoryImage(imageField?: string, fallbackName?: string): ImageSource | { uri: string } | null {
  const raw = imageField?.trim();

  // 1. Remote URL
  if (raw && /^https?:\/\//i.test(raw)) {
    return { uri: raw };
  }

  // 2. Local file — try the image field (strip extension) then fallback to name
  const candidates = [
    raw ? normalizeName(raw.replace(/\.[^/.]+$/, "")) : null,
    fallbackName ? normalizeName(fallbackName) : null,
  ].filter(Boolean) as string[];

  for (const key of candidates) {
    if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  }

  return null;
}
