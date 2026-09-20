import type { SupabaseClient } from "@supabase/supabase-js";
import { auditSupplierObservation, highestSeverity } from "./audit";
import { extractProductPage } from "./extractProductPage";
import { safeSourceUrl } from "./safeSourceUrl";

/**
 * Revalidar UNA oferta: volver a leer la página del proveedor, apuntar lo que
 * dice hoy, y renovar —o cortar— la vigencia del precio publicado.
 *
 * Esto vivía dentro de `/api/admin/supply/revalidate`. Se sacó aquí para que
 * la renovación de una y la de todas sean literalmente el mismo código. Si
 * fueran dos copias, la de «todas» se quedaría atrás en cuanto alguien tocara
 * la de «una», y estaríamos renovando precios con reglas viejas — que en una
 * tienda que maneja dinero real es de las peores cosas que pueden pasar sin
 * que nadie se entere.
 *
 * NO inventa precios. Si la página del proveedor no se puede leer o no se le
 * saca un precio, la oferta queda BLOQUEADA y el producto sale del escaparate.
 * Vale más una tienda con menos cosas que una que promete un precio que nadie
 * comprobó.
 */

export const VIGENCIA_MS = 86_400_000; // 24 h, igual que la ruta de una sola.
const MARGEN = 1.15;

export interface ResultadoRevalidacion {
  offerId: string;
  ok: boolean;
  renovada: boolean;
  bloqueada: boolean;
  motivo?: string;
  precio: number | null;
  severidad: string | null;
  /** Falso si la ficha pública no se pudo tocar. Ver `avisarSiNoTocoNada`. */
  fichaActualizada: boolean;
}

/**
 * Cómo nos presentamos al pedir la página de un proveedor.
 *
 * Sin esto, Node no manda `User-Agent` y varias tiendas contestan 403 sin
 * mirar nada más. El 15 de septiembre fueron 17 de 34 ofertas —combitos y
 * revolico enteros— dadas por «no se pudo leer» cuando la página estaba
 * perfectamente viva.
 *
 * Son páginas públicas de producto de proveedores a los que ya les compramos,
 * y esto automatiza exactamente lo que se hacía a mano: abrir la ficha y
 * mirar el precio antes de pagarlo. Por eso el identificador dice quiénes
 * somos y deja una dirección de contacto, en vez de disfrazarse de otro: si a
 * algún proveedor le molesta, que pueda decírnoslo y lo quitamos de la lista.
 */
const COMO_NOS_PRESENTAMOS = {
  "user-agent":
    "Mozilla/5.0 (compatible; CuyanaBot/1.0; +https://cuyana.casavivadecuba.com/contacto)",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "es-ES,es;q=0.9,en;q=0.8",
} as const;

async function leerFuentePublica(inicial: URL): Promise<Response> {
  let actual = inicial;
  for (let saltos = 0; saltos <= 4; saltos += 1) {
    const respuesta = await fetch(actual, { redirect: "manual", cache: "no-store", headers: COMO_NOS_PRESENTAMOS, signal: AbortSignal.timeout(12000) });
    if (![301, 302, 303, 307, 308].includes(respuesta.status)) return respuesta;
    const siguiente = safeSourceUrl(new URL(respuesta.headers.get("location") ?? "", actual).toString());
    if (!siguiente) throw new Error("Redirección insegura");
    actual = siguiente;
  }
  throw new Error("Demasiadas redirecciones");
}

