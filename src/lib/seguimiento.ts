/**
 * Por dónde va un envío, contado para el cliente.
 *
 * Los mismos cuatro pasos que mueve Cuadre —las claves tienen que coincidir,
 * son las que guarda la base— pero dichos desde el otro lado del mostrador:
 * a quien envía no le importa «listo_en_cuba», le importa que su hermana ya
 * puede ir a buscarlo.
 *
 * Se leen con `public.seguimiento(ref)`, que solo devuelve el envío cuya
 * referencia se pide. Esa referencia la tiene únicamente quien lo hizo.
 */
export const PASOS = [
  "pedido_recibido",
  "recibido_en_guyana",
  "listo_en_cuba",
  "entregado",
] as const;

export type Paso = (typeof PASOS)[number];
export type Estado = Paso | "cancelado";

export const ETIQUETA: Record<Estado, string> = {
  pedido_recibido: "Pedido recibido",
  recibido_en_guyana: "Recibimos tu dinero",
  listo_en_cuba: "Listo en Cuba",
  entregado: "Entregado a tu familiar",
  cancelado: "Cancelado",
};

/** Qué está pasando ahora mismo, para quien mira sin saber de logística. */
export const EXPLICACION: Record<Estado, string> = {
  pedido_recibido: "Tenemos tu pedido. Falta que nos hagas llegar el dinero.",
  recibido_en_guyana: "Ya lo tenemos. Lo estamos preparando en Cuba.",
  listo_en_cuba: "El dinero ya está de este lado. Estamos contactando a quien lo recibe.",
  entregado: "Lo recibió la persona que pusiste.",
  cancelado: "Este envío no salió. Si no sabes por qué, escríbenos.",
};

export interface Salto {
  estado: Estado;
  cuando: string;
}

export function estadoActual(saltos: Salto[]): Estado | null {
  if (saltos.length === 0) return null;
  return saltos[saltos.length - 1].estado;
}

export function cuandoPaso(saltos: Salto[], paso: Estado): string | null {
  return saltos.find((s) => s.estado === paso)?.cuando ?? null;
}

/** Cuántos de los cuatro se han dado. Para el resumen de una línea. */
export function pasosDados(saltos: Salto[]) {
  return PASOS.filter((p) => saltos.some((s) => s.estado === p)).length;
}
