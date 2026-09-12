import type {
  CatalogCategory,
  CatalogListResult,
  CatalogProductResult,
  CatalogProvider,
  CommercialRate,
  CreateOrderInput,
  CreateOrderResult,
} from "./types";
import { fetchNexoEnergiaProducts, mapWooProductToCatalogProduct } from "./nexoProducts";
import { getStoreCommercialRate } from "./commercialRate";
import { createStoreOrder } from "@/lib/store/orders";

/**
 * Adaptador server-to-server hacia el sistema canónico (Product Studio One /
 * NEXO). Solo lee catálogo (WooCommerce, vía la API pública de NEXO) — nunca
 * usa el checkout ni el sistema de gestoras de NEXO. El pedido "oficial" para
 * Cuyana es el que ella misma persiste en su propio Supabase antes de abrir
 * WhatsApp (ver src/lib/store/orders.ts); no se escribe nada en WooCommerce.
 *
 * Solo la categoría "energia" tiene mapeo de categoría NEXO confirmado hoy
 * (ver nexoCategories.ts). "alimentos" queda `not_configured` hasta que se
 * confirme un mapeo real: no se inventa una categoría equivalente.
 */
export class NexoCatalogAdapter implements CatalogProvider {
  readonly sourceSystem = "nexo";

  private readonly baseUrl = process.env.NEXO_CATALOG_URL || "";
  private readonly apiKey = process.env.NEXO_CATALOG_API_KEY || "";

  get configured(): boolean {
    // El endpoint público de NEXO no exige clave hoy; si en el futuro la
    // exige, esta clase es el único lugar que debe cambiar.
    return Boolean(this.baseUrl);
  }

  async listByCategory(category: CatalogCategory): Promise<CatalogListResult> {
    if (!this.configured) {
      return {
        status: "not_configured",
        products: [],
        message: "El catálogo de Product Studio One / NEXO todavía no tiene credenciales configuradas.",
      };
    }
    if (category !== "energia") {
      return {
        status: "not_configured",
        products: [],
        message: "Esta categoría todavía no tiene un mapeo confirmado con el catálogo de NEXO.",
      };
    }

    const result = await fetchNexoEnergiaProducts(this.baseUrl, this.apiKey);
    if (!result.ok) {
      return { status: "error", products: [], message: result.message };
    }
    const products = result.products.map((product) => mapWooProductToCatalogProduct(product, this.baseUrl));
    return { status: "ok", products };
  }

  async getProduct(slug: string): Promise<CatalogProductResult> {
    if (!this.configured) {
      return { status: "not_configured", product: null, message: "Catálogo no configurado." };
    }
    const result = await fetchNexoEnergiaProducts(this.baseUrl, this.apiKey);
    if (!result.ok) {
      return { status: "error", product: null, message: result.message };
    }
    const match = result.products.find((product) => product.slug === slug);
    if (!match) return { status: "empty", product: null };
    return { status: "ok", product: mapWooProductToCatalogProduct(match, this.baseUrl) };
  }

  async getCommercialRate(): Promise<CommercialRate | null> {
    return getStoreCommercialRate();
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!this.configured) {
      return {
        status: "not_configured",
        message: "No se pueden crear pedidos de tienda todavía: falta la integración con el sistema canónico.",
      };
    }
    return createStoreOrder(this, input);
  }
}
