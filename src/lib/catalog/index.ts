import type { CatalogCategory, CatalogListResult, CatalogProductResult, CatalogProvider } from "./types";
import { NexoCatalogAdapter } from "./nexoAdapter";
import { DEV_FIXTURES } from "./devFixtures";

const USE_DEV_FIXTURES = process.env.NODE_ENV !== "production" && process.env.CUYANA_CATALOG_FIXTURES !== "off";

/**
 * Envuelve el adaptador real y, solo fuera de producción, sustituye un
 * catálogo `not_configured` por fixtures de desarrollo para poder construir
 * la UI. En producción nunca se activa: si el adaptador no está
 * configurado, la tienda muestra el estado honesto "en preparación".
 */
class DevFallbackCatalogProvider implements CatalogProvider {
  constructor(private readonly real: CatalogProvider) {}

  get sourceSystem() {
    return this.real.sourceSystem;
  }
  get configured() {
    return this.real.configured;
  }

  async listByCategory(category: CatalogCategory): Promise<CatalogListResult> {
    const result = await this.real.listByCategory(category);
    if (result.status === "not_configured" && USE_DEV_FIXTURES) {
      const products = DEV_FIXTURES.filter((p) => p.category === category);
      return { status: "ok", products, message: "Fixtures de desarrollo (no producción)." };
    }
    return result;
  }

  async getProduct(slug: string): Promise<CatalogProductResult> {
    const result = await this.real.getProduct(slug);
    if (result.status === "not_configured" && USE_DEV_FIXTURES) {
      const product = DEV_FIXTURES.find((p) => p.slug === slug) ?? null;
      return product
        ? { status: "ok", product, message: "Fixture de desarrollo (no producción)." }
        : { status: "empty", product: null };
    }
    return result;
  }

  getCommercialRate() {
    return this.real.getCommercialRate();
  }
  createOrder(input: Parameters<CatalogProvider["createOrder"]>[0]) {
    return this.real.createOrder(input);
  }
}

let cached: CatalogProvider | null = null;

export function getCatalogProvider(): CatalogProvider {
  if (!cached) {
    cached = new DevFallbackCatalogProvider(new NexoCatalogAdapter());
  }
  return cached;
}

export type { CatalogCategory, CatalogListResult, CatalogProduct, CatalogProductResult, CatalogProvider } from "./types";
