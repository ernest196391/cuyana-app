/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Imágenes del catálogo de Product Studio One / NEXO y fuentes verificadas
    // de CUYANA Market. Las URLs de proveedor no se enseñan al cliente; aquí
    // solo se permite cargar la imagen pública del producto.
    remotePatterns: [
      { protocol: "https", hostname: "nexotienda.casavivadecuba.com" },
      { protocol: "https", hostname: "casavivadecuba.com" },
      { protocol: "https", hostname: "img1.elyerromenu.com" },
      { protocol: "https", hostname: "pic.revolico.com" },
      { protocol: "https", hostname: "pub-768195fefb80411aa63fe4f44e4bee7b.r2.dev" },
    ],
  },
};

export default nextConfig;
