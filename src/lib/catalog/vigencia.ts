import type { CatalogProduct } from "./types";

/**
 * Qué puede venderse y qué no.
 *
 * Dos reglas que el Blueprint exige y que hasta ahora no comprobaba nadie en
 * la cara del cliente:
 *
 * 1. UN PRECIO VENCIDO NO SE VENDE. `market_public_catalog.valid_until`
 *    existe desde el principio y el catálogo del cliente lo ignoraba. La
 *    ruta de compra del operador (`/api/admin/supply/purchase`) SÍ lo exige:
 *    se niega a comprar con una oferta vencida. O sea que la tienda podía
 *    venderle a alguien a un precio que después Ernesto tenía prohibido
 *    pagar. Esa diferencia la come CUYANA o se cancela el pedido.
 *
 * 2. UNA FICHA A MEDIAS NO SE VENDE. Un combo sin descripción, sin
 *    composición y sin política de sustitución es «foto + nombre + precio»,
 *    que es exactamente lo que el Blueprint prohíbe (§8.4, §10.2) y lo que
 *    el paso 7 de §7.3 pone como condición para publicar.
 *
 * No se esconde el producto: se deja a la vista y sin poder comprarse, con el
 * motivo. Esconderlo dejaría la tienda vacía sin que nadie se entere de por
 * qué, y quien opera necesita ver qué hay que arreglar.
 */
export function sinPrecioVigente(validUntil: string | null | undefined, ahora = Date.now()) {
  if (!validUntil) return true;
  const t = new Date(validUntil).getTime();
  return !Number.isFinite(t) || t <= ahora;
}

/**
 * Un combo tiene que poder decir qué lleva dentro y qué pasa si falta algo.
 * A un producto suelto no se le exige composición: su presentación ya lo dice.
 */
export function fichaIncompleta(p: Pick<CatalogProduct, "kind" | "description" | "composition" | "substitutionPolicy">) {
  if (p.kind !== "bundle") return false;
  const sinTexto = !p.description || p.description.trim() === "";
  const sinComposicion = !p.composition || p.composition.length === 0;
  const sinPolitica = !p.substitutionPolicy || p.substitutionPolicy.trim() === "";
  return sinTexto || sinComposicion || sinPolitica;
}

/** Aplica las dos reglas. El orden importa: se informa del primer problema. */
export function aplicarVigencia(
  producto: CatalogProduct,
  validUntil: string | null | undefined,
  ahora = Date.now(),
): CatalogProduct {
  if (fichaIncompleta(producto)) {
    return { ...producto, available: false, unavailableReason: "ficha_incompleta" };
  }
  if (sinPrecioVigente(validUntil, ahora)) {
    return { ...producto, available: false, unavailableReason: "precio_vencido" };
  }
  if (!producto.available) {
    return { ...producto, unavailableReason: producto.unavailableReason ?? "agotado" };
  }
  return producto;
}
