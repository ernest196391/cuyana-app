import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCatalogProvider } from "@/lib/catalog";
import { validarPedidoTienda } from "@/lib/store/orderMessage";

export const dynamic = "force-dynamic";

type OrderItemBody = { slug?: unknown; sourceSystem?: unknown; sourceProductId?: unknown; quantity?: unknown };

/**
 * Checkout de la tienda Cuyana. Corre en el servidor a propósito: aquí (y
 * solo aquí) vive el acceso al catálogo NEXO (URL/clave) y la reasignación
 * de precio desde la fuente real, nunca desde lo que mande el navegador.
 * Nunca toca WooCommerce ni el checkout de NEXO — persiste en el Supabase
 * de Cuyana antes de que el cliente reciba el enlace de WhatsApp.
 */
export async function POST(request: Request) {
  let body: {
    items?: OrderItemBody[];
    customerName?: unknown;
    customerWhatsapp?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Solicitud inválida." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const customerName = typeof body.customerName === "string" ? body.customerName : "";
  const customerWhatsapp = typeof body.customerWhatsapp === "string" ? body.customerWhatsapp : "";

  const validationError = validarPedidoTienda({
    items: items.map((item) => ({ quantity: Number(item.quantity) || 0 })),
    customerName,
    customerWhatsapp,
  });
  if (validationError) {
    return NextResponse.json({ status: "error", message: validationError }, { status: 400 });
  }

  const parsedItems = [];
  for (const item of items) {
    const slug = typeof item.slug === "string" ? item.slug : "";
    const sourceSystem = typeof item.sourceSystem === "string" ? item.sourceSystem : "";
    const sourceProductId = typeof item.sourceProductId === "string" ? item.sourceProductId : "";
    const quantity = Number(item.quantity);
    if (!slug || !sourceSystem || !sourceProductId || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ status: "error", message: "El carrito tiene un producto inválido." }, { status: 400 });
    }
    parsedItems.push({ slug, sourceSystem, sourceProductId, quantity });
  }

  const provider = getCatalogProvider();
  const result = await provider.createOrder({
    idempotencyKey: randomUUID(),
    items: parsedItems,
    customerName,
    customerWhatsapp,
  });

  if (result.status === "ok") return NextResponse.json(result);
  if (result.status === "not_configured") return NextResponse.json(result, { status: 503 });
  return NextResponse.json(result, { status: 502 });
}
