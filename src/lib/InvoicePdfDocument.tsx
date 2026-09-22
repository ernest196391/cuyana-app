import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceData } from "./invoice";
import { calcularTotales, formatFechaLegible, formatMoney } from "./invoice";

const VINO = "#7a0e2e";
const VINO_DEEP = "#520b24";
const DORADO = "#d4a017";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1f1b1d" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  brandName: { fontSize: 20, fontWeight: 700, color: VINO_DEEP },
  title: { fontSize: 16, fontWeight: 700, color: VINO, textAlign: "right" },
  bold: { fontWeight: 700 },
  metaLine: { marginBottom: 2 },
  metaBlock: { marginBottom: 16, paddingBottom: 10, borderBottom: `1pt solid ${DORADO}` },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  col: { width: "48%" },
  heading: { fontWeight: 700, marginBottom: 4, color: VINO_DEEP },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3e9ec", padding: 6 },
  tableRow: { flexDirection: "row", padding: 6, borderBottom: "0.5pt solid #ddd" },
  posCol: { width: "6%" },
  descCol: { width: "70%" },
  amountCol: { width: "24%", textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: "45%", marginTop: 10 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsRowFinal: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1pt solid ${VINO_DEEP}` },
  section: { marginTop: 18 },
  sectionTitle: { fontWeight: 700, marginBottom: 4, color: VINO_DEEP },
  paragraph: { lineHeight: 1.5 },
  footer: { marginTop: 24, paddingTop: 10, borderTop: "0.5pt solid #ccc", fontSize: 9, color: "#666" },
});

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceData }) {
  const { net, tax, total } = calcularTotales(invoice.lineItems, invoice.taxRatePercent);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{invoice.issuer.name || "Cuyana"}</Text>
          <Text style={styles.title}>FACTURA</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={[styles.metaLine, styles.bold]}>Número: {invoice.number || "(borrador)"}</Text>
          <Text style={styles.metaLine}>
            Fecha: {formatFechaLegible(invoice.invoiceDate)} · Entrega: {formatFechaLegible(invoice.deliveryDate)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.heading}>De</Text>
            <Text>{invoice.issuer.name}</Text>
            {invoice.issuer.addressLine ? <Text>{invoice.issuer.addressLine}</Text> : null}
            {invoice.issuer.postalCity ? <Text>{invoice.issuer.postalCity}</Text> : null}
            {invoice.issuer.phone && <Text>Tel.: {invoice.issuer.phone}</Text>}
            {invoice.issuer.email && <Text>Correo: {invoice.issuer.email}</Text>}
            {invoice.issuer.taxNote && <Text>{invoice.issuer.taxNote}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.heading}>Para</Text>
            <Text>{invoice.recipient.name}</Text>
            {invoice.recipient.addressLine ? <Text>{invoice.recipient.addressLine}</Text> : null}
            {invoice.recipient.postalCity ? <Text>{invoice.recipient.postalCity}</Text> : null}
            {invoice.recipient.phone && <Text>Tel.: {invoice.recipient.phone}</Text>}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detalle</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.posCol, styles.bold]}>#</Text>
          <Text style={[styles.descCol, styles.bold]}>Descripción</Text>
          <Text style={[styles.amountCol, styles.bold]}>Importe</Text>
        </View>
        {invoice.lineItems.map((item, i) => (
          <View style={styles.tableRow} key={i} wrap={false}>
            <Text style={styles.posCol}>{i + 1}</Text>
            <Text style={styles.descCol}>{item.description}</Text>
            <Text style={styles.amountCol}>{formatMoney(item.amount, invoice.currency)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Subtotal:</Text>
            <Text>{formatMoney(net, invoice.currency)}</Text>
          </View>
          {invoice.taxRatePercent > 0 && (
            <View style={styles.totalsRow}>
              <Text>Impuesto ({invoice.taxRatePercent}%):</Text>
              <Text>{formatMoney(tax, invoice.currency)}</Text>
            </View>
          )}
          <View style={styles.totalsRowFinal}>
            <Text style={styles.bold}>Total:</Text>
            <Text style={styles.bold}>{formatMoney(total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.legalNotice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nota</Text>
            <Text style={styles.paragraph}>{invoice.legalNotice}</Text>
          </View>
        )}

        {invoice.shippingNotice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entrega</Text>
            <Text style={styles.paragraph}>{invoice.shippingNotice}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de pago</Text>
          {invoice.paymentMethod && <Text>Forma de pago: {invoice.paymentMethod}</Text>}
          {invoice.iban && <Text>IBAN: {invoice.iban}</Text>}
          {invoice.bic && <Text>BIC: {invoice.bic}</Text>}
          {invoice.bankName && <Text>Banco: {invoice.bankName}</Text>}
          {invoice.paymentReference && <Text>Referencia: {invoice.paymentReference}</Text>}
          <Text>Estado: {invoice.paymentStatus === "pagado" ? "Pagada — ¡gracias por su compra!" : "Pendiente de pago"}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Cuyana — cerca de los tuyos.</Text>
        </View>
      </Page>
    </Document>
  );
}
