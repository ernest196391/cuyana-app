import type {
  CatalogCategory,
  CatalogListResult,
  CatalogProductResult,
  CatalogProvider,
  CommercialRate,
  CreateOrderInput,
  CreateOrderResult,
} from "./types";

/**
 * Adaptador server-to-server hacia el sistema canónico (Product Studio
 * One / NEXO). Mientras no existan credenciales reales, todas las
 * operaciones devuelven `not_configured`: nunca se inventan productos ni
 * pedidos en producción. Cuando el contrato exista, esta clase es el único
 * lugar que debe cambiar para consumirlo de verdad.
 */
export class NexoCatalogAdapter implements CatalogProvider {
  readonly sourceSystem = "nexo";

  private readonly baseUrl = process.env.NEXO_CATALOG_URL || "";
  private readonly apiKey = process.env.NEXO_CATALOG_API_KEY || "";

  get configured(): boolean {
    return Boolean(this.baseUrl && this.apiKey);
  }

  async listByCategory(_category: CatalogCategory): Promise<CatalogListResult> {
    if (!this.configured) {
      return {
        status: "not_configured",
        products: [],
        message: "El catálogo de Product Studio One / NEXO todavía no tiene credenciales configuradas.",
      };
    }
    // Contrato pendiente de confirmación con Product Studio One / NEXO.
    // Implementar aquí la llamada real (fetch a this.baseUrl con this.apiKey)
    // cuando exista el contrato server-to-server.
    return { status: "error", products: [], message: "Integración configurada pero sin implementar todavía." };
  }

  async getProduct(_slug: string): Promise<CatalogProductResult> {
    if (!this.configured) {
      return { status: "not_configured", product: null, message: "Catálogo no configurado." };
    }
    return { status: "error", product: null, message: "Integración configurada pero sin implementar todavía." };
  }

  async getCommercialRate(): Promise<CommercialRate | null> {
    if (!this.configured) return null;
    return null;
  }

  async createOrder(_input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!this.configured) {
      return {
        status: "not_configured",
        message: "No se pueden crear pedidos de tienda todavía: falta la integración con el sistema canónico.",
      };
    }
    return { status: "error", message: "Integración configurada pero sin implementar todavía." };
  }
}
