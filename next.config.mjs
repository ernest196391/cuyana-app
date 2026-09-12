/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Imágenes del catálogo de Product Studio One / NEXO (algunas viven en
    // el dominio de la tienda NEXO, otras en el WordPress/media detrás).
    // Ver src/lib/catalog/nexoProducts.ts.
    remotePatterns: [
      { protocol: "https", hostname: "nexotienda.casavivadecuba.com" },
      { protocol: "https", hostname: "casavivadecuba.com" },
    ],
  },
};

export default nextConfig;
