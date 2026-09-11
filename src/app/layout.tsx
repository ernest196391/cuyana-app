import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Tipografía de marca Cuyana: Playfair Display para títulos y logotipo,
// Inter para interfaz. Ver docs/DECISIONS.md.
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Monoespaciada usada solo para cifras (montos y tasas): dígitos de ancho
// fijo reducen errores de lectura en cantidades de dinero. No sustituye a
// Inter como fuente de interfaz.
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const TITLE = "Cuyana — Cerca de los tuyos. Remesas de Guyana a Cuba";
const DESCRIPTION =
  "Envía dinero, alimentos o energía para tu familia en Cuba desde Guyana, con el total claro antes de continuar.";

const SITE_URL = "https://cuyana.casavivadecuba.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s — Cuyana" },
  description: DESCRIPTION,
  applicationName: "Cuyana",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Cuyana",
    locale: "es",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7A0E2E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
