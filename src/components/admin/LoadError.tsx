"use client";

/**
 * Lo que se muestra cuando una carga falla. Un panel que se queda en
 * "Cargando…" sin decir por qué es peor que uno que admite el error: al menos
 * así se sabe si hay que reintentar o llamar a alguien.
 */
export default function LoadError({ que, detalle, onRetry }: { que: string; detalle: string; onRetry: () => void }) {
  return (
    <div className="admin-load-error" role="alert">
      <p className="admin-load-error-title">No se pudieron cargar {que}.</p>
      <p className="admin-load-error-detail">{detalle}</p>
      <button className="admin-btn-secondary" onClick={onRetry} type="button">
        Reintentar
      </button>
    </div>
  );
}
