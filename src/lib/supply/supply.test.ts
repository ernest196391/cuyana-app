import { describe, expect, it } from "vitest";
import { auditSupplierObservation, highestSeverity } from "./audit";
import { calculateCommercialQuote } from "./pricing";

describe("economía de abastecimiento", () => {
  it("incluye todos los costos aterrizados y distribuye el margen", () => {
    expect(calculateCommercialQuote({
      supplierPrice: 100,
      supplierShipping: 10,
      paymentFxFee: 2,
      unavoidableLogistics: 3,
      gydPerUsd: 245,
    })).toEqual({
      landedCostUsd: 115,
      markupUsd: 17.25,
      salePriceUsd: 132.25,
      salePriceGyd: 32401,
      ernestoShareUsd: 5.75,
      adonysShareUsd: 5.75,
      cuyanaShareUsd: 5.75,
    });
  });

  it("no inventa GYD sin tasa vigente", () => {
    expect(calculateCommercialQuote({ supplierPrice: 10, supplierShipping: 0, paymentFxFee: 0, unavoidableLogistics: 0 }).salePriceGyd).toBeNull();
  });
});

describe("auditoría de ofertas", () => {
  it("marca como crítico el agotado y cambios mayores de precio", () => {
    const diffs = auditSupplierObservation(
      { price: 100, available: true, composition: ["arroz"] },
      { price: 116, available: false, composition: ["arroz"] },
    );
    expect(highestSeverity(diffs)).toBe("CRITICAL");
    expect(diffs.map((d) => d.field)).toEqual(["available", "price"]);
  });

  it("marca composición y cobertura como críticas", () => {
    const diffs = auditSupplierObservation(
      { price: 10, available: true, composition: ["huevos"], destinationScope: ["Habana"] },
      { price: 10, available: true, composition: ["pollo"], destinationScope: [] },
    );
    expect(diffs.every((d) => d.severity === "CRITICAL")).toBe(true);
  });
});
