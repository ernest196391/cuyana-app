import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./curuguay.css";

// Tipografía de marca Cuyana: Playfair Display para títulos y logotipo,
// Inter para interfaz. Ver docs/DECISIONS.md.
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

const TITLE = "Curuguay — Remesas de Uruguay a Cuba";
const DESCRIPTION =
  "Calcula y solicita remesas desde Uruguay hacia Cuba con tasas claras, seguimiento y atención por WhatsApp.";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://curuguay.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s — Curuguay" },
  description: DESCRIPTION,
  applicationName: "Curuguay",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Curuguay",
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
  themeColor: "#0B2D5B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
