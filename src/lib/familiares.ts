/**
 * Un familiar en Cuba: a quién se le entrega.
 *
 * El tipo vive aquí y no dentro de una pantalla porque lo usan tres: la que
 * los gestiona, el carrito que los ofrece para elegir, y mañana la calculadora
 * de remesas. Importar un tipo desde un `page.tsx` ata una pantalla a otra sin
 * que haga falta.
 */
export interface Familiar {
  id: string;
  full_name: string;
  phone: string | null;
  provincia: string;
  municipio: string | null;
  zona: string | null;
  direccion: string | null;
  referencia: string | null;
}

/** Las columnas que se piden, en un solo sitio para que no se desalineen. */
export const COLUMNAS_FAMILIAR =
  "id, full_name, phone, provincia, municipio, zona, direccion, referencia";
