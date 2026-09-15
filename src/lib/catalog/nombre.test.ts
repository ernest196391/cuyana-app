import { describe, expect, it } from "vitest";
import { partirNombre, TOPE_NOMBRE } from "./nombre";

// Los nombres de abajo son los que devuelve NEXO de verdad, copiados de la
// tienda en producción. Si NEXO cambia su formato, estas pruebas son las que
// avisan de que la regla dejó de servir.
describe("partirNombre", () => {
  it("parte por la barra y deja el modelo solo", () => {
    expect(partirNombre("BLUETTI AC180 | 1152 Wh · 1800 W")).toEqual({
      nombre: "BLUETTI AC180",
      ficha: "1152 Wh · 1800 W",
    });
  });

  it("parte por la raya larga", () => {
    expect(partirNombre("EcoFlow DELTA 3 Ultra — Estación de Energía 3072Wh")).toEqual({
      nombre: "EcoFlow DELTA 3 Ultra",
      ficha: "Estación de Energía 3072Wh",
    });
  });

  it("deja intacto el nombre que ya era corto", () => {
    // Este es el ejemplo que se dio por bueno en la auditoría. Si alguna vez
    // deja de pasar, el tope se apretó de más.
    const corto = "Panel solar monocristalino 450W";
    expect(corto.length).toBeLessThanOrEqual(TOPE_NOMBRE);
    expect(partirNombre(corto)).toEqual({ nombre: corto, ficha: null });
  });

  it("corta por palabra entera cuando no hay separador", () => {
    const { nombre, ficha } = partirNombre("Inversor Solar Híbrido SUMRY 4000W 24V 120V");
    expect(nombre.length).toBeLessThanOrEqual(TOPE_NOMBRE + 1); // +1 por el «…»
    expect(nombre.endsWith("…")).toBe(true);
    expect(nombre).not.toMatch(/\s…$/); // sin espacio colgando antes de los puntos
    expect(ficha).toBeNull();
  });

  it("también recorta la cabeza si sigue siendo larga después de partir", () => {
    const { nombre, ficha } = partirNombre("Lámpara LED Recargable USB 30W con Gancho — 3 Modos");
    expect(nombre.length).toBeLessThanOrEqual(TOPE_NOMBRE + 1);
    expect(ficha).toBe("3 Modos");
  });

  it("no se queda sin nombre si el texto empieza por el separador", () => {
    expect(partirNombre("— Estación de Energía").nombre).not.toBe("");
  });

  it("no parte una palabra por la mitad", () => {
    // Una sola palabra larguísima: preferimos que se salga del tope a
    // enseñar un trozo que no significa nada.
    const largo = "Supercalifragilisticoexpialidoso";
    expect(partirNombre(largo, 10).nombre).toBe(largo);
  });

  it("aguanta espacios de sobra en los extremos", () => {
    expect(partirNombre("  BLUETTI AC180 | 1152 Wh  ")).toEqual({
      nombre: "BLUETTI AC180",
      ficha: "1152 Wh",
    });
  });
});