export async function revalidarOferta(sb: SupabaseClient, offerId: string): Promise<ResultadoRevalidacion> {
  const fallo = (motivo: string): ResultadoRevalidacion => ({
    offerId, ok: false, renovada: false, bloqueada: false, motivo,
    precio: null, severidad: null, fichaActualizada: false,
  });

  const { data: offer, error } = await sb
    .from("market_supplier_offers")
    .select("id,product_id,source_url,source_price,currency,availability,presentation,composition,supplier_shipping,destination_scope,eta_text")
    .eq("id", offerId)
    .maybeSingle();
  if (error || !offer) return fallo("Oferta no encontrada.");

  const sourceUrl = safeSourceUrl(offer.source_url);
  if (!sourceUrl) return fallo("La URL de origen no es pública y segura.");

  const { data: previa } = await sb
    .from("market_supplier_observations")
    .select("id,price,availability,presentation,composition,supplier_shipping,destination_scope,eta_text,source_reachable")
    .eq("offer_id", offer.id)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let respuesta: Response;
  try {
    respuesta = await leerFuentePublica(sourceUrl);
  } catch {
    // 599 no es un código real: es la forma de decir «no se pudo llegar» sin
    // romper el flujo, para que quede constancia de la revisión fallida en
    // vez de perderse.
    respuesta = new Response("", { status: 599 });
  }

  const html = respuesta.ok ? await respuesta.text() : "";
  const extraido = respuesta.ok ? extractProductPage(html) : { price: null, available: false, currency: null };

  const antes = previa
    ? {
        price: Number(previa.price ?? offer.source_price),
        available: previa.availability === "available" ? true : previa.availability === "unavailable" ? false : null,
        presentation: previa.presentation, composition: previa.composition, eta: previa.eta_text,
        shipping: previa.supplier_shipping, destinationScope: previa.destination_scope,
        sourceReachable: previa.source_reachable,
      }
    : {
        price: Number(offer.source_price),
        available: offer.availability === "available",
        presentation: offer.presentation, composition: offer.composition, eta: offer.eta_text,
        shipping: offer.supplier_shipping, destinationScope: offer.destination_scope,
        sourceReachable: true,
      };
  const despues = { ...antes, price: extraido.price ?? antes.price, available: extraido.available, sourceReachable: respuesta.ok };

  const diffs = auditSupplierObservation(antes, despues);
  const severidad = highestSeverity(diffs);
  const bloquea = severidad === "CRITICAL" || extraido.price === null || extraido.available !== true;

  const { data: observacion, error: errorObs } = await sb
    .from("market_supplier_observations")
    .insert({
      offer_id: offer.id, http_status: respuesta.status, resolved_url: respuesta.url || offer.source_url,
      source_reachable: respuesta.ok, price: extraido.price, currency: extraido.currency ?? offer.currency,
      availability: extraido.available === true ? "available" : extraido.available === false ? "unavailable" : "unknown",
      presentation: offer.presentation, composition: offer.composition, supplier_shipping: offer.supplier_shipping,
      destination_scope: offer.destination_scope, eta_text: offer.eta_text,
      extraction_confidence: extraido.price !== null ? 90 : 25, snapshot: { extractor: "product-jsonld-v1" },
    })
    .select("id")
    .single();
  if (errorObs || !observacion) return fallo("No se pudo guardar la revisión.");

  await sb.from("market_supplier_audits").insert({
    offer_id: offer.id, previous_observation_id: previa?.id ?? null,
    current_observation_id: observacion.id, severity: severidad, diffs, blocks_purchase: bloquea,
  });

  const hasta = new Date(Date.now() + VIGENCIA_MS).toISOString();
  await sb.from("market_supplier_offers").update({
    source_price: despues.price,
    availability: despues.available === true ? "available" : despues.available === false ? "unavailable" : "unknown",
    last_checked_at: new Date().toISOString(),
    valid_until: bloquea ? null : hasta,
    status: bloquea ? "blocked" : "approved",
  }).eq("id", offer.id);

  // `.select()` no es decorativo: sin él, PostgREST contesta «ok» aunque la
  // actualización no haya tocado NADA. Así fue como una política de lectura
  // dejó el catálogo entero apagado sin que nadie se enterara — el botón
  // decía que había renovado y la tienda seguía a oscuras. Ahora se cuenta lo
  // que se tocó y se dice cuando son cero.
  let tocadas: unknown[] | null = null;

  if (bloquea) {
    // Una comprobación fallida se registra en la oferta, pero no despublica
    // la ficha. Desde ahora solo el administrador decide cuándo retirarla.
    const { data } = await sb
      .from("market_public_catalog")
      .update({ source_checked_at: new Date().toISOString() })
      .eq("product_id", offer.product_id)
      .select("product_id");
    tocadas = data;
  } else {
    const { data } = await sb
      .from("market_public_catalog")
      .update({
        price_usd: Number((despues.price * MARGEN).toFixed(2)),
        source_checked_at: new Date().toISOString(),
        valid_until: hasta,
        available: true,
      })
      .eq("product_id", offer.product_id)
      .select("product_id");
    tocadas = data;
  }

  // Un producto que no está publicado no tiene ficha, y eso es normal: no es
  // un fallo. Solo se avisa cuando la ficha existe y aun así no se pudo tocar.
  const { count: tieneFicha } = await sb
    .from("market_public_catalog")
    .select("product_id", { count: "exact", head: true })
    .eq("product_id", offer.product_id);
  const fichaActualizada = (tocadas?.length ?? 0) > 0 || (tieneFicha ?? 0) === 0;

  return {
    offerId, ok: true, renovada: !bloquea, bloqueada: bloquea,
    precio: extraido.price, severidad: severidad ?? null, fichaActualizada,
    motivo: fichaActualizada ? undefined : "La ficha de la tienda no se pudo actualizar.",
  };
}
