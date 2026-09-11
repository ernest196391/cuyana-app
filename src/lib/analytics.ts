"use client";

// Instrumentación mínima del embudo (auditoría P1-5: "no se detectó
// instrumentación pública del embudo"). No es un proveedor: es una capa de
// degradación elegante. Si no hay un proveedor de analítica configurado
// (gtag/plausible en window), track() no hace nada en producción — nunca
// se manda un evento a un endpoint propio sin consentimiento/proveedor
// aprobado. Nunca pasar PII (nombre, teléfono) como propiedad de evento.

type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: EventProps }) => void;
  }
}

export function track(event: string, props?: EventProps) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.plausible === "function") {
      window.plausible(event, props ? { props } : undefined);
      return;
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", event, props);
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics:sin proveedor]", event, props ?? {});
    }
  } catch {
    // La analítica nunca debe romper la experiencia del usuario.
  }
}

// Eventos del embudo Cuyana (auditoría 2026-09-11). Nombres estables para
// que un proveedor futuro (Plausible/GA4) no requiera tocar componentes.
export const ANALYTICS_EVENTS = {
  needSelected: "need_selected", // dinero | alimentos | energia
  remesaMethodSelected: "remesa_method_selected",
  remesaWhatsappClick: "remesa_whatsapp_click",
  storeAddToCart: "store_add_to_cart",
  storeCheckoutRequested: "store_checkout_requested",
} as const;
