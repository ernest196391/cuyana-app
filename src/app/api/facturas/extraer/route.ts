import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

const EXTRACTION_PROMPT = `Eres un asistente que ayuda a preparar facturas para Cuyana, un negocio que envía remesas y productos de Guyana a Cuba.

Te llega una captura de pantalla (puede ser una conversación de WhatsApp, un vale de pedido, un comprobante de pago o la ficha de un producto). Extrae de ahí los datos para armar la factura.

Devuelve ÚNICAMENTE un objeto JSON, sin texto adicional, con esta forma exacta:
{
  "recipientName": string,
  "addressLine": string,
  "postalCity": string,
  "phone": string,
  "items": [{"description": string, "amount": number}],
  "notes": string
}

Reglas:
- Si un dato no aparece en la imagen, deja el campo como cadena vacía "" (o [] para items si no hay ninguno claro).
- "amount" es el precio en la moneda que aparezca (USD normalmente), como número sin símbolo, con punto decimal.
- "description" debe describir el producto o servicio con el detalle que aparezca (nombre, cantidad, características).
- No inventes datos que no estén en la imagen.`;

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error: adminError } = await authedClient.rpc("es_admin");
  if (adminError || isAdmin !== true) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta configurar OPENAI_API_KEY en el servidor." }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mediaType = file.type || "image/png";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI API error", response.status, errText);
    return NextResponse.json({ error: "No se pudo leer la captura." }, { status: 502 });
  }

  const payload = await response.json();
  const text: string = payload?.choices?.[0]?.message?.content || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "No se pudo interpretar la captura." }, { status: 502 });
  }

  try {
    const extracted = JSON.parse(match[0]);
    return NextResponse.json({ ok: true, extracted });
  } catch {
    return NextResponse.json({ error: "No se pudo interpretar la captura." }, { status: 502 });
  }
}
