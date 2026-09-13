export type ResearchStatus = "GREEN" | "GREEN_DRAFT" | "YELLOW" | "RED";
export type AuditSeverity = "NONE" | "LOW" | "HIGH" | "CRITICAL";

export interface MoneyParts {
  supplierPrice: number;
  supplierShipping: number;
  paymentFxFee: number;
  unavoidableLogistics: number;
  markupRate?: number;
  gydPerUsd?: number | null;
}

export interface CommercialQuote {
  landedCostUsd: number;
  markupUsd: number;
  salePriceUsd: number;
  salePriceGyd: number | null;
  ernestoShareUsd: number;
  adonysShareUsd: number;
  cuyanaShareUsd: number;
}

export interface SupplierObservation {
  price: number;
  available: boolean | null;
  presentation?: string | null;
  composition?: unknown;
  eta?: string | null;
  shipping?: number | null;
  destinationScope?: unknown;
  sourceReachable?: boolean;
}

export interface AuditThresholds {
  highPriceChangePct: number;
  criticalPriceChangePct: number;
}

export interface AuditDiff {
  field: string;
  before: unknown;
  after: unknown;
  severity: AuditSeverity;
}
