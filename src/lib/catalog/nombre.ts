/**
 * Partir el nombre que viene de fuera en nombre corto + ficha técnica.
 *
 * Los productos de energía llegan en vivo del catálogo de NEXO y traen el
 * nombre con la ficha pegada detrás:
 *
 *     «EcoFlow DELTA 3 Ultra — Estación de Energía 3072Wh 4000W»
 *     «BLUETTI AC180 | 1152 Wh · 1800 W»
 *
 * En una tarjeta de móvil eso son tres o cuatro líneas y todas las tarjetas
 * acaban pareciendo la misma mancha de texto. Ese nombre no se puede cambiar
 * en origen —es de NEXO, no nuestro—, así que se parte al pintarlo.
 *
 * Aquí NO se inventa nada ni se reescribe ningún nombre: solo se elige qué
 * trozo del texto que ya existe va en cada sitio. Lo que se corta sigue
 * estando entero en la ficha del producto.
 */

/** Separadores que NEXO usa entre el modelo y su ficha. */
const SEPARADORES = [" — ", " – ", " | ", " — ", " - "];

/**
 * Cuántos caracteres caben en dos líneas de la tarjeta.
 *
 * Medido contra la columna real: a 14px, en la rejilla de dos columnas de un
 * teléfono de 375px, entran unos 16 caracteres por línea. 32 deja dos líneas
 * llenas. Sale de ahí y no de un número redondo: con este tope, «Panel solar
 * monocristalino 450W» (31) se queda tal cual, que es justo el ejemplo que
 * se dio por bueno.
 */
export const TOPE_NOMBRE = 32;

/** Corta por la última palabra entera que quepa, nunca a mitad de palabra. */
function cortarPorPalabra(texto: string, tope: number): string {
  if (texto.length <= tope) return texto;
  const recorte = texto.slice(0, tope);
  const ultimoEspacio = recorte.lastIndexOf(" ");
  // Sin espacios no hay por dónde cortar limpio: mejor una sola palabra larga
  // entera que una palabra partida que no se entiende.
  if (ultimoEspacio < tope * 0.5) return texto;
  return `${recorte.slice(0, ultimoEspacio).replace(/[,;:·\-–—]$/, "").trim()}…`;
}

export interface NombrePartido {
  /** Lo que va grande en la tarjeta. */
  nombre: string;
  /** La ficha que iba pegada al nombre, o null si no traía. */
  ficha: string | null;
}

export function partirNombre(nombreCompleto: string, tope = TOPE_NOMBRE): NombrePartido {
  const limpio = nombreCompleto.trim();

  for (const separador of SEPARADORES) {
    const corte = limpio.indexOf(separador);
    // `corte > 0` y no `>= 0`: un nombre que EMPIEZA por el separador no está
    // partido en dos, está mal escrito, y quedarnos con la parte vacía sería
    // dejar la tarjeta sin nombre.
    if (corte > 0) {
      const cabeza = limpio.slice(0, corte).trim();
      const cola = limpio.slice(corte + separador.length).trim();
      return { nombre: cortarPorPalabra(cabeza, tope), ficha: cola || null };
    }
  }

  return { nombre: cortarPorPalabra(limpio, tope), ficha: null };
}
