/**
 * Por dónde va un envío, contado para el cliente.
 *
 * Dos cadenas distintas, porque son dos cosas distintas. Una remesa sale de
 * Guyana y se entrega en Cuba. Un pedido de tienda se paga, se compra al
 * proveedor, se prepara y sale a la calle. Contar el segundo con los pasos del
 * primero sería decirle al cliente que su comida «llegó a Guyana».
 *
 * Las claves son las que guarda `cuadre.envio_estados`, y la base comprueba
 * que un paso de un flujo no se cuelgue del otro. Aquí solo se traduce a lo
 * que lee una persona.
 *
 * Se leen con `public.seguimiento(ref)`, que devuelve el paso, el flujo, la
 * nota pública y la hora. La nota interna no sale de ahí.
 */

export type Flujo = "remesa" | "tienda";

export const PASOS_REMESA = [
  "pedido_recibido",
  "recibido_en_guyana",
  "listo_en_cuba",
  "entregado",
] as const;

export const PASOS_TIENDA = [
  "pedido_recibido",
  "pago_confirmado",
  "comprando",
  "preparado",
  "en_camino",
  "entregado",
] as const;

/**
 * Lo que sale mal. No avanza la cadena: se anota cuando pasa y el siguiente
 * paso normal la deja atrás, que es lo que ocurre en la vida real cuando un
 * retraso se resuelve.
 */
export const INCIDENCIAS = [
  "requiere_info",
  "sustitucion_pendiente",
  "retrasado",
  "cancelado",
  "reembolsado",
] as const;

export type Paso = (typeof PASOS_REMESA)[number] | (typeof PASOS_TIENDA)[number];
export type Incidencia = (typeof INCIDENCIAS)[number];
export type Estado = Paso | Incidencia;

export function pasosDe(flujo: Flujo): readonly Paso[] {
  return flujo === "tienda" ? PASOS_TIENDA : PASOS_REMESA;
}

export function esIncidencia(estado: string): estado is Incidencia {
  return (INCIDENCIAS as readonly string[]).includes(estado);
}

export const ETIQUETA: Record<Estado, string> = {
  pedido_recibido: "Pedido recibido",
  // Remesa
  recibido_en_guyana: "Recibimos tu dinero",
  listo_en_cuba: "Listo en Cuba",
  // Tienda
  pago_confirmado: "Pago confirmado",
  comprando: "Comprando tu pedido",
  preparado: "Preparado",
  en_camino: "En camino",
  // Común
  entregado: "Entregado a tu familiar",
  // Incidencias
  requiere_info: "Necesitamos un dato",
  sustitucion_pendiente: "Falta algo por sustituir",
  retrasado: "Va con retraso",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

/** Qué está pasando ahora mismo, para quien mira sin saber de logística. */
export const EXPLICACION: Record<Estado, string> = {
  pedido_recibido: "Tenemos tu pedido.",
  recibido_en_guyana: "Ya lo tenemos. Lo estamos preparando en Cuba.",
  listo_en_cuba: "El dinero ya está de este lado. Estamos contactando a quien lo recibe.",
  pago_confirmado: "Confirmamos tu pago. Empezamos a comprarlo.",
  comprando: "Estamos comprando lo que pediste.",
  preparado: "Tu pedido está listo y esperando al mensajero.",
  en_camino: "Va de camino a la dirección que pusiste.",
  entregado: "Lo recibió la persona que pusiste.",
  requiere_info: "Nos falta un dato para seguir. Te escribimos.",
  sustitucion_pendiente: "Algo no estaba disponible. Te proponemos un cambio antes de tocarlo.",
  retrasado: "Se está demorando más de lo previsto. Seguimos encima.",
  cancelado: "Este envío no salió. Si no sabes por qué, escríbenos.",
  reembolsado: "Te devolvimos el dinero.",
};

export interface Salto {
  estado: Estado;
  flujo?: Flujo;
  nota_publica?: string | null;
  cuando: string;
}

/** El estado de ahora es el último salto, sea un paso o una incidencia. */
export function estadoActual(saltos: Salto[]): Estado | null {
  if (saltos.length === 0) return null;
  return saltos[saltos.length - 1].estado;
}

/**
 * De qué flujo es este envío.
 *
 * Se lee de los saltos y no se adivina por la forma del pedido: el primer
 * salto ya lo trae puesto desde la base. Si no viniera —saltos de antes de que
 * existiera la columna—, remesa, que es lo único que había.
 */
export function flujoDe(saltos: Salto[]): Flujo {
  return saltos.find((s) => s.flujo)?.flujo ?? "remesa";
}

export function cuandoPaso(saltos: Salto[], paso: Estado): string | null {
  return saltos.find((s) => s.estado === paso)?.cuando ?? null;
}

/** Las incidencias que se anotaron, en orden. Se enseñan aparte de la cadena. */
export function incidenciasDe(saltos: Salto[]): Salto[] {
  return saltos.filter((s) => esIncidencia(s.estado));
}

/** Cuántos de los pasos de su flujo se han dado. Para el resumen de una línea. */
export function pasosDados(saltos: Salto[]) {
  return pasosDe(flujoDe(saltos)).filter((p) => saltos.some((s) => s.estado === p)).length;
}
