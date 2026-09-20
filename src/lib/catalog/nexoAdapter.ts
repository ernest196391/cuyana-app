import type {
  CatalogCategory,
  CatalogListResult,
  CatalogProductResult,
  CatalogProvider,
  CommercialRate,
  CreateOrderInput,
  CreateOrderResult,
} from "./types";
import {
  fetchAllNexoProducts,
  fetchNexoElectrodomesticosProducts,
  fetchNexoEnergiaProducts,
  mapWooProductToCatalogProduct,
} from "./nexoProducts";
import { isElectrodomesticosCategory, isEnergiaProduct } from "./nexoCategories";
import { getStoreCommercialRate } from "./commercialRate";
import { createStoreOrder } from "@/lib/store/orders";
import { getCuyanaMarketProduct, listCuyanaMarketProducts } from "./cuyanaMarketAdapter";

/**
 * Adaptador server-to-server hacia el sistema canónico (Product Studio One /
 * NEXO) para Energía, y hacia el marketplace propio de CUYANA para Alimentos
 * y Electrodomésticos. Nunca usa el checkout ni el sistema de gestoras de NEXO.
 * El pedido oficial lo persiste CUYANA en su propio Supabase antes de abrir
 * WhatsApp (ver src/lib/store/orders.ts).
 */
export class NexoCatalogAdapter implements CatalogProvider {
  readonly sourceSystem = "nexo";

  private readonly baseUrl = process.env.NEXO_CATALOG_URL || "";
  private readonly apiKey = process.env.NEXO_CATALOG_API_KEY || "";

  get configured(): boolean {
    // Alimentos y electrodomésticos pueden funcionar con Cuyana Market aunque
    // NEXO no esté configurado. Este indicador conserva el sentido histórico
    // para la rama de Energía.
    return Boolean(this.baseUrl);
  }

  async listByCategory(category: CatalogCategory): Promise<CatalogListResult> {
    if (category === "alimentos") {
      return listCuyanaMarketProducts(category);
    }
    if (category === "electrodomesticos") {
      if (!this.configured) return listCuyanaMarketProducts(category);
      const [market, nexo] = await Promise.all([
        listCuyanaMarketProducts(category),
        fetchNexoElectrodomesticosProducts(this.baseUrl, this.apiKey),
      ]);
      if (!nexo.ok && market.status !== "ok") {
        return { status: "error", products: [], message: nexo.message };
      }
      const external = nexo.ok
        ? nexo.products.map((product) => mapWooProductToCatalogProduct(product, this.baseUrl, "electrodomesticos"))
        : [];
      const products = [...market.products, ...external];
      return { status: products.length ? "ok" : "empty", products };
    }

    if (!this.configured) {
      return {
        status: "not_configured",
        products: [],
        message: "El catálogo de Product Studio One / NEXO todavía no tiene credenciales configuradas.",
      };
    }

    const result = await fetchNexoEnergiaProducts(this.baseUrl, this.apiKey);
    if (!result.ok) {
      return { status: "error", products: [], message: result.message };
    }
    const products = result.products.map((product) => mapWooProductToCatalogProduct(product, this.baseUrl, "energia"));
    return { status: "ok", products };
  }

  async getProduct(slug: string): Promise<CatalogProductResult> {
    const market = await getCuyanaMarketProduct(slug);
    if (market.status === "ok") return market;
    if (!this.configured) {
      return { status: "not_configured", product: null, message: "Catálogo no configurado." };
    }
    const result = await fetchAllNexoProducts(this.baseUrl, this.apiKey);
    if (!result.ok) {
      return { status: "error", product: null, message: result.message };
    }
    const match = result.products.find((product) => product.slug === slug);
    if (!match) return { status: "empty", product: null };
    if (isEnergiaProduct(match)) {
      return { status: "ok", product: mapWooProductToCatalogProduct(match, this.baseUrl, "energia") };
    }
    if (isElectrodomesticosCategory(match.categories || [])) {
      return { status: "ok", product: mapWooProductToCatalogProduct(match, this.baseUrl, "electrodomesticos") };
    }
    return { status: "empty", product: null };
  }

  async getCommercialRate(): Promise<CommercialRate | null> {
    return getStoreCommercialRate();
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    return createStoreOrder(this, input);
  }
}
