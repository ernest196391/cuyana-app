import { describe, expect, it } from "vitest";
import { aplicarVigencia, fichaIncompleta, sinPrecioVigente } from "./vigencia";
import type { CatalogProduct } from "./types";

/**
 * Estas pruebas guardan dos reglas que costaban dinero y confianza.
 *
 * La primera es una asimetría real que había en producción: la ruta de compra
 * del operador se niega a comprar con una oferta vencida, pero la tienda del
 * cliente no miraba la vigencia. O sea que se le podía vender a alguien a un
 * precio que Ernesto tenía después prohibido pagar.
 *
 * La segunda es el combo `carnes-aceite`, publicado y DESTACADO con la
 * descripción vacía, sin composición y sin política de sustitución: foto,
 * nombre y precio, que es lo único que el Blueprint dice explícitamente que
 * una ficha de combo no puede ser.
 */

const AHORA = Date.parse("2026-09-13T12:00:00Z");

const comboCompleto: CatalogProduct = {
  slug: "combo-basicos-de-casa", sourceSystem: "cuyana-market", sourceProductId: "p1",
  syncedAt: "2026-09-13T00:00:00Z", category: "alimentos", name: "Básicos de Casa",
  description: "Tres esenciales", imageUrl: null, priceUsd: 30.99, available: true,
  kind: "bundle", presentation: "30 huevos + arroz + aceite",
  composition: ["30 huevos", "1 kg de arroz", "900 ml de aceite"],
  substitutionPolicy: "Confirmamos antes de sustituir", eta: "24 h",
};

// El de verdad, tal como está publicado hoy en la base.
const comboCarnesAceite: CatalogProduct = {
  ...comboCompleto, slug: "combo-carnes-aceite", name: "Carnes + Aceite", priceUsd: 41.34,
  description: "", composition: null, substitutionPolicy: null,
  presentation: "pollo 3 lb + cerdo 2 lb + aceite 900 ml–1 L",
};

describe("vigencia del precio", () => {
  it("un precio vencido no vale", () => {
    expect(sinPrecioVigente("2026-09-13T11:59:00Z", AHORA)).toBe(true);
  });
  it("uno que no ha vencido, sí", () => {
    expect(sinPrecioVigente("2026-09-14T00:00:00Z", AHORA)).toBe(false);
  });
  it("sin fecha de vencimiento se trata como vencido, no como eterno", () => {
    // `valid_until` en nulo es lo que escribe la revalidación cuando bloquea
    // una oferta. Leerlo como «no caduca» sería justo al revés.
    expect(sinPrecioVigente(null, AHORA)).toBe(true);
  });
  it("una fecha ilegible no abre la puerta", () => {
    expect(sinPrecioVigente("mañana", AHORA)).toBe(true);
  });

  it("un combo con el precio vencido deja de poder comprarse, y dice por qué", () => {
    const r = aplicarVigencia(comboCompleto, "2026-09-13T06:00:00Z", AHORA);
    expect(r.available).toBe(false);
    expect(r.unavailableReason).toBe("precio_vencido");
  });

  it("con el precio vigente se compra igual que antes", () => {
    const r = aplicarVigencia(comboCompleto, "2026-09-14T00:00:00Z", AHORA);
    expect(r.available).toBe(true);
    expect(r.unavailableReason).toBeUndefined();
  });
});

describe("ficha completa", () => {
  it("un combo sin composición ni política está a medias", () => {
    expect(fichaIncompleta(comboCarnesAceite)).toBe(true);
  });
  it("uno con todo, no", () => {
    expect(fichaIncompleta(comboCompleto)).toBe(false);
  });
  it("a un producto suelto no se le exige composición", () => {
    // Su presentación ya dice qué es; pedirle una lista sería vaciar la tienda.
    expect(fichaIncompleta({ ...comboCarnesAceite, kind: "product" })).toBe(false);
  });

  it("un combo a medias no se vende aunque el precio esté vigente", () => {
    const r = aplicarVigencia(comboCarnesAceite, "2026-09-14T00:00:00Z", AHORA);
    expect(r.available).toBe(false);
    expect(r.unavailableReason).toBe("ficha_incompleta");
  });

  it("la ficha manda sobre el precio: primero se dice lo que se puede arreglar", () => {
    const r = aplicarVigencia(comboCarnesAceite, "2026-09-13T06:00:00Z", AHORA);
    expect(r.unavailableReason).toBe("ficha_incompleta");
  });
});

describe("lo que ya estaba agotado", () => {
  it("conserva su motivo, no se disfraza de otra cosa", () => {
    const r = aplicarVigencia({ ...comboCompleto, available: false }, "2026-09-14T00:00:00Z", AHORA);
    expect(r.available).toBe(false);
    expect(r.unavailableReason).toBe("agotado");
  });
});
