export type InvoiceParty = {
  name: string;
  addressLine: string;
  postalCity: string;
  phone?: string;
  email?: string;
  taxNote?: string;
};

export type InvoiceLineItem = {
  description: string;
  amount: number;
};

export type InvoiceData = {
  id?: string;
  number: string;
  invoiceDate: string;
  deliveryDate: string;
  issuer: InvoiceParty;
  recipient: InvoiceParty;
  lineItems: InvoiceLineItem[];
  taxRatePercent: number;
  currency: "USD" | "GYD" | "CUP";
  legalNotice: string;
  shippingNotice: string;
  paymentMethod: string;
  iban: string;
  bic: string;
  bankName: string;
  paymentReference: string;
  paymentStatus: "pendiente" | "pagado";
  sourceType: "pedido" | "captura" | "manual";
  sourceOrderId?: string | null;
  sourceOrderKind?: "remesa" | "tienda" | null;
  sourceImagePath?: string | null;
  status?: "borrador" | "emitida";
};

export function calcularTotales(lineItems: InvoiceLineItem[], taxRatePercent: number) {
  const net = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tax = net * (taxRatePercent / 100);
  const total = net + tax;
  return { net, tax, total };
}

export function formatMoney(value: number, currency: string) {
  if (currency === "GYD" || currency === "CUP") {
    return `${new Intl.NumberFormat("es", { maximumFractionDigits: 0 }).format(value)} ${currency}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value);
}

export function formatFechaLegible(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
