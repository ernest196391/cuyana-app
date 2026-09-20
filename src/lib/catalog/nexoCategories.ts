// Mapa de categoría "energía" hacia los nombres reales de categoría de
// WooCommerce que usa Product Studio One / NEXO. Replicado a propósito de
// `lib/commerce/storefront-categories.ts` en el repo NEXO (no se puede
// importar entre repos): ahí la propia tienda NEXO filtra así, no por el
// parámetro `category` de su API pública (que espera un ID numérico de
// WooCommerce, no un slug, y por eso no sirve para filtrar desde afuera).
const ENERGIA_SOURCE_SLUGS = ["energia solar", "paneles solares", "energia"];
const ELECTRODOMESTICOS_SOURCE_SLUGS = [
  "electrodomesticos",
  "aires acondicionados",
  "cocinas y hornos",
  "licuadoras",
  "refrigeradores",
  "television digital",
  "televisores",
];

// Estos artículos están relacionados directamente con energía, pero NEXO los
// clasifica en categorías demasiado generales. Se incluyen de forma explícita
// para no convertir toda «Accesorios», «Servicios» o «Sin categorizar» en
// productos energéticos.
const ENERGIA_ADDITIONAL_SLUGS = new Set([
  "nexo-ecoflow-cable-10m",
  "nexo-solar-install-supports",
  "ventilador-solar-recargable-royal-ra123sl-de-12-pulgadas-con-bombillos-led",
  "bateria-portatil-puregear-magnetica-10000mah-20w",
]);
// Rango Unicode de marcas diacríticas combinantes (U+0300–U+036F), construido
// por código de punto para no dejar caracteres combinantes literales en el
// código fuente.
const COMBINING_DIACRITICS = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  "g",
);

/** Igual normalización que el lado NEXO: sin acentos, minúsculas, recortado. */
export function normalizedCategoryName(value: string) {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .trim()
    .toLocaleLowerCase("es");
}

export function isEnergiaCategory(categories: Array<{ name?: string }>): boolean {
  return categories.some((category) => {
    const normalized = normalizedCategoryName(category.name || "");
    return ENERGIA_SOURCE_SLUGS.some((slug) => normalized.includes(slug));
  });
}

export function isEnergiaProduct(product: { slug: string; categories?: Array<{ name?: string }> }): boolean {
  return ENERGIA_ADDITIONAL_SLUGS.has(product.slug) || isEnergiaCategory(product.categories ?? []);
}

export function isElectrodomesticosCategory(categories: Array<{ name?: string }>): boolean {
  return categories.some((category) => {
    const normalized = normalizedCategoryName(category.name || "");
    return ELECTRODOMESTICOS_SOURCE_SLUGS.some((slug) => normalized === slug);
  });
}
