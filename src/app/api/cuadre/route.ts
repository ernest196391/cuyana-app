import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { roundMoney } from "@/lib/format";

export const runtime = "nodejs";

/**
 * Avisa a Cuadre de un pedido de remesa que ya quedó guardado aquí.
 *
 * Existe por una razón concreta: la clave de Cuadre NO puede pisar el
 * navegador. Quien la tenga puede meter pedidos en la bandeja de Cuadre sin
 * cuenta ni contraseña, así que vive solo en el entorno del servidor y es este
 * archivo el único que la lee.
 *
 * Reglas que se cumplen aquí:
 *
 * - **El dinero no se lo cree al cliente.** El navegador manda cuánto se envía
 *   y qué método; la tasa y el monto de destino se vuelven a resolver contra
 *   `delivery_methods`. Es la misma regla que ya sigue la tienda con los
 *   precios del catálogo.
 * - **Si algo falla, el cliente no se entera.** Su pedido ya está guardado en
 *   `orders` y ya va camino de WhatsApp. Que Cuadre esté caído o sin clave no
 *   puede romperle el envío a nadie.
 * - **Reenviar el mismo pedido no lo duplica.** El `external_ref` viaja a
 *   Cuadre, que lo usa como identidad: el segundo intento devuelve el primero.
 */

/** De dónde se acepta la llamada. No es autenticación —una cabecera se falsea—
 *  pero corta el uso casual desde otro sitio. */
const ORIGENES = [
  "https://cuyana.casavivadecuba.com",
  "https://www.casavivadecuba.com",
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown, max: number) {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const origen = request.headers.get("origin");
  const permitido =
    !origen || ORIGENES.includes(origen) || process.env.NODE_ENV !== "production";
  if (!permitido) {
    return new NextResponse(null, { status: 403 });
  }

  const clave = process.env.CUADRE_API_KEY;
  const destino = process.env.CUADRE_URL || "https://cuadre.casavivadecuba.com";

  const cuerpo = await request.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") {
    return new NextResponse(null, { status: 400 });
  }
  const datos = cuerpo as Record<string, unknown>;

  const ref = typeof datos.ref === "string" && UUID.test(datos.ref) ? datos.ref : null;
  const gyd = typeof datos.gyd === "number" && Number.isFinite(datos.gyd) ? Math.round(datos.gyd) : 0;
  const metodoKey = texto(datos.method_key, 60);
  const nombre = texto(datos.customer_name, 120);
  const telefono = texto(datos.customer_whatsapp, 40);
  const referido = texto(datos.ref_code, 60) || null;

  if (!ref || gyd <= 0 || !metodoKey || !nombre || !telefono) {
    return new NextResponse(null, { status: 400 });
  }

  // La tasa sale de la base, no de lo que diga el navegador.
  if (!supabase) return new NextResponse(null, { status: 204 });
  const { data: metodo } = await supabase
    .from("delivery_methods")
    .select("key, label, target_currency, rate_per_gyd")
    .eq("key", metodoKey)
    .eq("active", true)
    .maybeSingle();

  if (!metodo) return new NextResponse(null, { status: 400 });

  const montoDestino = roundMoney(gyd * Number(metodo.rate_per_gyd), metodo.target_currency);

  // Sin clave configurada no se avisa, pero tampoco se rompe nada: el pedido
  // vive en `orders` y se pasa a mano. Queda en el log para que se note.
  if (!clave) {
    console.warn("CUADRE_API_KEY no está configurada: el pedido no se avisó a Cuadre.", { ref });
    return new NextResponse(null, { status: 204 });
  }

  try {
    const respuesta = await fetch(`${destino}/api/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clave}`,
      },
      body: JSON.stringify({
        external_ref: ref,
        customer_name: nombre,
        customer_phone: telefono,
        amount_source: gyd,
        currency_source: "GYD",
        method_key: metodo.key,
        method_label: metodo.label,
        amount_destination: montoDestino,
        currency_destination: metodo.target_currency,
        rate_used: Number(metodo.rate_per_gyd),
        referred_by: referido,
        source: "cuyana-web",
      }),
      // Que un Cuadre lento no deje colgada la función.
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) {
      console.error("Cuadre rechazó el pedido", {
        ref,
        status: respuesta.status,
        cuerpo: await respuesta.text().catch(() => ""),
      });
    }
  } catch (err) {
    console.error("No se pudo avisar a Cuadre", { ref, err });
  }

  // Siempre 204: el navegador no tiene nada que hacer con el resultado.
  return new NextResponse(null, { status: 204 });
}
