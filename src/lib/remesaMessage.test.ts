import { describe, expect, it } from "vitest";
import { telefonoPlausible, validarFormularioRemesa, construirMensajeRemesa } from "./remesaMessage";

const METHOD = { key: "cup-transfer", label: "Transferencia CUP", target_currency: "CUP" };

describe("telefonoPlausible", () => {
  it("acepta teléfonos de 7 a 15 dígitos", () => {
    expect(telefonoPlausible("5921234567")).toBe(true);
    expect(telefonoPlausible("1234567")).toBe(true);
    expect(telefonoPlausible("123456789012345")).toBe(true);
  });
  it("rechaza teléfonos demasiado cortos o largos", () => {
    expect(telefonoPlausible("123456")).toBe(false);
    expect(telefonoPlausible("1234567890123456")).toBe(false);
  });
  it("rechaza vacío", () => {
    expect(telefonoPlausible("")).toBe(false);
  });
});

describe("validarFormularioRemesa — el CTA de WhatsApp no debe poder abrirse sin nombre ni teléfono (P0-1)", () => {
  const base = { method: METHOD, gyd: 10000, montoDestino: 32000, customerName: "Juan Pérez", customerPhone: "5921234567" };

  it("formulario completo y válido no produce error", () => {
    expect(validarFormularioRemesa(base)).toBeNull();
  });
  it("sin nombre, se bloquea", () => {
    expect(validarFormularioRemesa({ ...base, customerName: "" })).not.toBeNull();
  });
  it("sin teléfono válido, se bloquea", () => {
    expect(validarFormularioRemesa({ ...base, customerPhone: "123" })).not.toBeNull();
  });
  it("sin método (aún cargando), se bloquea", () => {
    expect(validarFormularioRemesa({ ...base, method: null })).not.toBeNull();
  });
  it("monto en GYD igual a 0, se bloquea", () => {
    expect(validarFormularioRemesa({ ...base, gyd: 0 })).not.toBeNull();
  });
  it("monto destino redondeado a 0, se bloquea (evita pedidos sin sentido)", () => {
    expect(validarFormularioRemesa({ ...base, montoDestino: 0 })).not.toBeNull();
  });
});

describe("construirMensajeRemesa — el teléfono debe aparecer en el mensaje (P0-2)", () => {
  const input = {
    greetingName: "Adonys",
    customerName: "Juan Pérez",
    customerPhone: "5921234567",
    gyd: 25000,
    montoDestino: 90.91,
    targetCurrency: "USD",
    methodLabel: "Efectivo USD",
    ratePerGyd: 1 / 275,
    ref: null,
  };

  it("incluye el teléfono del remitente (antes ausente)", () => {
    const msg = construirMensajeRemesa(input);
    expect(msg).toContain("5921234567");
  });
  it("incluye nombre, monto enviado, moneda recibida, método y tasa", () => {
    const msg = construirMensajeRemesa(input);
    expect(msg).toContain("Juan Pérez");
    expect(msg).toContain("25.000 GYD");
    expect(msg).toContain("90,91 USD");
    expect(msg).toContain("Efectivo USD");
    expect(msg).toContain("275 GYD = 1 USD");
  });
  it("usa el saludo configurado, no un nombre fijo en código (antes 'Adonys' hardcodeado)", () => {
    const msg = construirMensajeRemesa({ ...input, greetingName: "María" });
    expect(msg.startsWith("Hola María,")).toBe(true);
    expect(msg).not.toContain("Adonys");
  });
  it("sin saludo configurado, usa un saludo neutro en vez de inventar un nombre", () => {
    const msg = construirMensajeRemesa({ ...input, greetingName: "" });
    expect(msg.startsWith("Hola,")).toBe(true);
  });
  it("agrega el código de referido solo si existe", () => {
    expect(construirMensajeRemesa({ ...input, ref: "ABC123" })).toContain("Referido: ABC123");
    expect(construirMensajeRemesa({ ...input, ref: null })).not.toContain("Referido");
  });
});
