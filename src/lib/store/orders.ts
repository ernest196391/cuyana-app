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
    // El id y el código se deciden AQUÍ, y no se pide la fila de vuelta.
    //
    // Pedirla obligaría a un SELECT sobre `store_orders`, y ahí solo puede
    // leer el admin: en esa tabla están los nombres y los teléfonos de todos
    // los clientes. Abrir la lectura para recuperar dos campos que ya se
    // conocen sería cambiar un pedido roto por una fuga de datos. Esto es lo
    // que tenía la tienda parada: la fila se insertaba y la lectura de vuelta
    // se denegaba, así que el cliente veía «no se pudo registrar el pedido».
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
      ...destinoParaGuardar(input.destino),
    });

    if (!error) {
      // Avisar a Cuadre viene DESPUÉS de guardar y va aparte: el pedido ya está
      // a salvo aquí, y que Cuadre falle no puede tumbarle la compra a nadie.
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
          ...destinoParaCuadre(input.destino),
          source: "cuyana-web",
        },
        code
      );
      return { status: "ok", orderCode: code, canonicalOrderId: id };
    }

    // Colisión del código único: reintenta una vez con otro.
    if (error.code === "23505" && attempt === 0) continue;

    // Sin esto, un pedido perdido no deja ni rastro y no hay forma de saber
    // por qué. Va el error, no el cliente: en los registros no pintan nada su
    // nombre ni su teléfono.
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

/**
 * Los datos de quien recibe, más lo que cuesta llevarlo.
 *
 * La mensajería se vuelve a calcular AQUÍ contra la tabla de tarifas, igual que
 * los precios de los productos: lo que llegue del navegador sobre cuánto cuesta
 * llevarlo no se guarda. Y cuando no se reconoce el barrio, el importe queda en
 * NULL — un cero ahí se leería como «envío gratis».
 *
 * Sale de una sola función porque la fila de la base y el aviso a Cuadre tienen
 * que decir exactamente lo mismo; con dos copias, la primera corrección se
 * aplicaría a una sola.
 */
function destinoResuelto(destino: CreateOrderInput["destino"]) {
  if (!destino) return null;
  const envio = cotizar(destino.municipio, destino.zona);
  return {
    recipient_name: destino.nombre.trim(),
    recipient_phone: destino.telefono.trim(),
    recipient_municipality: destino.municipio.trim(),
    recipient_zone: destino.zona.trim() || null,
    recipient_address: destino.direccion.trim(),
    recipient_reference: destino.referencia.trim() || null,
    shipping_cup: envio.estado === "zona" ? envio.cup : null,
    shipping_status: envio.estado,
    shipping_rate_version: envio.version,
  };
}

/** Para la fila de `store_orders`. */
function destinoParaGuardar(destino: CreateOrderInput["destino"]) {
  return destinoResuelto(destino) ?? {};
}

/** Para el aviso a Cuadre: lo mismo, más la provincia, que allá se lee sola. */
function destinoParaCuadre(destino: CreateOrderInput["destino"]) {
  const d = destinoResuelto(destino);
  if (!d) return {};
  const { shipping_rate_version: _, ...resto } = d;
  return { ...resto, recipient_province: "La Habana" };
}

function generateOrderCode(category: string): string {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const prefix = category === "energia" ? "ENE" : "ALI";
  return `CUY-${prefix}-${suffix}`;
}
