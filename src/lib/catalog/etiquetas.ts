import type { CatalogCategory } from "./types";

/**
 * Cómo se llama cada categoría cuando se le enseña a una persona.
 *
 * Es un `Record<CatalogCategory, string>` y no un `if` ni un objeto suelto a
 * propósito: el día que se añada una cuarta categoría —ya pasó de dos a tres
 * en una tarde— esto deja de compilar hasta que alguien le ponga nombre. Un
 * ternario se habría quedado callado etiquetando la categoría nueva con el
 * nombre de otra, que es justo lo que pasó con «volver» cuando entraron los
 * electrodomésticos: una arrocera decía «Alimentos».
 */
export const CATEGORIA_ETIQUETA: Record<CatalogCategory, string> = {
  alimentos: "Alimentos",
  electrodomesticos: "Electrodomésticos",
  energia: "Energía",
};
