import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/lib/InvoicePdfDocument";
import type { InvoiceData } from "@/lib/invoice";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

export async function POST(req: NextRequest) {
  // Exige admin desde el primer día: en Zaldívar esta misma ruta se
  // construyó sin esta comprobación y cualquiera que encontrara la URL
  // podía generar un PDF con la cara oficial del negocio mandando su
  // propio JSON. Aquí no se repite ese fallo.
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error: adminError } = await authedClient.rpc("es_admin");
  if (adminError || isAdmin !== true) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let invoice: InvoiceData;
  try {
    invoice = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!invoice?.recipient?.name || !invoice.lineItems?.length) {
    return NextResponse.json({ error: "Faltan datos de la factura" }, { status: 400 });
  }

  const buffer = await renderToBuffer(<InvoicePdfDocument invoice={invoice} />);
  const safeFileName = (invoice.number || "borrador").replace(/[^a-zA-Z0-9._-]+/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFileName}.pdf"`,
    },
  });
}
