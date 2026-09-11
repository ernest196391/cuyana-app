import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuyana — Cerca de los tuyos.",
    short_name: "Cuyana",
    description: "Envía dinero, alimentos o energía para tu familia en Cuba desde Guyana.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F4ED",
    theme_color: "#7A0E2E",
    lang: "es",
    icons: [
      { src: "/brand/cuyana/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/cuyana/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
