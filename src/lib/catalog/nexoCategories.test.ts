import { describe, expect, it } from "vitest";
import { isEnergiaCategory, normalizedCategoryName } from "./nexoCategories";

describe("normalizedCategoryName", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(normalizedCategoryName("Energía Solar")).toBe("energia solar");
  });
  it("recorta espacios", () => {
    expect(normalizedCategoryName("  Energia  ")).toBe("energia");
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
