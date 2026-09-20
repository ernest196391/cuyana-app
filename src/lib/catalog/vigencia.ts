import type { CatalogProduct } from "./types";

/**
 * Qué puede venderse y qué no.
 *
 * La disponibilidad pública es una decisión manual del administrador. La
 * fecha de revisión del proveedor sigue guardándose para auditoría, pero ya
 * no apaga automáticamente una ficha ni la saca de la tienda.
 *
 * UNA FICHA A MEDIAS NO SE VENDE. Un combo sin descripción, sin
 *    composición y sin política de sustitución es «foto + nombre + precio»,
 *    que es exactamente lo que el Blueprint prohíbe (§8.4, §10.2) y lo que
 *    el paso 7 de §7.3 pone como condición para publicar.
 *
 * No se esconde el producto: se deja a la vista y sin poder comprarse, con el
 * motivo. Esconderlo dejaría la tienda vacía sin que nadie se entere de por
 * qué, y quien opera necesita ver qué hay que arreglar.
 */
export function sinPrecioVigente(validUntil: string | null | undefined, ahora = Date.now()) {
  void validUntil;
  void ahora;
  return false;
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

/** Respeta la publicación manual y evita vender combos sin datos esenciales. */
export function aplicarVigencia(
  producto: CatalogProduct,
  validUntil: string | null | undefined,
  ahora = Date.now(),
): CatalogProduct {
  if (fichaIncompleta(producto)) {
    return { ...producto, available: false, unavailableReason: "ficha_incompleta" };
  }
  void validUntil;
  void ahora;
  if (!producto.available) {
    return { ...producto, unavailableReason: producto.unavailableReason ?? "agotado" };
  }
  return producto;
}
