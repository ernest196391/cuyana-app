// Configuración de marca y navegación pública de Cuyana.
// No hardcodear estos valores en componentes: todo lo que sea copy de
// marca, navegación o contacto vive aquí para que un cambio no obligue a
// tocar JSX en varios archivos.

export const SITE_NAME = "Curuguay";
export const SITE_TAGLINE = "Cerca, aunque estén lejos.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://curuguay.vercel.app";

export const NAV_LINKS = [
  { href: "/enviar-dinero", label: "Enviar dinero" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#seguimiento", label: "Seguimiento" },
  { href: "/ayuda", label: "Ayuda" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Términos" },
  { href: "/ayuda", label: "Ayuda" },
] as const;

// Número de WhatsApp del negocio (formato internacional, sin + ni espacios).
// Mismo valor observado en la auditoría pública; puede sobreescribirse por
// entorno sin tocar código.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5354056173";

/**
 * Datos legales/comerciales que la auditoría marcó como faltantes
 * (razón social, dirección, licencia). No se inventan: quedan explícitos
 * como pendientes de configuración hasta que el negocio los confirme.
 */
export const LEGAL_INFO = {
  razonSocial: null as string | null,
  direccion: null as string | null,
  licencia: null as string | null,
  contactoEmail: null as string | null,
};
