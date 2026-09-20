import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/site";
import { marketSupabase } from "@/lib/catalog/marketSupabase";
import { getCatalogProvider } from "@/lib/catalog";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/enviar-dinero", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/tienda", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/tienda/alimentos", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/tienda/electrodomesticos", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/tienda/energia", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/ayuda", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contacto", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/privacidad", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terminos", priority: 0.2, changeFrequency: "yearly" as const },
];

// Los productos individuales (/producto/[slug]) se suman aquí en cuanto el
// adaptador de catálogo esté configurado de verdad (ver src/lib/catalog):
// mientras tanto no hay URLs de producto reales que listar.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const { data } = await marketSupabase
    .from("market_public_catalog")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  const marketRoutes: MetadataRoute.Sitemap = (data ?? []).map((product) => ({
    url: `${SITE_URL}/producto/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const provider = getCatalogProvider();
  const [energia, electrodomesticos] = await Promise.all([
    provider.listByCategory("energia"),
    provider.listByCategory("electrodomesticos"),
  ]);
  const marketSlugs = new Set((data ?? []).map((product) => product.slug));
  const externalRoutes: MetadataRoute.Sitemap = [...energia.products, ...electrodomesticos.products]
    .filter((product) => !marketSlugs.has(product.slug))
    .map((product) => ({
      url: `${SITE_URL}/producto/${product.slug}`,
      lastModified: new Date(product.syncedAt),
      changeFrequency: "daily",
      priority: 0.7,
    }));

  return [...staticRoutes, ...marketRoutes, ...externalRoutes];
}
