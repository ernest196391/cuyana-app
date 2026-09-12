// Mensaje de WhatsApp del pedido de tienda (alimentos/energía). Igual que
// remesaMessage.ts: lógica pura, sin React ni red, para poder probarla
// aparte. Nunca menciona NEXO ni Product Studio One — de cara al cliente
// esto es un pedido de la tienda Cuyana.
import { telefonoPlausible } from "../remesaMessage";

export interface StoreOrderItemInput {
  name: string;
  quantity: number;
  priceUsd: number;
}

export interface ValidarPedidoTiendaInput {
  items: Array<{ quantity: number }>;
  customerName: string;
  customerWhatsapp: string;
}

export function validarPedidoTienda(input: ValidarPedidoTiendaInput): string | null {
  if (input.items.length === 0) return "Tu carrito está vacío.";
  if (input.customerName.trim().length < 2) return "Escribe tu nombre.";
  if (!telefonoPlausible(input.customerWhatsapp)) return "Escribe un número de WhatsApp válido.";
  return null;
}

export interface MensajePedidoTiendaInput {
  code: string;
  items: StoreOrderItemInput[];
  totalUsd: number;
  totalGyd: number | null;
  customerName: string;
  customerWhatsapp: string;
}

/** Arma el mensaje de WhatsApp con el pedido ya persistido (código real). */
export function construirMensajePedidoTienda(input: MensajePedidoTiendaInput): string {
  const lineas = input.items.map(
    (item) => `• ${item.quantity} × ${item.name} — ${item.priceUsd.toFixed(2)} USD`,
  );
  const total = input.totalGyd
    ? `${Math.round(input.totalGyd).toLocaleString("es")} GYD (${input.totalUsd.toFixed(2)} USD)`
    : `${input.totalUsd.toFixed(2)} USD`;

  return [
    `Hola, soy ${input.customerName.trim()} (WhatsApp ${input.customerWhatsapp.trim()}).`,
    `Quiero confirmar mi pedido *${input.code}* de la tienda Cuyana:`,
    "",
    ...lineas,
    "",
    `Total: ${total}`,
  ].join("\n");
}
