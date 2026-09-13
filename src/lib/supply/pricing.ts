import type { CommercialQuote, MoneyParts } from "./types";

const roundMoney = (value: number) => Number(value.toFixed(2));

function validAmount(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} debe ser un importe válido.`);
  return value;
}

export function calculateCommercialQuote(parts: MoneyParts): CommercialQuote {
  const supplierPrice = validAmount(parts.supplierPrice, "supplierPrice");
  const supplierShipping = validAmount(parts.supplierShipping, "supplierShipping");
  const paymentFxFee = validAmount(parts.paymentFxFee, "paymentFxFee");
  const unavoidableLogistics = validAmount(parts.unavoidableLogistics, "unavoidableLogistics");
  const markupRate = parts.markupRate ?? 0.15;
  if (!Number.isFinite(markupRate) || markupRate < 0) throw new Error("markupRate debe ser válido.");

  const landedCostUsd = roundMoney(supplierPrice + supplierShipping + paymentFxFee + unavoidableLogistics);
  const markupUsd = roundMoney(landedCostUsd * markupRate);
  const share = roundMoney(landedCostUsd * (markupRate / 3));
  const salePriceUsd = roundMoney(landedCostUsd + markupUsd);
  const gydPerUsd = parts.gydPerUsd;

  return {
    landedCostUsd,
    markupUsd,
    salePriceUsd,
    salePriceGyd: gydPerUsd && gydPerUsd > 0 ? Math.round(salePriceUsd * gydPerUsd) : null,
    ernestoShareUsd: share,
    adonysShareUsd: share,
    cuyanaShareUsd: roundMoney(markupUsd - share * 2),
  };
}
