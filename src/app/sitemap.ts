import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/site";

const ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/envio/consultar", priority: 0.8, changeFrequency: "daily" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
