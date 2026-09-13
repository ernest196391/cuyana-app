import { describe, expect, it } from "vitest";
import {
  parseAmount,
  formatNumber,
  formatMoney,
  roundMoney,
  formatRateNatural,
  formatProductPrice,
} from "./format";

describe("parseAmount / formatNumber (formato latinoamericano)", () => {
  it("parsea miles con punto", () => {
    expect(parseAmount("10.000")).toBe(10000);
  });
  it("formatea miles con punto", () => {
    expect(formatNumber(10000)).toBe("10.000");
    expect(formatNumber(7593)).toBe("7.593");
  });
  it("trata una entrada vacía o inválida como 0", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("roundMoney / formatMoney — decimales por moneda", () => {
  it("CUP no lleva decimales", () => {
    expect(roundMoney(32000.4, "CUP")).toBe(32000);
    expect(formatMoney(32000, "CUP")).toBe("32.000");
  });
  it("USD lleva dos decimales", () => {
    // Caso de la auditoría: 25.000 GYD a 275 GYD/USD -> 90.91 USD
    const montoDestino = roundMoney(25000 / 275, "USD");
    expect(montoDestino).toBeCloseTo(90.91, 2);
    expect(formatMoney(montoDestino, "USD")).toBe("90,91");
  });
  it("un monto muy pequeño puede redondear a 0 (el llamador debe validar esto)", () => {
    expect(roundMoney(0.001, "USD")).toBe(0);
  });
});

describe("formatRateNatural", () => {
  it("tasa >= 1 se lee en dirección directa", () => {
    expect(formatRateNatural(3.2, "CUP")).toBe("1 GYD = 3,2 CUP");
  });
  it("tasa < 1 se invierte para leerse naturalmente", () => {
    // 1/275 ≈ 0.00363636
    expect(formatRateNatural(1 / 275, "USD")).toBe("275 GYD = 1 USD");
  });
  it("tasa 0 o negativa no produce una lectura falsa", () => {
    expect(formatRateNatural(0, "USD")).toBe("—");
  });
});

describe("formatProductPrice — GYD primario, USD secundario, sin inventar tasa", () => {
  it("sin tasa comercial vigente, avisa sin degradar a USD", () => {
    const price = formatProductPrice(45, null);
    expect(price.primary).toBe("Precio en actualización");
    expect(price.secondary).toBeNull();
  });
  it("con tasa comercial, GYD es primario y USD secundario", () => {
    const price = formatProductPrice(40, 275);
    expect(price.primary).toBe("G$ 11.000");
    expect(price.secondary).toBe("US$ 40,00");
  });
  it("agrupa también montos de cuatro cifras", () => {
    expect(formatProductPrice(30.99, 245).primary).toBe("G$ 7.593");
  });
});
