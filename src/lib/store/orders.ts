import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";
import type { CatalogProduct, CatalogProvider, CreateOrderInput, CreateOrderResult } from "@/lib/catalog/types";
import { cotizar } from "./mensajeria";
import { avisarACuadre } from "@/lib/cuadre";

/**
 * Persiste el pedido de tienda en el Supabase de Cuyana ANTES de que exista
 * cualquier mensaje de WhatsApp: `canonicalOrderId` es la fila real en
 * `store_orders`, no un pedido de WooCommerce (esta tienda nunca escribe en
 * NEXO). El precio de cada línea se vuelve a resolver contra el catálogo en
 * vivo — nunca se confía en el precio que mande el cliente — para que el
 * total guardado sea el real al momento del pedido.
 *
 * Regla que hay que respetar al tocar esto: sobre `store_orders` el cliente
 * puede INSERTAR pero no LEER, porque ahí están los datos de todos los demás
 * clientes. Cualquier `.select()` encadenado a un insert vuelve a romper la
 * tienda entera.
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

  const coberturas = Array.from(
    new Set(resolved.map(({ product }) => product.deliveryLocation || "La Habana")),
  );
  if (coberturas.length > 1) {
    return {
      status: "error",
      message: "Este carrito mezcla productos de distintas provincias. Haz un pedido separado para cada provincia.",
    };
  }
  // La cobertura vuelve a resolverse desde el catálogo: nunca se confía en la
  // provincia enviada por el navegador.
  const destino = input.destino
    ? { ...input.destino, provincia: coberturas[0] || "La Habana" }
    : undefined;

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
    const id = randomUUID();
    const code = generateOrderCode(category);
    const { error } = await supabase.from("store_orders").insert({
      id,
      code,
      category,
      items,
      total_usd: Number(totalUsd.toFixed(2)),
      gyd_per_usd: gydPerUsd,
      total_gyd: totalGyd,
      customer_name: input.customerName.trim(),
      customer_whatsapp: input.customerWhatsapp.trim(),
      customer_id: input.customerId ?? null,
      ...destinoParaGuardar(destino),
    });

    if (!error) {
      await avisarACuadre(
        {
          external_ref: id,
          tipo: "tienda",
          categoria: category,
          order_code: code,
          items: items.map((l) => ({ nombre: l.name, cantidad: l.quantity, precio_usd: l.priceUsd })),
          amount_total_usd: Number(totalUsd.toFixed(2)),
          amount_total_gyd: totalGyd,
          customer_name: input.customerName.trim(),
          customer_phone: input.customerWhatsapp.trim(),
          ...destinoParaCuadre(destino),
          source: "cuyana-web",
        },
        code,
      );
      return { status: "ok", orderCode: code, canonicalOrderId: id };
    }

    if (error.code === "23505" && attempt === 0) continue;

    console.error("No se pudo guardar el pedido de tienda", {
      code,
      categoria: category,
      error: { code: error.code, message: error.message, details: error.details, hint: error.hint },
    });
    return {
      status: "error",
      message: "No se pudo registrar el pedido. Escríbenos por WhatsApp y lo tomamos nosotros.",
    };
  }
  return {
    status: "error",
    message: "No se pudo registrar el pedido. Escríbenos por WhatsApp y lo tomamos nosotros.",
  };
}

function destinoResuelto(destino: CreateOrderInput["destino"]) {
  if (!destino) return null;
  const envio = cotizar(destino.municipio, destino.zona);
  return {
    recipient_name: destino.nombre.trim(),
    recipient_phone: destino.telefono.trim(),
    recipient_province: destino.provincia.trim(),
    recipient_municipality: destino.municipio.trim(),
    recipient_zone: destino.zona.trim() || null,
    recipient_address: destino.direccion.trim(),
    recipient_reference: destino.referencia.trim() || null,
    shipping_cup: envio.estado === "zona" ? envio.cup : null,
    shipping_status: envio.estado,
    shipping_rate_version: envio.version,
  };
}

function destinoParaGuardar(destino: CreateOrderInput["destino"]) {
  return destinoResuelto(destino) ?? {};
}

function destinoParaCuadre(destino: CreateOrderInput["destino"]) {
  const d = destinoResuelto(destino);
  if (!d) return {};
  const { shipping_rate_version: _, ...resto } = d;
  return resto;
}

function generateOrderCode(category: string): string {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const prefix = category === "energia" ? "ENE" : category === "electrodomesticos" ? "ELE" : "ALI";
  return `CUY-${prefix}-${suffix}`;
}
