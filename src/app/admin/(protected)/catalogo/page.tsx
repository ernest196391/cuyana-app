"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { conTimeout, mensajeDeError } from "@/lib/adminFetch";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import LoadError from "@/components/admin/LoadError";

type Producto = {
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
  available: boolean;
  created_at: string;
};

const CATEGORIAS = ["Todas", "electrodomesticos", "hogar", "alimentos"];

function agotado(p: Producto) {
  return p.track_stock && (p.stock_quantity ?? 0) <= 0;
}

export default function CatalogoAdminPage() {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [estado, setEstado] = useState<"todos" | "publicado" | "oculto" | "agotado">("todos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [confirmBorrar, setConfirmBorrar] = useState<{ id: string; name: string } | null>(null);
  const [confirmBorrarLote, setConfirmBorrarLote] = useState(false);

  async function load() {
    if (!supabase) return;
    setLoadError("");
    try {
      const { data, error } = await conTimeout(supabase.rpc("admin_catalogo_listar_productos"));
      if (error) throw error;
      setProductos((data as Producto[]) ?? []);
    } catch (err) {
      setLoadError(mensajeDeError(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(p: Producto) {
    if (!supabase) return;
    const next = p.admin_status === "publicado" ? "oculto" : "publicado";
    setProductos((current) => current?.map((x) => (x.product_id === p.product_id ? { ...x, admin_status: next } : x)) ?? current);
    const { error } = await supabase.rpc("admin_catalogo_actualizar_estado_producto", { p_product_id: p.product_id, p_status: next });
    if (error) setActionError(mensajeDeError(error));
    else load();
  }

  async function eliminar(id: string) {
    if (!supabase) return;
    setConfirmBorrar(null);
    const { error } = await supabase.rpc("admin_catalogo_eliminar_producto", { p_product_id: id });
    if (error) {
      setActionError(mensajeDeError(error));
      return;
    }
    setProductos((current) => current?.filter((x) => x.product_id !== id) ?? current);
    setSelected((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered(ids: string[], checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  async function bulkSetStatus(next: "publicado" | "oculto") {
    if (!supabase || selected.size === 0) return;
    const ids = Array.from(selected);
    setBulkWorking(true);
    setActionError("");
    const { error } = await supabase.rpc("admin_catalogo_actualizar_estado_productos_lote", { p_ids: ids, p_status: next });
    setBulkWorking(false);
    if (error) {
      setActionError(mensajeDeError(error));
      return;
    }
    setSelected(new Set());
    load();
  }

  async function bulkEliminar() {
    if (!supabase || selected.size === 0) return;
    setConfirmBorrarLote(false);
    const ids = Array.from(selected);
    setBulkWorking(true);
    setActionError("");
    const { error } = await supabase.rpc("admin_catalogo_eliminar_productos_lote", { p_ids: ids });
    setBulkWorking(false);
    if (error) {
      setActionError(mensajeDeError(error));
      return;
    }
    setProductos((current) => current?.filter((x) => !selected.has(x.product_id)) ?? current);
    setSelected(new Set());
  }

  const filtered = useMemo(() => {
    if (!productos) return [];
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const byCategoria = categoria === "Todas" || p.category === categoria;
      const byQuery = !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      const byEstado =
        estado === "todos" ||
        (estado === "agotado" ? agotado(p) : p.admin_status === estado && !agotado(p));
      return byCategoria && byQuery && byEstado;
    });
  }, [productos, query, categoria, estado]);

  if (productos === null && !loadError) {
    return (
      <main className="admin-page">
        <p>Cargando catálogo…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="admin-page">
        <LoadError que="los productos" detalle={loadError} onRetry={load} />
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">CUYANA</p>
          <h1>Catálogo</h1>
          <p>Productos propios (proveedor directo, precio y stock que tú controlas) — no las arroceras de Revolico, esas siguen en Abastecer.</p>
        </div>
        <div className="admin-catalogo-header-actions">
          <Link className="admin-btn-secondary" href="/admin/catalogo/nuevo?manual=1">
            + Añadir manualmente
          </Link>
          <Link className="admin-btn-primary" href="/admin/catalogo/nuevo">
            + Nuevo producto
          </Link>
        </div>
      </header>

      {actionError && <p className="admin-error">{actionError}</p>}

      <div className="admin-filter-row admin-catalogo-filters">
        <input
          className="admin-input"
          type="search"
          placeholder="Buscar por nombre o slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="admin-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c === "Todas" ? c : c[0].toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select className="admin-select" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
          <option value="todos">Todos los estados</option>
          <option value="publicado">Publicados</option>
          <option value="oculto">Ocultos</option>
          <option value="agotado">Agotados</option>
        </select>
      </div>

      <p className="admin-meta">{filtered.length} de {productos?.length ?? 0} productos</p>

      {selected.size > 0 && (
        <div className="admin-bulk-bar">
          <span>{selected.size} seleccionado{selected.size === 1 ? "" : "s"}</span>
          <div className="admin-bulk-bar-actions">
            <button type="button" className="admin-btn-secondary" onClick={() => bulkSetStatus("publicado")} disabled={bulkWorking}>
              Publicar
            </button>
            <button type="button" className="admin-btn-secondary" onClick={() => bulkSetStatus("oculto")} disabled={bulkWorking}>
              Ocultar
            </button>
            <button type="button" className="admin-bulk-delete" onClick={() => setConfirmBorrarLote(true)} disabled={bulkWorking}>
              Borrar
            </button>
            <button type="button" className="admin-bulk-cancel" onClick={() => setSelected(new Set())} disabled={bulkWorking}>
              Cancelar selección
            </button>
          </div>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-row admin-row-head admin-row-catalogo">
          <span>
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((p) => selected.has(p.product_id))}
              onChange={(e) => toggleSelectAllFiltered(filtered.map((p) => p.product_id), e.target.checked)}
              aria-label="Seleccionar todos los productos filtrados"
            />
          </span>
          <span>Producto</span>
          <span>Precio</span>
          <span>Stock</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        {filtered.map((p) => (
          <div className="admin-row admin-row-catalogo" key={p.product_id}>
            <span className="admin-cell">
              <input
                type="checkbox"
                checked={selected.has(p.product_id)}
                onChange={() => toggleSelected(p.product_id)}
                aria-label={`Seleccionar ${p.name}`}
              />
            </span>
            <span className="admin-cell admin-catalogo-product-cell">
              {p.image_url && <img className="admin-catalogo-thumb" src={p.image_url} alt="" loading="lazy" />}
              <span>
                <div>{p.name}</div>
                <small className="admin-mono">{p.slug}</small>
              </span>
            </span>
            <span className="admin-cell">
              <span className="admin-cell-label">Precio</span>
              {new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(p.price_usd)}
            </span>
            <span className="admin-cell">
              <span className="admin-cell-label">Stock</span>
              {p.track_stock ? (p.stock_quantity ?? 0) : "Sin control"}
            </span>
            <span className="admin-cell">
              <span className="admin-cell-label">Estado</span>
              <button type="button" className="admin-toggle" onClick={() => toggleStatus(p)} title="Pulsa para publicar/ocultar">
                {agotado(p) ? "Agotado" : p.admin_status === "publicado" ? "Publicado" : "Oculto"}
              </button>
            </span>
            <span className="admin-cell admin-catalogo-actions">
              <Link className="admin-text-link" href={`/admin/catalogo/nuevo?id=${p.product_id}`}>Editar</Link>
              <button type="button" className="admin-bulk-delete" onClick={() => setConfirmBorrar({ id: p.product_id, name: p.name })}>
                Borrar
              </button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div className="admin-empty-state">No hay productos que coincidan.</div>}
      </div>

      <ConfirmDialog
        open={Boolean(confirmBorrar)}
        title="Borrar producto"
        message={`¿Borrar "${confirmBorrar?.name}" de forma permanente? Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        onConfirm={() => confirmBorrar && eliminar(confirmBorrar.id)}
        onCancel={() => setConfirmBorrar(null)}
      />
      <ConfirmDialog
        open={confirmBorrarLote}
        title="Borrar productos seleccionados"
        message={`¿Borrar ${selected.size} producto(s) de forma permanente? Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        onConfirm={bulkEliminar}
        onCancel={() => setConfirmBorrarLote(false)}
      />
    </main>
  );
}
