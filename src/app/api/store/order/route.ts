import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCatalogProvider } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import { validarPedidoTienda, type DestinoEnCuba } from "@/lib/store/orderMessage";

export const dynamic = "force-dynamic";

type OrderItemBody = { slug?: unknown; sourceSystem?: unknown; sourceProductId?: unknown; quantity?: unknown };

/**
 * De quién es el pedido, comprobándolo de verdad.
 *
 * El navegador manda su token y aquí se le pregunta a Supabase de quién es.
 * Creerse un `customerId` puesto en el cuerpo sería dejar que cualquiera
 * escriba pedidos en la cuenta de otro con solo cambiar un número.
 *
 * Si no hay token o no vale, el pedido entra sin dueño, que es lo mismo que
 * pasa cuando alguien compra sin registrarse. Nunca falla por esto: una sesión
 * caducada no puede costarle la compra a nadie.
 */
async function duenoDelPedido(request: Request): Promise<string | null> {
  const cabecera = request.headers.get("authorization") ?? "";
  const token = cabecera.toLowerCase().startsWith("bearer ") ? cabecera.slice(7).trim() : "";
  if (!token || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Saca el destino del cuerpo sin creerse nada de lo que venga.
 *
 * Solo se leen los campos que importan y cada uno se acota: un municipio de
 * 4.000 caracteres o un objeto con llaves de más no tienen por qué llegar a la
 * base. La tarifa de mensajería NO se lee de aquí — se recalcula en el servidor
 * contra la tabla de tarifas, igual que los precios.
 */
function leerDestino(bruto: unknown): DestinoEnCuba | undefined {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return undefined;
  const d = bruto as Record<string, unknown>;
  const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const destino: DestinoEnCuba = {
    nombre: texto(d.nombre, 120),
    telefono: texto(d.telefono, 40),
    municipio: texto(d.municipio, 60),
    zona: texto(d.zona, 60),
    direccion: texto(d.direccion, 300),
    referencia: texto(d.referencia, 300),
  };
  // Un objeto vacío es lo mismo que no mandar destino: el carrito viejo.
  return Object.values(destino).some(Boolean) ? destino : undefined;
}

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
    destino?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Solicitud inválida." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const customerName = typeof body.customerName === "string" ? body.customerName : "";
  const customerWhatsapp = typeof body.customerWhatsapp === "string" ? body.customerWhatsapp : "";
  const destino = leerDestino(body.destino);

  const validationError = validarPedidoTienda({
    items: items.map((item) => ({ quantity: Number(item.quantity) || 0 })),
    customerName,
    customerWhatsapp,
    destino,
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
    destino,
    customerId: await duenoDelPedido(request),
  });

  if (result.status === "ok") return NextResponse.json(result);
  if (result.status === "not_configured") return NextResponse.json(result, { status: 503 });
  return NextResponse.json(result, { status: 502 });
}
