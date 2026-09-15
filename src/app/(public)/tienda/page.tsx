import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Elige alimentos, electrodomésticos o energía para enviar a tu familia en Cuba.",
  alternates: { canonical: "/tienda" },
};

/**
 * La puerta de la tienda.
 *
 * Antes era un título de catálogo («Tienda Cuyana») y tres botones de texto.
 * Un botón con una etiqueta dentro no le dice a nadie qué va a encontrar
 * detrás; una foto sí. Y el título dejó de nombrar la sección para hacer la
 * pregunta que la persona ya trae en la cabeza cuando llega hasta aquí.
 *
 * La cobertura se sigue diciendo en la puerta y no al final del carrito:
 * enterarse de que no llega a tu provincia después de haberlo elegido todo es
 * la peor forma de enterarse. Ojo, esto vale solo para la TIENDA — las remesas
 * sí llegan a toda Cuba, y las dos coberturas no se mezclan.
 *
 * `encaje` existe porque las tres fotos no son de la misma especie. Alimentos
 * y Energía tienen foto de campaña —una escena, que se recorta sin problema—.
 * Electrodomésticos todavía no: lo único real que hay es la foto de producto
 * de una arrocera sobre fondo blanco, y recortarla le cortaría el aparato.
 * Se encaja entera. PENDIENTE: esa categoría necesita su propia foto de
 * campaña, y eso lo tiene que traer una persona.
 */
const CAMINOS = [
  {
    href: "/tienda/alimentos",
    titulo: "Alimentos",
    linea: "Llena su despensa esta semana.",
    foto: "/brand/cuyana/campaign/cuyana-familia-comida.webp",
    alt: "Una familia cubana comiendo junta en casa",
    encaje: "cubrir" as const,
  },
  {
    href: "/tienda/electrodomesticos",
    titulo: "Electrodomésticos",
    linea: "Equipos prácticos para resolver en casa.",
    foto: "/catalog/electrodomesticos/arrocera-desmatt-kec-118-18l/hero.svg",
    alt: "Arrocera eléctrica",
    encaje: "encajar" as const,
  },
  {
    href: "/tienda/energia",
    titulo: "Energía",
    linea: "Soluciones de energía para el hogar.",
    foto: "/brand/cuyana/campaign/cuyana-energia-solar-hero.webp",
    alt: "Paneles solares instalados en una vivienda",
    encaje: "cubrir" as const,
  },
];

export default function TiendaPage() {
  return (
    <div className="wrap page-section">
      <h1 className="page-title page-title-centrado puerta-pregunta">
        ¿Qué quieres enviar a tu familia en Cuba?
      </h1>

      <div className="puerta-grid">
        {CAMINOS.map((camino) => (
          <Link key={camino.href} href={camino.href} className="puerta-card">
            <span className={`puerta-foto puerta-foto-${camino.encaje}`}>
              <Image
                src={camino.foto}
                alt={camino.alt}
                fill
                sizes="(max-width: 720px) 100vw, 340px"
              />
            </span>
            <span className="puerta-titulo">{camino.titulo}</span>
            <span className="puerta-linea">{camino.linea}</span>
          </Link>
        ))}
      </div>

      <p className="puerta-cobertura">Entregamos en La Habana.</p>
    </div>
  );
}
