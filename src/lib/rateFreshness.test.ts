import { describe, expect, it } from "vitest";
import { rateFreshnessStatus } from "./rateFreshness";

const NOW = new Date("2026-09-11T21:55:00Z");
function hoursAgo(h: number) {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
}

describe("rateFreshnessStatus — vigente / por vencer / vencida (P0-3)", () => {
  it("recién actualizada es vigente", () => {
    expect(rateFreshnessStatus(hoursAgo(0.1), NOW, 12, 24)).toBe("vigente");
  });
  it("justo por debajo del umbral fresco sigue vigente", () => {
    expect(rateFreshnessStatus(hoursAgo(11.9), NOW, 12, 24)).toBe("vigente");
  });
  it("entre fresco y caducado está por vencer", () => {
    expect(rateFreshnessStatus(hoursAgo(18), NOW, 12, 24)).toBe("por_vencer");
  });
  it("más allá del umbral de caducidad está vencida — nunca coexiste con 'tasa de hoy'", () => {
    expect(rateFreshnessStatus(hoursAgo(30), NOW, 12, 24)).toBe("vencida");
  });
  it("caso de auditoría: actualización el 9/9 21:55 evaluada el 11/9 está vencida", () => {
    const updatedAt = "2026-09-09T21:55:00Z";
    const checkedAt = new Date("2026-09-11T12:00:00Z");
    expect(rateFreshnessStatus(updatedAt, checkedAt, 12, 24)).toBe("vencida");
  });
  it("un reloj de cliente adelantado no marca la tasa como vencida", () => {
    const futureUpdate = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString();
    expect(rateFreshnessStatus(futureUpdate, NOW, 12, 24)).toBe("vigente");
  });
});
