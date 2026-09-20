import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

const VALID_CATEGORIES = ["electrodomesticos", "hogar", "alimentos"];

const TEXT_PROMPT = `Eres un asistente de catálogo para CUYANA, un negocio que vende productos para familias en Cuba (electrodomésticos, hogar, alimentos).

Te llega la foto de un producto. Devuelve ÚNICAMENTE un objeto JSON, sin texto adicional, con esta forma exacta:
{
  "title": string,
  "description": string,
  "category": one of ["electrodomesticos","hogar","alimentos"],
  "visualSummary": string
}

Reglas:
- "title": título de producto para la ficha, claro y concreto (marca/modelo si se ve, característica principal), máximo 70 caracteres, en español.
- "description": 2-3 frases de copy comercial, en español, honesto (no inventes características que no se vean).
- "category": clasifica el producto lo mejor posible.
- "visualSummary": descripción física objetiva y detallada del producto (forma, color, materiales, marca visible, tamaño aproximado) para que otra IA pueda recrear una foto de estudio fiel, sin adornos de marketing.`;

async function callOpenAIVision(apiKey: string, model: string, base64: string, mediaType: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: TEXT_PROMPT },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`texto: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const text: string = payload?.choices?.[0]?.message?.content || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("texto: respuesta sin JSON");
  return JSON.parse(match[0]);
}

async function callOpenAIEdit(apiKey: string, model: string, bytes: Buffer, mediaType: string) {
  const form = new FormData();
  form.append("model", model);
  form.append(
    "prompt",
    "Professional e-commerce product photography retouch. Keep the exact same product, unchanged in shape, color, material and any visible text or logo. Replace the background with a clean, softly lit neutral studio background (light gray gradient), center the product, remove clutter, add soft realistic shadow and balanced lighting. Do not invent or alter product details."
  );
  form.append("size", "1024x1024");
  form.append("n", "1");
  form.append("image", new Blob([new Uint8Array(bytes)], { type: mediaType }), "producto.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) throw new Error(`edición: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  return payload?.data?.[0]?.b64_json as string | undefined;
}

async function callOpenAIGenerate(apiKey: string, model: string, visualSummary: string) {
  const prompt = `Professional e-commerce product photography, studio lighting, neutral light gray background, centered composition, high detail, commercial catalog style. Product: ${visualSummary}`;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, prompt, size: "1024x1024", n: 1 }),
  });
  if (!response.ok) throw new Error(`generación: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  return payload?.data?.[0]?.b64_json as string | undefined;
}

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
  const textModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mediaType = file.type || "image/png";

  const [textResult, editResult] = await Promise.allSettled([
    callOpenAIVision(apiKey, textModel, base64, mediaType),
    callOpenAIEdit(apiKey, imageModel, bytes, mediaType),
  ]);

  if (textResult.status === "rejected") {
    console.error("Fallo leyendo el producto", textResult.reason);
    return NextResponse.json({ error: "No se pudo analizar la foto." }, { status: 502 });
  }
  const parsed = textResult.value;
  const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "electrodomesticos";

  let generatedImageBase64: string | undefined;
  try {
    generatedImageBase64 = await callOpenAIGenerate(apiKey, imageModel, parsed.visualSummary || parsed.title || "producto");
  } catch (err) {
    console.error("Fallo generando foto de estudio", err);
  }

  if (editResult.status === "rejected") {
    console.error("Fallo editando la foto", editResult.reason);
  }

  return NextResponse.json({
    ok: true,
    title: parsed.title || "",
    description: parsed.description || "",
    category,
    editedImageBase64: editResult.status === "fulfilled" ? editResult.value : null,
    generatedImageBase64: generatedImageBase64 || null,
  });
}
