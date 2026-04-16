/**
 * Static map of category image filenames to require() calls.
 * React Native requires static require() at build time.
 */

type ImageSource = ReturnType<typeof require>;

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
  "agua": require("../../assets/images/agua.png"),
  "bebidas-vegetais": require("../../assets/images/bebidas-vegetais.png"),
  "bebidas": require("../../assets/images/bebidas.png"),
  "cervejas-e-sidras": require("../../assets/images/cervejas-e-sidras.png"),
  "charcutaria": require("../../assets/images/charcutaria.png"),
  "frescos": require("../../assets/images/frescos.png"),
  "frutas": require("../../assets/images/frutas.png"),
  "iogurtes": require("../../assets/images/iogurtes.png"),
  "laticinios-e-ovos": require("../../assets/images/laticinios-e-ovos.png"),
  "legumes": require("../../assets/images/legumes.png"),
  "leite": require("../../assets/images/leite.png"),
  "manteigas-cremes-e-natas": require("../../assets/images/manteigas-cremes-e-natas.png"),
  "ovos": require("../../assets/images/ovos.png"),
  "padaria-pastelaria": require("../../assets/images/padaria-pastelaria.png"),
  "peixaria": require("../../assets/images/peixaria.png"),
  "queijos": require("../../assets/images/queijos.png"),
  "sobremesas": require("../../assets/images/sobremesas.png"),
  "sumos-e-refrigerantes": require("../../assets/images/sumos-e-refrigerantes.png"),
  "talho": require("../../assets/images/talho.png"),
  "vinhos": require("../../assets/images/vinhos.png"),
};

export function getCategoryImage(imageField?: string, fallbackName?: string): ImageSource | { uri: string } | null {
  const raw = imageField?.trim();

  if (raw && /^https?:\/\//i.test(raw)) {
    return { uri: raw };
  }

  const candidates = [
    raw ? normalizeName(raw.replace(/\.[^/.]+$/, "")) : null,
    fallbackName ? normalizeName(fallbackName) : null,
  ].filter(Boolean) as string[];

  for (const key of candidates) {
    if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];

    const strippedCategoryPrefix = key.replace(/^cat-/, "");
    if (CATEGORY_IMAGES[strippedCategoryPrefix]) return CATEGORY_IMAGES[strippedCategoryPrefix];
  }

  return null;
}
