import { describe, expect, it } from "vitest";
import {
  isElectrodomesticosCategory,
  isEnergiaCategory,
  isEnergiaProduct,
  normalizedCategoryName,
} from "./nexoCategories";

describe("normalizedCategoryName", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(normalizedCategoryName("Energía Solar")).toBe("energia solar");
  });
  it("recorta espacios", () => {
    expect(normalizedCategoryName("  Energia  ")).toBe("energia");
  });
});

describe("catálogo ampliado", () => {
  it("incluye los cuatro productos energéticos clasificados fuera de Energía", () => {
    expect(isEnergiaProduct({ slug: "nexo-ecoflow-cable-10m", categories: [{ name: "Accesorios" }] })).toBe(true);
    expect(isEnergiaProduct({ slug: "nexo-solar-install-supports", categories: [{ name: "Servicios" }] })).toBe(true);
    expect(isEnergiaProduct({ slug: "bateria-portatil-puregear-magnetica-10000mah-20w", categories: [{ name: "Sin categorizar" }] })).toBe(true);
    expect(isEnergiaProduct({ slug: "ventilador-solar-recargable-royal-ra123sl-de-12-pulgadas-con-bombillos-led", categories: [{ name: "Ventiladores" }] })).toBe(true);
  });

  it("reconoce categorías de electrodomésticos de NEXO", () => {
    expect(isElectrodomesticosCategory([{ name: "Electrodomésticos" }])).toBe(true);
    expect(isElectrodomesticosCategory([{ name: "Refrigeradores" }])).toBe(true);
    expect(isElectrodomesticosCategory([{ name: "Cocinas y hornos" }])).toBe(true);
    expect(isElectrodomesticosCategory([{ name: "Energía" }])).toBe(false);
  });
});

describe("isEnergiaCategory — replica el filtro real de NEXO, no el parámetro `category` de su API", () => {
  it("reconoce 'Energía Solar'", () => {
    expect(isEnergiaCategory([{ name: "Energía Solar" }])).toBe(true);
  });
  it("reconoce 'Paneles solares'", () => {
    expect(isEnergiaCategory([{ name: "Paneles solares" }])).toBe(true);
  });
  it("reconoce 'Energia' sin acento", () => {
    expect(isEnergiaCategory([{ name: "Energia" }])).toBe(true);
  });
  it("no confunde otras categorías", () => {
    expect(isEnergiaCategory([{ name: "Cocina y hornos" }])).toBe(false);
    expect(isEnergiaCategory([{ name: "Electrodomésticos" }])).toBe(false);
  });
  it("un producto con varias categorías cuenta si alguna coincide", () => {
    expect(isEnergiaCategory([{ name: "Tecnología" }, { name: "Energía solar" }])).toBe(true);
  });
  it("sin categorías, no es energía", () => {
    expect(isEnergiaCategory([])).toBe(false);
  });
});
