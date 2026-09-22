"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { mensajeDeError } from "@/lib/adminFetch";
import { calcularTotales, formatMoney, type InvoiceData, type InvoiceLineItem } from "@/lib/invoice";
import PhotoPicker from "@/components/admin/PhotoPicker";

type BusinessProfile = {
  legal_name: string;
  address_line: string;
  postal_city: string;
  phone: string;
  email: string;
  tax_note: string;
  iban: string;
  bic: string;
  bank_name: string;
  payment_reference_default: string;
  default_legal_notice: string;
  default_shipping_notice: string;
};

type InvoiceRow = {
  id: string;
  number: string | null;
  invoice_date: string;
  delivery_date: string;
  issuer: InvoiceData["issuer"];
  recipient: InvoiceData["recipient"];
  line_items: InvoiceLineItem[];
  tax_rate: number;
  currency: string;
  legal_notice: string;
  shipping_notice: string;
  payment_method: string;
  iban: string;
  bic: string;
  bank_name: string;
  payment_reference: string;
  payment_status: InvoiceData["paymentStatus"];
  source_type: InvoiceData["sourceType"];
  source_order_id: string | null;
  source_order_kind: "remesa" | "tienda" | null;
  status: InvoiceData["status"];
};

type StoreOrderRow = {
  id: string;
  code: string;
  items: { name: string; quantity: number; priceUsd: number }[];
  total_usd: number;
  customer_name: string;
  customer_whatsapp: string;
  recipient_address: string | null;
  recipient_municipality: string | null;
  recipient_province: string | null;
};

