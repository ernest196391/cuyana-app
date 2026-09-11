import { WHATSAPP_NUMBER } from "@/lib/config/site";

export default function CatalogEmptyState({ categoria }: { categoria: string }) {
  const mensaje = encodeURIComponent(
    `Hola, quiero preguntar por ${categoria} para mi familia en Cuba.`
  );
  return (
    <div className="catalog-empty">
      <h2>Catálogo en preparación</h2>
      <p>
        Todavía estamos conectando el catálogo de {categoria}. Escríbenos por WhatsApp y te
        contamos qué hay disponible hoy.
      </p>
      <a className="cta cta-secondary" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`} target="_blank" rel="noopener">
        Preguntar por WhatsApp
      </a>
    </div>
  );
}
