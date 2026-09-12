import { describe, expect, it } from "vitest";
import { construirMensajePedidoTienda, validarPedidoTienda } from "./orderMessage";

describe("validarPedidoTienda", () => {
  const base = { items: [{ quantity: 1 }], customerName: "Juan Pérez", customerWhatsapp: "5921234567" };

  it("pedido completo y válido no produce error", () => {
    expect(validarPedidoTienda(base)).toBeNull();
  });
  it("carrito vacío, se bloquea", () => {
    expect(validarPedidoTienda({ ...base, items: [] })).not.toBeNull();
  });
  it("sin nombre, se bloquea", () => {
    expect(validarPedidoTienda({ ...base, customerName: "" })).not.toBeNull();
  });
  it("sin WhatsApp válido, se bloquea", () => {
    expect(validarPedidoTienda({ ...base, customerWhatsapp: "123" })).not.toBeNull();
  });
});

describe("construirMensajePedidoTienda — nunca menciona NEXO, siempre incluye el código real", () => {
  const input = {
    code: "CUY-ENE-AB12CD34",
    items: [
      { name: "Panel solar Boviet 620W", quantity: 1, priceUsd: 350 },
      { name: "Inversor SUMRY 4000W", quantity: 1, priceUsd: 420 },
    ],
    totalUsd: 770,
    totalGyd: 211750,
    customerName: "Juan Pérez",
    customerWhatsapp: "5921234567",
  };

  it("incluye el código del pedido persistido", () => {
    expect(construirMensajePedidoTienda(input)).toContain("CUY-ENE-AB12CD34");
  });
  it("incluye nombre, teléfono y cada línea del pedido", () => {
    const msg = construirMensajePedidoTienda(input);
    expect(msg).toContain("Juan Pérez");
    expect(msg).toContain("5921234567");
    expect(msg).toContain("Panel solar Boviet 620W");
    expect(msg).toContain("Inversor SUMRY 4000W");
  });
  it("con tasa comercial, muestra GYD primero y USD entre paréntesis", () => {
    expect(construirMensajePedidoTienda(input)).toContain("211.750 GYD (770.00 USD)");
  });
  it("sin tasa comercial configurada, muestra solo USD", () => {
    const msg = construirMensajePedidoTienda({ ...input, totalGyd: null });
    expect(msg).toContain("Total: 770.00 USD");
    expect(msg).not.toContain("GYD");
  });
  it("nunca menciona NEXO ni Product Studio", () => {
    const msg = construirMensajePedidoTienda(input).toLowerCase();
    expect(msg).not.toContain("nexo");
    expect(msg).not.toContain("product studio");
  });
});
