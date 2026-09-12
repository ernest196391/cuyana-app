import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";
import type { CatalogProduct, CatalogProvider, CreateOrderInput, CreateOrderResult } from "@/lib/catalog/types";

/**
 * Persiste el pedido de tienda en el Supabase de Cuyana ANTES de que exista
 * cualquier mensaje de WhatsApp: `canonicalOrderId` es la fila real en
 * `store_orders`, no un pedido de WooCommerce (esta tienda nunca escribe en
 * NEXO). El precio de cada línea se vuelve a resolver contra el catálogo en
 * vivo — nunca se confía en el precio que mande el cliente — para que el
 * total guardado sea el real al momento del pedido.
 */
export async function createStoreOrder(
  provider: CatalogProvider,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (!supabase) {
    return { status: "error", message: "No se pudo conectar con la base de datos de Cuyana." };
  }
  if (input.items.length === 0) {
    return { status: "error", message: "El carrito está vacío." };
  }

  const resolved: Array<{ product: CatalogProduct; quantity: number }> = [];
  for (const item of input.items) {
    const result = await provider.getProduct(item.slug);
    if (result.status !== "ok" || !result.product) {
      return { status: "error", message: `"${item.slug}" ya no está disponible en el catálogo. Quítalo del carrito e intenta de nuevo.` };
    }
    if (!result.product.available) {
      return { status: "error", message: `"${result.product.name}" ya no está disponible. Quítalo del carrito e intenta de nuevo.` };
    }
    resolved.push({ product: result.product, quantity: item.quantity });
  }

  const category = resolved[0].product.category;
  const totalUsd = resolved.reduce((sum, line) => sum + line.product.priceUsd * line.quantity, 0);
  const rate = await provider.getCommercialRate();
  const gydPerUsd = rate?.gydPerUsd ?? null;
  const totalGyd = gydPerUsd ? Math.round(totalUsd * gydPerUsd) : null;

  const items = resolved.map((line) => ({
    slug: line.product.slug,
    sourceSystem: line.product.sourceSystem,
    sourceProductId: line.product.sourceProductId,
    name: line.product.name,
    quantity: line.quantity,
    priceUsd: line.product.priceUsd,
  }));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const code = generateOrderCode(category);
    const { data, error } = await supabase
      .from("store_orders")
      .insert({
        code,
        category,
        items,
        total_usd: Number(totalUsd.toFixed(2)),
        gyd_per_usd: gydPerUsd,
        total_gyd: totalGyd,
        customer_name: input.customerName.trim(),
        customer_whatsapp: input.customerWhatsapp.trim(),
      })
      .select("id, code")
      .single();

    if (!error && data) {
      return { status: "ok", orderCode: data.code, canonicalOrderId: data.id };
    }
    // Colisión de código único: reintenta una vez con un código nuevo.
    if (error?.code !== "23505" || attempt === 1) {
      return { status: "error", message: "No se pudo registrar el pedido. Intenta de nuevo." };
    }
  }
  return { status: "error", message: "No se pudo registrar el pedido. Intenta de nuevo." };
}

function generateOrderCode(category: string): string {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const prefix = category === "energia" ? "ENE" : "ALI";
  return `CUY-${prefix}-${suffix}`;
}
