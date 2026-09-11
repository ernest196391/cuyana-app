// Lógica pura de validación y armado del mensaje de WhatsApp para la
// calculadora de remesas. Separada de Calculator.tsx para poder probarla
// sin React ni red (ver src/lib/remesaMessage.test.ts).
import { formatMoney, formatNumber, formatRateNatural } from "./format";

/** Permisiva a propósito: no se rechaza por formato de país. */
export function telefonoPlausible(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}

export interface RemesaFormInput {
  method: { key: string; label: string; target_currency: string } | null;
  gyd: number;
  montoDestino: number;
  customerName: string;
  customerPhone: string;
}

export function validarFormularioRemesa(input: RemesaFormInput): string | null {
  if (!input.method) return "Todavía estamos cargando los métodos de entrega.";
  if (input.gyd <= 0) return "Escribe cuánto quieres enviar.";
  // El monto destino redondeado debe ser mayor a cero: con USD, un monto muy
  // pequeño redondea a 0,00 y el pedido no tendría sentido.
  if (input.montoDestino <= 0) return "Ese monto es demasiado bajo para este método de entrega.";
  if (input.customerName.trim().length < 2) return "Escribe tu nombre.";
  if (!telefonoPlausible(input.customerPhone)) return "Escribe un número de WhatsApp válido.";
  return null;
}

export interface MensajeRemesaInput {
  greetingName: string;
  customerName: string;
  customerPhone: string;
  gyd: number;
  montoDestino: number;
  targetCurrency: string;
  methodLabel: string;
  ratePerGyd: number;
  ref?: string | null;
}

/**
 * Arma el mensaje de WhatsApp con todos los datos que la auditoría marcó
 * como faltantes: monto, moneda recibida, método, tasa, nombre Y teléfono
 * de quien envía (antes el teléfono no aparecía). No incluye datos internos
 * (IDs, costos, claves de sistema).
 */
export function construirMensajeRemesa(input: MensajeRemesaInput): string {
  const saludo = input.greetingName.trim() ? `Hola ${input.greetingName.trim()}` : "Hola";
  let msg =
    `${saludo}, soy ${input.customerName.trim()} (WhatsApp ${input.customerPhone.trim()}). ` +
    `Quiero mandar ${formatNumber(input.gyd)} GYD para que mi familia en Cuba reciba ` +
    `${formatMoney(input.montoDestino, input.targetCurrency)} ${input.targetCurrency} por ${input.methodLabel} ` +
    `(tasa ${formatRateNatural(input.ratePerGyd, input.targetCurrency)}).`;
  if (input.ref) msg += ` Referido: ${input.ref}.`;
  return msg;
}