type RemesaOrderRow = {
  id: number;
  amount_gyd: number;
  amount_cup: number;
  customer_name: string | null;
  customer_whatsapp: string | null;
  ref_code: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Un número si se puede leer del texto; si no (vacío, a medio escribir…), el último válido. */
function parseOr(text: string, fallback: number): number {
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function emptyInvoice(profile: BusinessProfile): InvoiceData {
  return {
    number: "",
    invoiceDate: today(),
    deliveryDate: today(),
    issuer: {
      name: profile.legal_name,
      addressLine: profile.address_line,
      postalCity: profile.postal_city,
      phone: profile.phone,
      email: profile.email,
      taxNote: profile.tax_note,
    },
    recipient: { name: "", addressLine: "", postalCity: "", phone: "" },
    lineItems: [{ description: "", amount: 0 }],
    taxRatePercent: 0,
    currency: "USD",
    legalNotice: profile.default_legal_notice,
    shippingNotice: profile.default_shipping_notice,
    paymentMethod: "",
    iban: profile.iban,
    bic: profile.bic,
    bankName: profile.bank_name,
    paymentReference: profile.payment_reference_default,
    paymentStatus: "pendiente",
    sourceType: "manual",
    status: "borrador",
  };
}

function NuevaFacturaInner() {
  const params = useSearchParams();
  const pedidoId = params.get("pedido");
  const pedidoTipo = params.get("tipo") as "remesa" | "tienda" | null;
  const facturaId = params.get("factura");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const [amountDrafts, setAmountDrafts] = useState<string[]>([]);
  const [taxRateDraft, setTaxRateDraft] = useState("0");

  function applyInvoice(inv: InvoiceData) {
    setInvoice(inv);
    setAmountDrafts(inv.lineItems.map((li) => String(li.amount)));
    setTaxRateDraft(String(inv.taxRatePercent));
  }

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: profileData, error: profileError } = await supabase.rpc("admin_obtener_perfil_negocio");
      if (profileError || !profileData) {
        setError(profileError ? mensajeDeError(profileError) : "No se pudo cargar el perfil del negocio.");
        setLoading(false);
        return;
      }
      const bp = profileData as BusinessProfile;

      if (facturaId) {
        const { data: facturas } = await supabase.rpc("admin_listar_facturas");
        const found = (facturas as InvoiceRow[] | null)?.find((f) => f.id === facturaId);
        if (found) {
          applyInvoice({
            id: found.id,
            number: found.number || "",
            invoiceDate: found.invoice_date,
            deliveryDate: found.delivery_date,
            issuer: found.issuer,
            recipient: found.recipient,
            lineItems: found.line_items,
            taxRatePercent: found.tax_rate,
            currency: found.currency as InvoiceData["currency"],
            legalNotice: found.legal_notice,
            shippingNotice: found.shipping_notice,
            paymentMethod: found.payment_method,
            iban: found.iban,
            bic: found.bic,
            bankName: found.bank_name,
            paymentReference: found.payment_reference,
            paymentStatus: found.payment_status,
            sourceType: found.source_type,
            sourceOrderId: found.source_order_id || undefined,
            sourceOrderKind: found.source_order_kind || undefined,
            status: found.status,
          });
        } else {
          applyInvoice(emptyInvoice(bp));
        }
      } else if (pedidoId && pedidoTipo === "tienda") {
        const { data: order } = await supabase.from("store_orders").select("*").eq("id", pedidoId).maybeSingle();
        const draft = emptyInvoice(bp);
        if (order) {
          const o = order as StoreOrderRow;
          draft.recipient = {
            name: o.customer_name,
            addressLine: o.recipient_address || "",
            postalCity: [o.recipient_municipality, o.recipient_province].filter(Boolean).join(", "),
            phone: o.customer_whatsapp,
          };
          draft.sourceType = "pedido";
          draft.sourceOrderId = o.id;
          draft.sourceOrderKind = "tienda";
          draft.currency = "USD";
          if (o.items?.length) {
            draft.lineItems = o.items.map((l): InvoiceLineItem => ({
              description: `${l.quantity} × ${l.name}`,
              amount: l.priceUsd * l.quantity,
            }));
          }
        }
        applyInvoice(draft);
      } else if (pedidoId && pedidoTipo === "remesa") {
        const { data: order } = await supabase.from("orders").select("*").eq("id", pedidoId).maybeSingle();
        const draft = emptyInvoice(bp);
        if (order) {
          const o = order as RemesaOrderRow;
          draft.recipient = { name: o.customer_name || "", addressLine: "", postalCity: "", phone: o.customer_whatsapp || "" };
          draft.sourceType = "pedido";
          draft.sourceOrderId = String(o.id);
          draft.sourceOrderKind = "remesa";
          draft.currency = "GYD";
          draft.lineItems = [{ description: `Servicio de envío de remesa${o.ref_code ? ` (${o.ref_code})` : ""}`, amount: Number(o.amount_gyd) || 0 }];
        }
        applyInvoice(draft);
      } else {
        applyInvoice(emptyInvoice(bp));
      }
      setLoading(false);
    })();
  }, [facturaId, pedidoId, pedidoTipo]);

  function update<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) {
    setInvoice((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateRecipient(key: keyof InvoiceData["recipient"], value: string) {
    setInvoice((current) => (current ? { ...current, recipient: { ...current.recipient, [key]: value } } : current));
  }

  function updateLineItem(index: number, patch: Partial<InvoiceLineItem>) {
    setInvoice((current) => {
      if (!current) return current;
      const lineItems = current.lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item));
      return { ...current, lineItems };
    });
  }

  function addLineItem() {
    setInvoice((current) => (current ? { ...current, lineItems: [...current.lineItems, { description: "", amount: 0 }] } : current));
    setAmountDrafts((current) => [...current, "0"]);
  }

  function removeLineItem(index: number) {
    setInvoice((current) => (current ? { ...current, lineItems: current.lineItems.filter((_, i) => i !== index) } : current));
    setAmountDrafts((current) => current.filter((_, i) => i !== index));
  }

  function setAmountDraft(index: number, text: string) {
    setAmountDrafts((current) => current.map((v, i) => (i === index ? text : v)));
    setInvoice((current) => {
      if (!current) return current;
      const previous = current.lineItems[index]?.amount ?? 0;
      const lineItems = current.lineItems.map((item, i) => (i === index ? { ...item, amount: parseOr(text, previous) } : item));
      return { ...current, lineItems };
    });
  }

  function setTaxRateDraftValue(text: string) {
    setTaxRateDraft(text);
    setInvoice((current) => (current ? { ...current, taxRatePercent: parseOr(text, current.taxRatePercent) } : current));
  }

  async function usarSiguienteNumero() {
    if (!supabase || !invoice) return;
    const { data, error: err } = await supabase.rpc("admin_siguiente_numero_factura");
    if (err) setError(mensajeDeError(err));
    else update("number", data as string);
  }

  async function handleUpload(file: File) {
    if (!supabase) return;
    setExtracting(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesión expirada, vuelve a entrar.");

      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/facturas/extraer", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo leer la captura.");

      const ex = json.extracted;
      setInvoice((current) => {
        if (!current) return current;
        const newItems: InvoiceLineItem[] = Array.isArray(ex.items) && ex.items.length
          ? ex.items.map((i: { description: string; amount: number }) => ({ description: i.description || "", amount: Number(i.amount) || 0 }))
          : current.lineItems;
        setAmountDrafts(newItems.map((li) => String(li.amount)));
        return {
          ...current,
          sourceType: "captura",
          recipient: {
            name: ex.recipientName || current.recipient.name,
            addressLine: ex.addressLine || current.recipient.addressLine,
            postalCity: ex.postalCity || current.recipient.postalCity,
            phone: ex.phone || current.recipient.phone,
          },
          lineItems: newItems,
        };
      });
      setNotice("Datos leídos de la captura. Revísalos antes de generar la factura.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer la captura.");
    } finally {
      setExtracting(false);
    }
  }

  async function guardar(status: "borrador" | "emitida" = "borrador") {
    if (!supabase || !invoice) return null;
    const { net, tax, total } = calcularTotales(invoice.lineItems, invoice.taxRatePercent);
    const { data, error: err } = await supabase.rpc("admin_guardar_factura", {
      p_id: invoice.id || null,
      p_number: invoice.number,
      p_invoice_date: invoice.invoiceDate,
      p_delivery_date: invoice.deliveryDate,
      p_issuer: invoice.issuer,
      p_recipient: invoice.recipient,
      p_line_items: invoice.lineItems,
      p_net_amount: net,
      p_tax_rate: invoice.taxRatePercent,
      p_tax_amount: tax,
      p_total_amount: total,
      p_currency: invoice.currency,
      p_legal_notice: invoice.legalNotice,
      p_shipping_notice: invoice.shippingNotice,
      p_payment_method: invoice.paymentMethod,
      p_iban: invoice.iban,
      p_bic: invoice.bic,
      p_bank_name: invoice.bankName,
      p_payment_reference: invoice.paymentReference,
      p_payment_status: invoice.paymentStatus,
      p_source_type: invoice.sourceType,
      p_source_order_id: invoice.sourceOrderId || null,
      p_source_order_kind: invoice.sourceOrderKind || null,
      p_source_image_path: invoice.sourceImagePath || null,
      p_status: status,
    });
    if (err) {
      setError(mensajeDeError(err));
      return null;
    }
    const saved = data as InvoiceRow;
    setInvoice((current) => (current ? { ...current, id: saved.id, number: saved.number || "", status: saved.status } : current));
    return saved;
  }

  async function guardarBorrador() {
    setSaving(true);
    setError("");
    const saved = await guardar("borrador");
    setSaving(false);
    if (saved) setNotice("Borrador guardado.");
  }

  async function generarPdf() {
    if (!invoice || !supabase) return;
    if (!invoice.recipient.name.trim() || !invoice.lineItems.some((l) => l.description.trim())) {
      setError("Completa al menos el cliente y una línea de producto.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await guardar("emitida");
      if (!saved) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesión expirada, vuelve a entrar.");

      const finalInvoice = { ...invoice, number: saved.number || invoice.number };
      const res = await fetch("/api/facturas/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(finalInvoice),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF.");
      const blob = await res.blob();

      const path = `facturas/${saved.id}.pdf`;
      const { error: uploadError } = await supabase.storage.from("cuyana-documentos").upload(path, blob, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      await supabase.rpc("admin_marcar_pdf_factura", { p_id: saved.id, p_pdf_path: path });

      const { data: signed } = await supabase.storage.from("cuyana-documentos").createSignedUrl(path, 3600);
      if (signed?.signedUrl) setPdfUrl(signed.signedUrl);
      setNotice("Factura generada y guardada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la factura.");
    } finally {
      setSaving(false);
    }
  }

  const shareUrl = invoice?.id && invoice.status === "emitida" && typeof window !== "undefined"
    ? `${window.location.origin}/factura/${invoice.id}`
    : "";

  async function copiarEnlace() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Enlace copiado. Pégalo en el WhatsApp del cliente.");
    } catch {
      setNotice(shareUrl);
    }
  }

  if (loading || !invoice) return <main className="admin-page"><p>Cargando…</p></main>;

  const { net, tax, total } = calcularTotales(invoice.lineItems, invoice.taxRatePercent);

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">FACTURACIÓN</p>
          <h1>{invoice.id ? `Editar ${invoice.number || "factura"}` : "Nueva factura"}</h1>
        </div>
      </header>

      {error && <p className="admin-error" ref={errorRef}>{error}</p>}
      {notice && <p className="admin-saved">{notice}</p>}

      <div className="admin-invoice-layout">
        <div className="admin-invoice-form">
          <section className="admin-card admin-upload-drop">
            <strong>{extracting ? "Leyendo captura…" : "Subir captura para rellenar"}</strong>
            <p className="admin-note">
              Sube la captura del vale de WhatsApp o del pedido y se rellenan el cliente y las líneas. Revisa siempre los datos antes de generar el PDF.
            </p>
            <PhotoPicker onSelect={handleUpload} disabled={extracting} />
          </section>

          <section className="admin-card">
            <h2>Datos de la factura</h2>
            <div className="admin-invoice-grid-2">
              <label className="admin-label">Número
                <input className="admin-input" value={invoice.number} onChange={(e) => update("number", e.target.value)} placeholder="Se asigna solo al emitir" />
              </label>
              <label className="admin-label" style={{ alignSelf: "end" }}>
                <button type="button" className="admin-btn-secondary" onClick={usarSiguienteNumero}>Asignar número ahora</button>
              </label>
              <label className="admin-label">Fecha de factura
                <input className="admin-input" type="date" value={invoice.invoiceDate} onChange={(e) => update("invoiceDate", e.target.value)} />
              </label>
              <label className="admin-label">Fecha de entrega
                <input className="admin-input" type="date" value={invoice.deliveryDate} onChange={(e) => update("deliveryDate", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="admin-card">
            <h2>Cliente</h2>
            <div className="admin-invoice-grid-2">
              <label className="admin-label">Nombre
                <input className="admin-input" value={invoice.recipient.name} onChange={(e) => updateRecipient("name", e.target.value)} />
              </label>
              <label className="admin-label">Teléfono
                <input className="admin-input" value={invoice.recipient.phone || ""} onChange={(e) => updateRecipient("phone", e.target.value)} />
              </label>
              <label className="admin-label">Dirección
                <input className="admin-input" value={invoice.recipient.addressLine} onChange={(e) => updateRecipient("addressLine", e.target.value)} />
              </label>
              <label className="admin-label">Municipio / provincia
                <input className="admin-input" value={invoice.recipient.postalCity} onChange={(e) => updateRecipient("postalCity", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="admin-card">
            <h2>Detalle (productos / servicio)</h2>
            {invoice.lineItems.map((item, i) => (
              <div className="admin-line-item" key={i}>
                <textarea
                  className="admin-input"
                  value={item.description}
                  onChange={(e) => updateLineItem(i, { description: e.target.value })}
                  placeholder="Descripción del producto o servicio"
                />
                <input
                  className="admin-input"
                  inputMode="decimal"
                  value={amountDrafts[i] ?? String(item.amount)}
                  onChange={(e) => setAmountDraft(i, e.target.value)}
                  placeholder="Importe"
                />
                <button type="button" className="admin-line-item-remove" onClick={() => removeLineItem(i)} aria-label="Quitar línea">×</button>
              </div>
            ))}
            <button type="button" className="admin-btn-secondary" onClick={addLineItem}>+ Añadir línea</button>

            <div className="admin-invoice-grid-2" style={{ marginTop: 16 }}>
              <label className="admin-label">Moneda
                <select className="admin-select" value={invoice.currency} onChange={(e) => update("currency", e.target.value as InvoiceData["currency"])}>
                  <option value="USD">USD</option>
                  <option value="GYD">GYD</option>
                  <option value="CUP">CUP</option>
                </select>
              </label>
              <label className="admin-label">Impuesto (%)
                <input className="admin-input" inputMode="decimal" value={taxRateDraft} onChange={(e) => setTaxRateDraftValue(e.target.value)} />
              </label>
            </div>

            <div className="admin-invoice-totals">
              <div><span>Subtotal</span><span>{formatMoney(net, invoice.currency)}</span></div>
              <div><span>Impuesto</span><span>{formatMoney(tax, invoice.currency)}</span></div>
              <div className="total"><span>Total</span><span>{formatMoney(total, invoice.currency)}</span></div>
            </div>
          </section>

          <section className="admin-card">
            <h2>Nota legal y de entrega</h2>
            <label className="admin-label">Nota legal
              <textarea className="admin-input" value={invoice.legalNotice} onChange={(e) => update("legalNotice", e.target.value)} />
            </label>
            <label className="admin-label">Nota de entrega
              <textarea className="admin-input" value={invoice.shippingNotice} onChange={(e) => update("shippingNotice", e.target.value)} />
            </label>
          </section>

          <section className="admin-card">
            <h2>Datos de pago</h2>
            <div className="admin-invoice-grid-2">
              <label className="admin-label">Forma de pago
                <input className="admin-input" value={invoice.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} />
              </label>
              <label className="admin-label">Estado del pago
                <select className="admin-select" value={invoice.paymentStatus} onChange={(e) => update("paymentStatus", e.target.value as InvoiceData["paymentStatus"])}>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                </select>
              </label>
              <label className="admin-label">IBAN
                <input className="admin-input" value={invoice.iban} onChange={(e) => update("iban", e.target.value)} />
              </label>
              <label className="admin-label">BIC
                <input className="admin-input" value={invoice.bic} onChange={(e) => update("bic", e.target.value)} />
              </label>
              <label className="admin-label">Banco
                <input className="admin-input" value={invoice.bankName} onChange={(e) => update("bankName", e.target.value)} />
              </label>
              <label className="admin-label">Referencia
                <input className="admin-input" value={invoice.paymentReference} onChange={(e) => update("paymentReference", e.target.value)} />
              </label>
            </div>
          </section>
        </div>

        <div className="admin-sidebar-sticky">
          <section className="admin-card">
            <button type="button" className="admin-btn-secondary admin-btn-full" onClick={guardarBorrador} disabled={saving} style={{ marginBottom: 10 }}>
              Guardar borrador
            </button>
            <button type="button" className="admin-btn-primary admin-btn-full" onClick={generarPdf} disabled={saving}>
              {saving ? "Generando…" : "Generar PDF y emitir"}
            </button>
            {pdfUrl && (
              <a className="admin-text-link" href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 12 }}>
                Ver / descargar factura →
              </a>
            )}
          </section>

          {shareUrl && (
            <section className="admin-card">
              <h2>Compartir con el cliente</h2>
              <p className="admin-note">
                Este enlace abre la factura sin necesitar cuenta ni contraseña. Pégalo tú mismo en el WhatsApp del cliente.
              </p>
              <button type="button" className="admin-btn-secondary admin-btn-full" onClick={copiarEnlace}>
                Copiar enlace para el cliente
              </button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default function NuevaFacturaPage() {
  return (
    <Suspense fallback={<main className="admin-page"><p>Cargando…</p></main>}>
      <NuevaFacturaInner />
    </Suspense>
  );
}
