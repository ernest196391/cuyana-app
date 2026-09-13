import type { AuditDiff, AuditSeverity, AuditThresholds, SupplierObservation } from "./types";

export const DEFAULT_AUDIT_THRESHOLDS: AuditThresholds = {
  highPriceChangePct: 5,
  criticalPriceChangePct: 15,
};

function sameStructuredValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function auditSupplierObservation(
  before: SupplierObservation,
  after: SupplierObservation,
  thresholds: AuditThresholds = DEFAULT_AUDIT_THRESHOLDS,
): AuditDiff[] {
  const diffs: AuditDiff[] = [];
  const add = (field: string, previous: unknown, current: unknown, severity: AuditSeverity) => {
    if (!sameStructuredValue(previous, current)) diffs.push({ field, before: previous, after: current, severity });
  };

  if (after.sourceReachable === false) add("sourceReachable", before.sourceReachable ?? true, false, "CRITICAL");
  if (before.available !== after.available) {
    add("available", before.available, after.available, after.available === false ? "CRITICAL" : "LOW");
  }

  if (before.price !== after.price) {
    const pct = before.price > 0 ? Math.abs((after.price - before.price) / before.price) * 100 : 100;
    const severity: AuditSeverity = pct > thresholds.criticalPriceChangePct
      ? "CRITICAL"
      : pct >= thresholds.highPriceChangePct
        ? "HIGH"
        : "LOW";
    add("price", before.price, after.price, severity);
  }

  add("presentation", before.presentation, after.presentation, "HIGH");
  add("composition", before.composition, after.composition, "CRITICAL");
  add("eta", before.eta, after.eta, "HIGH");
  add("shipping", before.shipping, after.shipping, "HIGH");
  add("destinationScope", before.destinationScope, after.destinationScope, "CRITICAL");
  return diffs;
}

export function highestSeverity(diffs: AuditDiff[]): AuditSeverity {
  const order: AuditSeverity[] = ["NONE", "LOW", "HIGH", "CRITICAL"];
  return diffs.reduce<AuditSeverity>(
    (highest, diff) => order.indexOf(diff.severity) > order.indexOf(highest) ? diff.severity : highest,
    "NONE",
  );
}
