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

// ─────────────────────────────────────────────────────────────────────────────
// El pedido con destino: lo que de verdad le llega a Adonys para coordinar.
// ─────────────────────────────────────────────────────────────────────────────
describe("pedido con destino en Cuba", () => {
  const destino = {
    nombre: "Yanet Pérez Rondón",
    telefono: "+53 5 234 5678",
    provincia: "La Habana",
    municipio: "Playa",
    zona: "Miramar",
    direccion: "Calle 26 #503 e/ 31 y 33, apto 4",
    referencia: "Edificio azul, frente a la bodega",
  };
  const base = {
    code: "CUY-ENE-B5A830B1",
    items: [{ name: "Infinity Solar MoonFlyer Pro", quantity: 3, priceUsd: 4215 }],
    totalUsd: 12645,
    totalGyd: null,
    customerName: "Ernesto Rondón",
    customerWhatsapp: "+5354056173",
  };

  it("trae todo lo que hace falta para llevarlo a la puerta", () => {
    const m = construirMensajePedidoTienda({ ...base, destino, mensajeriaCup: 1800 });
    expect(m).toContain("Yanet Pérez Rondón");
    expect(m).toContain("+53 5 234 5678");
    expect(m).toContain("Provincia: La Habana");
    expect(m).toContain("Municipio: Playa");
    expect(m).toContain("Zona: Miramar");
    expect(m).toContain("Calle 26 #503 e/ 31 y 33, apto 4");
    expect(m).toContain("Referencia: Edificio azul, frente a la bodega");
  });

  it("distingue a quien paga de quien recibe", () => {
    const m = construirMensajePedidoTienda({ ...base, destino, mensajeriaCup: 1800 });
    expect(m).toContain("*Recibe en Cuba*");
    expect(m).toContain("*Quien envía*");
    expect(m).toContain("Ernesto Rondón");
  });

  it("dice el precio de la mensajería cuando se sabe", () => {
    // Ojo: en español los números de cuatro cifras van SIN punto de miles
    // (1800), y con cinco sí (18.000). Lo aplica el formateador de la casa.
    expect(
      construirMensajePedidoTienda({ ...base, destino, mensajeriaCup: 1800 })
    ).toContain("Mensajería: 1800 CUP");
    expect(
      construirMensajePedidoTienda({ ...base, destino, mensajeriaCup: 18000 })
    ).toContain("Mensajería: 18.000 CUP");
  });

  it("y NO se lo inventa cuando no se sabe", () => {
    const m = construirMensajePedidoTienda({ ...base, destino, mensajeriaCup: null });
    expect(m).toContain("Mensajería: a coordinar");
    expect(m).not.toMatch(/Mensajería: 0/);
  });

  it("sin zona, la línea de zona no aparece vacía", () => {
    const m = construirMensajePedidoTienda({
      ...base,
      destino: { ...destino, zona: "", referencia: "" },
      mensajeriaCup: null,
    });
    expect(m).not.toContain("Zona:");
    expect(m).not.toContain("Referencia:");
    expect(m).toContain("Municipio: Playa");
  });

  it("sin destino sigue saliendo el mensaje de siempre", () => {
    const m = construirMensajePedidoTienda(base);
    expect(m).toContain("Hola, soy Ernesto Rondón");
    expect(m).not.toContain("Recibe en Cuba");
  });
});

describe("validar el destino", () => {
  const ok = {
    items: [{ quantity: 1 }],
    customerName: "Ernesto Rondón",
    customerWhatsapp: "+5354056173",
  };
  const destino = {
    nombre: "Yanet Pérez",
    telefono: "+53 5 234 5678",
    provincia: "La Habana",
    municipio: "Playa",
    zona: "Miramar",
    direccion: "Calle 26 #503 e/ 31 y 33",
    referencia: "",
  };

  it("acepta un destino completo", () => {
    expect(validarPedidoTienda({ ...ok, destino })).toBeNull();
  });

  it("no deja pedir sin saber quién lo recibe", () => {
    expect(validarPedidoTienda({ ...ok, destino: { ...destino, nombre: "" } })).toMatch(/quien lo recibe/);
  });

  it("ni sin su teléfono", () => {
    expect(validarPedidoTienda({ ...ok, destino: { ...destino, telefono: "123" } })).toMatch(/teléfono/);
  });

  it("ni sin municipio", () => {
    expect(validarPedidoTienda({ ...ok, destino: { ...destino, municipio: "" } })).toMatch(/municipio/);
  });

  it("una dirección demasiado corta no vale para llegar a una puerta", () => {
    expect(validarPedidoTienda({ ...ok, destino: { ...destino, direccion: "26" } })).toMatch(/dirección exacta/);
  });

  it("un pedido sin destino todavía pasa: el carrito viejo sigue vivo", () => {
    expect(validarPedidoTienda(ok)).toBeNull();
  });
});
