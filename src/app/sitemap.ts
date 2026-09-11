import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/site";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/enviar-dinero", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/tienda", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/tienda/alimentos", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/tienda/energia", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/ayuda", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contacto", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/privacidad", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terminos", priority: 0.2, changeFrequency: "yearly" as const },
];

// Los productos individuales (/producto/[slug]) se suman aquí en cuanto el
// adaptador de catálogo esté configurado de verdad (ver src/lib/catalog):
// mientras tanto no hay URLs de producto reales que listar.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
