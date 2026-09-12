import { describe, expect, it } from "vitest";
import {
  PROVINCIA,
  catalogoDeEntrega,
  cotizar,
  municipioValido,
  municipios,
  normalizar,
  zonaValida,
  zonasDe,
} from "./mensajeria";

/**
 * Lo que se protege aquí es sobre todo una cosa: que cuando no se reconoce la
 * zona, NO salga un precio. Un número adivinado en una mensajería es una
 * discusión con el cliente cuando el mensajero llegue a la puerta.
 */

describe("municipios y zonas", () => {
  it("cubre los 15 municipios de La Habana", () => {
    expect(municipios()).toHaveLength(15);
    expect(PROVINCIA.nombre).toBe("La Habana");
  });

  it("vienen ordenados como los lee una persona", () => {
    const lista = municipios();
    expect(lista[0]).toBe("Arroyo Naranjo");
    expect(lista).toContain("Plaza de la Revolución");
  });

  it("un municipio grande trae sus barrios", () => {
    const zonas = zonasDe("Playa");
    expect(zonas).toContain("Miramar");
    expect(zonas).toContain("Buenavista");
  });

  it("reconoce el municipio aunque se escriba sin tildes", () => {
    expect(municipioValido("Plaza de la Revolucion")).toBe(true);
    expect(municipioValido("PLAZA DE LA REVOLUCIÓN")).toBe(true);
    expect(zonaValida("playa", "miramar")).toBe(true);
  });

  it("no se inventa municipios de otras provincias", () => {
    expect(municipioValido("Santiago de Cuba")).toBe(false);
    expect(municipioValido("Santa Clara")).toBe(false);
  });

  it("el catálogo trae todo lo que piden los desplegables", () => {
    const c = catalogoDeEntrega();
    expect(c.provincia.nombre).toBe("La Habana");
    expect(c.municipios).toHaveLength(15);
    expect(c.zonas["Playa"]).toContain("Miramar");
  });
});

describe("cuánto cuesta llevarlo", () => {
  it("con el barrio reconocido, cobra su tarifa", () => {
    const c = cotizar("Playa", "Miramar");
    expect(c.estado).toBe("zona");
    expect(c.cup).toBe(1800);
    expect(c.etiqueta).toBe("Miramar");
  });

  it("da igual cómo se escriba el barrio", () => {
    expect(cotizar("playa", "miramar").cup).toBe(1800);
    expect(cotizar("PLAYA", "MIRAMAR").cup).toBe(1800);
  });

  it("barrio desconocido: NO inventa precio, queda a coordinar", () => {
    const c = cotizar("Playa", "Un reparto que no existe");
    expect(c.estado).toBe("a-coordinar");
    expect(c.cup).toBe(0);
  });

  it("pero deja la tarifa general del municipio como orientación", () => {
    const c = cotizar("Playa", "Un reparto que no existe");
    expect(c.referenciaCup).toBe(1800);
  });

  it("sin barrio, tampoco cobra a ciegas", () => {
    const c = cotizar("Boyeros", "");
    expect(c.estado).toBe("a-coordinar");
    expect(c.cup).toBe(0);
    expect(c.referenciaCup).toBe(3000);
  });

  it("fuera de La Habana no hay tarifa ni referencia", () => {
    const c = cotizar("Santiago de Cuba", "Vista Alegre");
    expect(c.estado).toBe("a-coordinar");
    expect(c.cup).toBe(0);
    expect(c.referenciaCup).toBeUndefined();
  });

  it("cada cotización dice con qué tabla se hizo", () => {
    expect(cotizar("Playa", "Miramar").version).toBe(catalogoDeEntrega().version);
  });
});

describe("normalizar", () => {
  it("quita tildes y espacios de sobra", () => {
    expect(normalizar("  Plaza de la Revolución  ")).toBe("plaza de la revolucion");
  });
});
