// Mensaje de WhatsApp del pedido de tienda (alimentos/energía). Igual que
// remesaMessage.ts: lógica pura, sin React ni red, para poder probarla
// aparte. Nunca menciona NEXO ni Product Studio One — de cara al cliente
// esto es un pedido de la tienda Cuyana.
import { telefonoPlausible } from "../remesaMessage";
import { formatNumber } from "../format";

export interface StoreOrderItemInput {
  name: string;
  quantity: number;
  priceUsd: number;
}

export interface ValidarPedidoTiendaInput {
  items: Array<{ quantity: number }>;
  customerName: string;
  customerWhatsapp: string;
  destino?: DestinoEnCuba;
}

/**
 * A dónde va el pedido y quién lo recibe.
 *
 * Esto es lo que separa a Cuyana de una tienda normal: quien paga está en
 * Guyana y quien recibe es su familiar en Cuba. Son dos personas distintas, y
 * el pedido no se puede entregar sin los datos de la segunda.
 */
export interface DestinoEnCuba {
  nombre: string;
  telefono: string;
  provincia: string;
  municipio: string;
  /** Barrio o reparto. Puede ir vacío: entonces la mensajería se coordina. */
  zona: string;
  direccion: string;
  /** Cómo llegar: «casa azul al lado de la bodega». */
  referencia: string;
}

export function validarPedidoTienda(input: ValidarPedidoTiendaInput): string | null {
  if (input.items.length === 0) return "Tu carrito está vacío.";
  if (input.customerName.trim().length < 2) return "Escribe tu nombre.";
  if (!telefonoPlausible(input.customerWhatsapp)) return "Escribe un número de WhatsApp válido.";

  // Un pedido sin destino todavía se acepta: el carrito de hoy no lo manda, y
  // romperle el checkout a quien está comprando ahora mismo no arregla nada.
  // En cuanto llega, se valida entero.
  const d = input.destino;
  if (!d) return null;
  if (d.nombre.trim().length < 2) return "Escribe el nombre de quien lo recibe en Cuba.";
  if (!telefonoPlausible(d.telefono)) return "Escribe el teléfono de quien lo recibe.";
  if (!d.provincia.trim()) return "Falta la provincia de entrega.";
  if (!d.municipio.trim()) return "Elige el municipio de entrega.";
  if (d.direccion.trim().length < 6)
    return "Escribe la dirección exacta: calle, número y entre calles.";
  return null;
}

/** Una sección con título. Si no tiene nada dentro, no sale. */
function seccion(titulo: string, lineas: Array<string | false | null | undefined>) {
  const hay = lineas.filter((l): l is string => Boolean(l));
  return hay.length ? [`*${titulo}*`, ...hay] : [];
}

export interface MensajePedidoTiendaInput {
  code: string;
  items: StoreOrderItemInput[];
  totalUsd: number;
  totalGyd: number | null;
  customerName: string;
  customerWhatsapp: string;
  destino?: DestinoEnCuba;
  /** Lo que cuesta llevarlo, en CUP. `null` = todavía a coordinar. */
  mensajeriaCup?: number | null;
}

/**
 * Arma el mensaje de WhatsApp con el pedido ya persistido (código real).
 *
 * Cuando el pedido trae destino va por secciones, como en NEXO, porque quien
 * lo recibe es Adonys y tiene que coordinar la entrega leyéndolo del teléfono:
 * productos, importes, quién recibe y dónde, y quién envía. La idea es que no
 * tenga que volver a preguntar nada.
 */
export function construirMensajePedidoTienda(input: MensajePedidoTiendaInput): string {
  const lineas = input.items.map(
    (item) => `• ${item.quantity} × ${item.name} — ${item.priceUsd.toFixed(2)} USD`,
  );
  const total = input.totalGyd
    ? `${Math.round(input.totalGyd).toLocaleString("es")} GYD (${input.totalUsd.toFixed(2)} USD)`
    : `${input.totalUsd.toFixed(2)} USD`;

  const d = input.destino;
  if (d) {
    const mensajeria =
      typeof input.mensajeriaCup === "number" && input.mensajeriaCup > 0
        ? `${formatNumber(input.mensajeriaCup)} CUP`
        : "a coordinar";
    return [
      `🟦 *CUYANA · PEDIDO ${input.code}*`,
      "",
      ...seccion("Productos", lineas),
      "",
      ...seccion("Importes", [`Productos: ${total}`, `Mensajería: ${mensajeria}`]),
      "",
      ...seccion("Recibe en Cuba", [
        `Nombre: ${d.nombre.trim()}`,
        `Teléfono: ${d.telefono.trim()}`,
        `Provincia: ${d.provincia.trim()}`,
        `Municipio: ${d.municipio.trim()}`,
        d.zona.trim() && `Zona: ${d.zona.trim()}`,
        `Dirección: ${d.direccion.trim()}`,
        d.referencia.trim() && `Referencia: ${d.referencia.trim()}`,
      ]),
      "",
      ...seccion("Quien envía", [
        `Nombre: ${input.customerName.trim()}`,
        `WhatsApp: ${input.customerWhatsapp.trim()}`,
      ]),
    ]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  return [
    `Hola, soy ${input.customerName.trim()} (WhatsApp ${input.customerWhatsapp.trim()}).`,
    `Quiero confirmar mi pedido *${input.code}* de la tienda Cuyana:`,
    "",
    ...lineas,
    "",
    `Total: ${total}`,
  ].join("\n");
}
