/**
 * Aviso a Cuadre, que es donde se opera lo que entra por la web.
 *
 * Solo servidor. La clave permite meter pedidos en Cuadre sin cuenta ni
 * contraseña, así que vive en `CUADRE_API_KEY` —sin `NEXT_PUBLIC_`— y este
 * módulo es el único que la lee.
 *
 * Nunca lanza. El pedido ya está guardado en Cuyana antes de llegar aquí: que
 * Cuadre esté caído, sin clave o devolviendo un error no puede romperle la
 * compra a nadie ni perder lo que ya se registró.
 */
export async function avisarACuadre(
  payload: Record<string, unknown>,
  /** Para el log, cuando algo falla y hay que saber de qué pedido se habla. */
  referencia: string
): Promise<void> {
  const clave = process.env.CUADRE_API_KEY;
  const destino = process.env.CUADRE_URL || "https://cuadre.casavivadecuba.com";

  if (!clave) {
    console.warn("CUADRE_API_KEY no está configurada: el pedido no se avisó a Cuadre.", {
      referencia,
    });
    return;
  }

  try {
    const respuesta = await fetch(`${destino}/api/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clave}` },
      body: JSON.stringify(payload),
      // Que un Cuadre lento no deje colgada la función.
      signal: AbortSignal.timeout(8000),
    });
    if (!respuesta.ok) {
      console.error("Cuadre rechazó el pedido", {
        referencia,
        status: respuesta.status,
        cuerpo: await respuesta.text().catch(() => ""),
      });
    }
  } catch (err) {
    console.error("No se pudo avisar a Cuadre", { referencia, err });
  }
}
