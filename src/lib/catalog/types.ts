// Contrato del adaptador de catálogo Cuyana ↔ Product Studio One / NEXO.
// Cuyana controla marca, navegación, copy, moneda y presentación. El
// sistema canónico (Product Studio One / NEXO) controla producto,
// disponibilidad y pedido oficial. Ver docs/DECISIONS.md.

export type CatalogCategory = "alimentos" | "energia";

export interface CatalogProduct {
  /** Slug estable usado en la URL pública /producto/[slug]. */
  slug: string;
  /** Sistema canónico de origen (ej. "product-studio-one", "nexo"). */
  sourceSystem: string;
  /** Identificador del producto en el sistema canónico. */
  sourceProductId: string;
  /** Cuándo se sincronizó este registro por última vez. */
  syncedAt: string;
  category: CatalogCategory;
  name: string;
  description: string;
  imageUrl: string | null;
  /** Precio canónico en USD, tal como lo entrega el sistema canónico. */
  priceUsd: number;
  available: boolean;
}

/**
 * Tasa comercial para mostrar el precio en GYD. Nunca se reutiliza la tasa
 * de remesas: esta tiene su propia fuente, fecha y vigencia.
 */
export interface CommercialRate {
  gydPerUsd: number;
  source: string;
  asOf: string;
  expiresAt: string | null;
}

export type CatalogStatus = "not_configured" | "ok" | "error" | "empty";

export interface CatalogListResult {
  status: CatalogStatus;
  products: CatalogProduct[];
  message?: string;
}

export interface CatalogProductResult {
  status: CatalogStatus;
  product: CatalogProduct | null;
  message?: string;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  items: Array<{ slug: string; sourceSystem: string; sourceProductId: string; quantity: number }>;
  /** Quien paga, desde Guyana. */
  customerName: string;
  customerWhatsapp: string;
  /** Quien lo recibe, en Cuba. Opcional mientras convivan carritos viejos. */
  destino?: import("../store/orderMessage").DestinoEnCuba;
  /**
   * De quién es el pedido, si lo hizo con su cuenta. Lo pone el servidor
   * después de comprobar el token — NUNCA se lee del cuerpo de la petición,
   * que es texto que manda el navegador y cualquiera puede cambiar.
   */
  customerId?: string | null;
}

export type CreateOrderResult =
  | { status: "not_configured"; message: string }
  | { status: "error"; message: string }
  | { status: "ok"; orderCode: string; canonicalOrderId: string };

export interface CatalogProvider {
  readonly sourceSystem: string;
  readonly configured: boolean;
  listByCategory(category: CatalogCategory): Promise<CatalogListResult>;
  getProduct(slug: string): Promise<CatalogProductResult>;
  getCommercialRate(): Promise<CommercialRate | null>;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
}
