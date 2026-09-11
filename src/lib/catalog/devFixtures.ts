import type { CatalogProduct } from "./types";

/**
 * Fixtures SOLO para desarrollo local (nunca en producción): permiten
 * construir y probar la UI de la tienda antes de tener credenciales reales.
 * Marcadas explícitamente con sourceSystem "dev-fixture" para que nunca se
 * confundan con datos del sistema canónico.
 */
export const DEV_FIXTURES: CatalogProduct[] = [
  {
    slug: "combo-alimentos-basico",
    sourceSystem: "dev-fixture",
    sourceProductId: "fixture-alimentos-1",
    syncedAt: "2026-09-01T00:00:00Z",
    category: "alimentos",
    name: "Combo de alimentos básico (fixture)",
    description: "Producto de prueba solo visible en desarrollo local.",
    imageUrl: null,
    priceUsd: 45,
    available: true,
  },
  {
    slug: "panel-solar-portatil",
    sourceSystem: "dev-fixture",
    sourceProductId: "fixture-energia-1",
    syncedAt: "2026-09-01T00:00:00Z",
    category: "energia",
    name: "Panel solar portátil (fixture)",
    description: "Producto de prueba solo visible en desarrollo local.",
    imageUrl: null,
    priceUsd: 120,
    available: true,
  },
];
