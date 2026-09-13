import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const CLAVE_PUBLICA =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

/** Un minuto. Lo justo para mirarlo; no para dejarlo pegado en un chat. */
const SEGUNDOS_DE_VIDA = 60;

/**
 * Abrir el carnet de un cliente, dejando escrito quién lo abrió.
 *
 * Misma disciplina que los números de tarjeta en Cuadre: un documento de
 * identidad no se puede cambiar como una contraseña, así que cada vez que
 * alguien lo mira queda registrado. La bitácora se escribe ANTES de entregar
 * el enlace — si falla el registro, no hay enlace.
 *
 * El enlace es firmado y dura un minuto. El archivo nunca tiene URL pública:
 * eso se decidió al crear el almacén.
 *
 * Límite conocido y asumido: un administrador con la consola del navegador
 * abierta podría firmar el enlace por su cuenta y saltarse este registro,
 * porque la política del almacén le deja leer. Cerrarlo del todo pide una
 * clave de servicio en el servidor, que hoy este proyecto no tiene. La
 * bitácora vale para lo que tiene que valer —saber quién miró qué en el uso
 * normal— y no se presenta como más de lo que es.
 */
export async function POST(request: Request) {
  const cabecera = request.headers.get("authorization") ?? "";
  const token = cabecera.toLowerCase().startsWith("bearer ") ? cabecera.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Hace falta sesión." }, { status: 401 });
  }

  let documentId = "";
  try {
    const body = await request.json();
    documentId = typeof body.documentId === "string" ? body.documentId : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!documentId) {
    return NextResponse.json({ error: "Falta el documento." }, { status: 400 });
  }

  // Cliente con la sesión de quien pide: las políticas de la base deciden, no
  // este código. Si no es administrador, no verá la ficha y aquí se corta.
  const sb = createClient(URL_SUPABASE, CLAVE_PUBLICA, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: usuario } = await sb.auth.getUser(token);
  const quien = usuario.user?.email;
  if (!quien) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const { data: esAdmin } = await sb.rpc("es_admin");
  if (esAdmin !== true) {
    return NextResponse.json({ error: "Esta cuenta no administra el sitio." }, { status: 403 });
  }

  const { data: doc, error: errDoc } = await sb
    .from("customer_documents")
    .select("id, ruta")
    .eq("id", documentId)
    .maybeSingle();
  if (errDoc || !doc) {
    return NextResponse.json({ error: "Ese documento no existe." }, { status: 404 });
  }

  // Primero la bitácora. Si esto falla, no se entrega nada.
  const { error: errBitacora } = await sb
    .from("document_views")
    .insert({ document_id: doc.id, visto_por: quien });
  if (errBitacora) {
    return NextResponse.json({ error: "No se pudo registrar la consulta." }, { status: 500 });
  }

  const { data: firmado, error: errFirma } = await sb.storage
    .from("documentos-clientes")
    .createSignedUrl(doc.ruta as string, SEGUNDOS_DE_VIDA);
  if (errFirma || !firmado) {
    return NextResponse.json({ error: "No se pudo abrir el archivo." }, { status: 500 });
  }

  return NextResponse.json({ url: firmado.signedUrl, segundos: SEGUNDOS_DE_VIDA });
}
