"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { mensajeDeError } from "@/lib/adminFetch";
import PhotoPicker from "@/components/admin/PhotoPicker";

const CATEGORIAS = ["electrodomesticos", "hogar", "alimentos"] as const;

type ImageOption = "original" | "editada" | "generada";

type ProductoRow = {
  product_id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_usd: number;
  image_url: string | null;
  track_stock: boolean;
  stock_quantity: number | null;
  admin_status: "publicado" | "oculto";
};

function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

function base64ToBlob(base64: string, contentType = "image/png"): Blob {
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: contentType });
}

/** Un número si se puede leer del texto; si no (vacío, a medio escribir…), el último válido. */
function parseOr(text: string, fallback: number): number {
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function ProductoFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");

  const [loading, setLoading] = useState(Boolean(editId));
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [photoChanged, setPhotoChanged] = useState(false);
  const existingSlugRef = useRef<string>("");

  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [originalPreview, setOriginalPreview] = useState("");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const [editedPreview, setEditedPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [chosenImage, setChosenImage] = useState<ImageOption>("original");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIAS)[number]>("electrodomesticos");
  const [priceStr, setPriceStr] = useState("");
  const [trackStock, setTrackStock] = useState(false);
  const [stockQtyStr, setStockQtyStr] = useState("0");
  const [status, setStatus] = useState<"publicado" | "oculto">("publicado");
  const [readyToPublish, setReadyToPublish] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  function markDirty() {
    setSaved(false);
    setDirty(true);
  }

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function volver() {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Salir sin guardarlos?")) return;
    router.push("/admin/catalogo");
  }

  useEffect(() => {
    if (!editId || !supabase) return;
    (async () => {
      const { data, error: err } = await supabase.rpc("admin_catalogo_listar_productos");
      if (err) {
        setError(mensajeDeError(err));
        setLoading(false);
        return;
      }
      const found = (data as ProductoRow[] | null)?.find((p) => p.product_id === editId);
      if (!found) {
        setError("No se encontró ese producto.");
        setLoading(false);
        return;
      }
      setName(found.name);
      setDescription(found.description || "");
      if (CATEGORIAS.includes(found.category as (typeof CATEGORIAS)[number])) {
        setCategory(found.category as (typeof CATEGORIAS)[number]);
      }
      setPriceStr(String(found.price_usd));
      setTrackStock(found.track_stock);
      setStockQtyStr(String(found.stock_quantity ?? 0));
      setStatus(found.admin_status);
      setExistingImageUrl(found.image_url || "");
      existingSlugRef.current = found.slug;
      setOriginalPreview(found.image_url || "");
      setReadyToPublish(true);
      setLoading(false);
    })();
  }, [editId]);

  async function handleFile(file: File) {
    setError("");
    try {
      const compressed = await compressImage(file);
      setOriginalBlob(compressed);
      setOriginalPreview(URL.createObjectURL(compressed));
      setPhotoChanged(true);
      setEditedPreview(null);
      setGeneratedPreview(null);
      setChosenImage("original");
      markDirty();
      if (!editId) setReadyToPublish(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer la foto.");
    }
  }

  async function generar() {
    if (!originalBlob || !supabase) return;
    setGenerating(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesión expirada, vuelve a entrar.");

      const form = new FormData();
      form.append("image", originalBlob, "producto.jpg");
      const res = await fetch("/api/catalogo/generar", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo generar la ficha.");

      setName(json.title || "");
      setDescription(json.description || "");
      if (CATEGORIAS.includes(json.category)) setCategory(json.category);

      if (json.editedImageBase64) {
        const blob = base64ToBlob(json.editedImageBase64);
        setEditedPreview({ url: URL.createObjectURL(blob), blob });
        setChosenImage("editada");
      }
      if (json.generatedImageBase64) {
        const blob = base64ToBlob(json.generatedImageBase64);
        setGeneratedPreview({ url: URL.createObjectURL(blob), blob });
        if (!json.editedImageBase64) setChosenImage("generada");
      }
      setReadyToPublish(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la ficha.");
    } finally {
      setGenerating(false);
    }
  }

  async function guardar() {
    if (!supabase) {
      setError("El panel no está conectado a la base de datos.");
      return;
    }
    if (!editId && !originalBlob) {
      setError("Sube primero una foto del producto.");
      return;
    }
    const price = parseOr(priceStr, -1);
    if (!name.trim() || price <= 0) {
      setError("Completa al menos el nombre y un precio válido.");
      return;
    }
    setPublishing(true);
    setError("");
    try {
      let imageUrl = existingImageUrl;
      let slug = existingSlugRef.current;

      if (!editId || photoChanged) {
        const finalBlob =
          chosenImage === "editada" && editedPreview ? editedPreview.blob :
          chosenImage === "generada" && generatedPreview ? generatedPreview.blob :
          originalBlob;
        if (!finalBlob) throw new Error("Falta la foto del producto.");

        if (!editId) {
          const { data: slugData, error: slugError } = await supabase.rpc("admin_catalogo_generar_slug", {
            p_category: category,
            p_name: name.trim(),
          });
          if (slugError || !slugData) throw new Error("No se pudo generar el slug.");
          slug = slugData as string;
        }

        const path = `${slug}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("cuyana-productos").upload(path, finalBlob, {
          contentType: finalBlob.type || "image/jpeg",
          upsert: true,
        });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("cuyana-productos").getPublicUrl(path).data.publicUrl;
        existingSlugRef.current = slug;
      }

      const stockQty = trackStock ? Math.max(0, Math.round(parseOr(stockQtyStr, 0))) : null;

      if (editId) {
        const { error: updateError } = await supabase.rpc("admin_catalogo_actualizar_producto", {
          p_product_id: editId,
          p_name: name.trim(),
          p_description: description.trim(),
          p_category: category,
          p_price_usd: price,
          p_image_url: imageUrl,
          p_track_stock: trackStock,
          p_stock_quantity: stockQty,
          p_admin_status: status,
        });
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.rpc("admin_catalogo_crear_producto", {
          p_slug: slug,
          p_name: name.trim(),
          p_description: description.trim(),
          p_category: category,
          p_price_usd: price,
          p_image_url: imageUrl,
          p_track_stock: trackStock,
          p_stock_quantity: stockQty,
        });
        if (createError) throw createError;
      }

      setDirty(false);
      if (editId) {
        setSaved(true);
        setPhotoChanged(false);
      } else {
        router.push("/admin/catalogo");
      }
    } catch (err) {
      setError(err instanceof Error ? mensajeDeError(err) : "No se pudo guardar el producto.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <main className="admin-page"><p>Cargando producto…</p></main>;

  return (
    <main className="admin-page admin-product-wizard">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">CATÁLOGO</p>
          <h1>{editId ? "Editar producto" : "Nuevo producto"}</h1>
        </div>
      </header>

      {error && <p className="admin-error" ref={errorRef}>{error}</p>}

      <section className="admin-card admin-upload-drop">
        {!originalPreview ? (
          <>
            <strong>Subir foto del producto</strong>
            <p className="admin-note">Adjunta una foto que ya tengas, o tómala con la cámara.</p>
          </>
        ) : (
          <img src={originalPreview} alt="Foto del producto" className="admin-product-preview-img" />
        )}
        <PhotoPicker onSelect={handleFile} />
        {editId && <p className="admin-note">Sube una foto nueva solo si quieres reemplazar la actual.</p>}
      </section>

      {originalPreview && !editId && !readyToPublish && (
        <div className="admin-product-generate-choice">
          <button type="button" className="admin-btn-primary admin-btn-full" onClick={generar} disabled={generating}>
            {generating ? "Generando ficha con IA…" : "Generar con IA"}
          </button>
          <button type="button" className="admin-btn-secondary admin-btn-full" onClick={() => setReadyToPublish(true)} disabled={generating}>
            Completar a mano, sin IA
          </button>
        </div>
      )}

      {readyToPublish && (
        <>
          {(editedPreview || generatedPreview) && (
            <section className="admin-card">
              <h2>Imagen comercial</h2>
              <div className="admin-image-options">
                <button type="button" className={`admin-image-option ${chosenImage === "original" ? "selected" : ""}`} onClick={() => { setChosenImage("original"); markDirty(); }}>
                  <img src={originalPreview} alt="Foto original" />
                  <span>Foto original</span>
                </button>
                {editedPreview && (
                  <button type="button" className={`admin-image-option ${chosenImage === "editada" ? "selected" : ""}`} onClick={() => { setChosenImage("editada"); markDirty(); }}>
                    <img src={editedPreview.url} alt="Edición fiel" />
                    <span>Edición fiel</span>
                  </button>
                )}
                {generatedPreview && (
                  <button type="button" className={`admin-image-option ${chosenImage === "generada" ? "selected" : ""}`} onClick={() => { setChosenImage("generada"); markDirty(); }}>
                    <img src={generatedPreview.url} alt="Foto de estudio (IA)" />
                    <span>Foto de estudio (IA)</span>
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="admin-card">
            <h2>Título y descripción</h2>
            <label className="admin-label">
              Título
              <input className="admin-input" value={name} onChange={(e) => { setName(e.target.value); markDirty(); }} maxLength={80} />
            </label>
            <label className="admin-label">
              Descripción
              <textarea className="admin-input" value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} />
            </label>
            <label className="admin-label">
              Categoría
              <select className="admin-select" value={category} onChange={(e) => { setCategory(e.target.value as (typeof CATEGORIAS)[number]); markDirty(); }}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="admin-card">
            <h2>Precio e inventario</h2>
            {editId && <p className="admin-note">Slug: <strong className="admin-mono">{existingSlugRef.current}</strong></p>}
            <label className="admin-label">
              Precio (USD)
              <input className="admin-input" type="number" step="0.01" min="0" value={priceStr} onChange={(e) => { setPriceStr(e.target.value); markDirty(); }} />
            </label>

            <label className="admin-checkbox-row">
              <input type="checkbox" checked={trackStock} onChange={(e) => { setTrackStock(e.target.checked); markDirty(); }} />
              Controlar inventario de este producto
            </label>
            {trackStock && (
              <label className="admin-label">
                Unidades disponibles
                <div className="admin-stock-stepper">
                  <button
                    type="button"
                    aria-label="Restar una unidad"
                    onClick={() => { setStockQtyStr(String(Math.max(0, Math.round(parseOr(stockQtyStr, 0)) - 1))); markDirty(); }}
                  >
                    −
                  </button>
                  <input className="admin-input" inputMode="numeric" value={stockQtyStr} onChange={(e) => { setStockQtyStr(e.target.value); markDirty(); }} />
                  <button
                    type="button"
                    aria-label="Sumar una unidad"
                    onClick={() => { setStockQtyStr(String(Math.round(parseOr(stockQtyStr, 0)) + 1)); markDirty(); }}
                  >
                    +
                  </button>
                </div>
                <span className="admin-note">Al llegar a 0, el producto se oculta solo de la tienda.</span>
              </label>
            )}

            {editId && (
              <label className="admin-label">
                Estado
                <select className="admin-select" value={status} onChange={(e) => { setStatus(e.target.value as "publicado" | "oculto"); markDirty(); }}>
                  <option value="publicado">Publicado</option>
                  <option value="oculto">Oculto</option>
                </select>
              </label>
            )}
          </section>
        </>
      )}

      {readyToPublish && (
        <div className="admin-product-publish-bar">
          <button type="button" className="admin-btn-primary admin-btn-full" onClick={guardar} disabled={publishing}>
            {publishing ? "Guardando…" : editId ? "Guardar cambios" : "Publicar en la tienda"}
          </button>
          <div className="admin-product-publish-meta">
            <button type="button" className="admin-text-link" onClick={volver} disabled={publishing}>
              {dirty ? "Cancelar" : "Volver a productos"}
            </button>
            {dirty && !publishing && <span className="admin-dirty-warning">Tienes cambios sin guardar.</span>}
            {saved && <span className="admin-saved">Cambios guardados.</span>}
          </div>
        </div>
      )}
    </main>
  );
}

export default function NuevoProductoPage() {
  return (
    <Suspense fallback={<main className="admin-page"><p>Cargando…</p></main>}>
      <ProductoFormInner />
    </Suspense>
  );
}
