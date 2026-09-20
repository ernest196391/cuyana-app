import Link from "next/link";

export const metadata = { title: "Seguimiento de remesa" };

export default function ConsultarEnvio({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = typeof searchParams.ref === "string" ? searchParams.ref.trim() : "";
  return (
    <div className="wrap page-section" style={{ maxWidth: 680 }}>
      <span className="curu-kicker">Seguimiento</span>
      <h1 className="page-title">Consulta tu remesa</h1>
      <p className="section-lead">Escribe la referencia que recibiste al confirmar la operación.</p>
      <form method="get" className="curu-calc" style={{ marginTop: 24 }}>
        <label className="curu-field"><span>Referencia</span><span className="curu-money-input"><input name="ref" defaultValue={ref} placeholder="Ej. CUR-8F42A1" autoCapitalize="characters" /></span></label>
        <button className="curu-submit" type="submit">Consultar <span aria-hidden="true">→</span></button>
      </form>
      {ref && <div className="curu-result"><span>Referencia consultada</span><strong style={{ fontSize: "1.2rem" }}>{ref.toUpperCase()}</strong><p style={{ marginBottom: 0 }}>Si todavía no ves movimientos, confirma la referencia por WhatsApp.</p></div>}
      <p style={{ marginTop: 24 }}><Link href="/">← Volver al inicio</Link></p>
    </div>
  );
}
