import tarifas from "./tarifasMensajeria.json";

/**
 * Mensajería de la tienda: a cuánto sale llevar un pedido a casa del familiar.
 *
 * La tabla viene de NEXO, que es donde está rodada de verdad, y cubre **solo
 * La Habana**: 15 municipios y sus barrios. Fuera de ahí no hay tarifa que
 * valga, y eso no se disimula — se dice.
 *
 * La regla que más importa está en `cotizar`: cuando no se reconoce la zona,
 * NO se inventa un precio. Se devuelve «a coordinar» y lo cuadra Adonys por
 * WhatsApp. Cobrarle a alguien una tarifa adivinada es peor que decirle que
 * todavía no se sabe.
 */

export const PROVINCIA = { codigo: "LH", nombre: "La Habana" } as const;

/** Sube cuando cambian las tarifas, para saber con cuál se cerró un pedido. */
export const VERSION_TARIFAS = "2026-09-12-nexo-v2";

export interface Tarifa {
  municipio: string;
  /** Barrio o reparto. Vacío = tarifa general del municipio. */
  zona: string;
  cup: number;
}

export type EstadoCotizacion = "zona" | "a-coordinar";

export interface Cotizacion {
  estado: EstadoCotizacion;
  /** Lo que se cobra. En «a-coordinar» es 0: todavía no se sabe. */
  cup: number;
  etiqueta: string;
  /** Solo en «a-coordinar»: la tarifa general del municipio, como orientación. */
  referenciaCup?: number;
  version: string;
}

const TARIFAS = tarifas as Tarifa[];

/** Sin tildes y en minúscula: la gente escribe «Plaza de la Revolucion». */
export function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

/** Los 15 municipios de La Habana que se cubren, en orden alfabético. */
export function municipios(): string[] {
  // `Array.from` y no `[...set]`: el proyecto compila a ES5 y ahí desparramar
  // un Set no está permitido.
  return Array.from(new Set(TARIFAS.map((t) => t.municipio))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

/** Los barrios de un municipio. Vacío si solo tiene tarifa general. */
export function zonasDe(municipio: string): string[] {
  const m = normalizar(municipio);
  return Array.from(
    new Set(TARIFAS.filter((t) => normalizar(t.municipio) === m && t.zona).map((t) => t.zona))
  ).sort((a, b) => a.localeCompare(b, "es"));
}

/** Todo lo que necesitan los desplegables del carrito, de una vez. */
export function catalogoDeEntrega() {
  const lista = municipios();
  const zonas: Record<string, string[]> = {};
  for (const m of lista) zonas[m] = zonasDe(m);
  return { provincia: PROVINCIA, municipios: lista, zonas, version: VERSION_TARIFAS };
}

export function municipioValido(valor: string) {
  const m = normalizar(valor);
  return TARIFAS.some((t) => normalizar(t.municipio) === m);
}

export function zonaValida(municipio: string, valor: string) {
  const m = normalizar(municipio);
  const z = normalizar(valor);
  return TARIFAS.some((t) => normalizar(t.municipio) === m && normalizar(t.zona) === z);
}

/**
 * Cuánto cuesta llevarlo. Primero busca el barrio exacto; si no lo reconoce,
 * devuelve «a coordinar» con la tarifa general del municipio como orientación,
 * que es mejor que un número inventado y mejor que nada.
 */
export function cotizar(municipio: string, zona: string): Cotizacion {
  const m = normalizar(municipio);
  const z = normalizar(zona);
  let general = 0;

  for (const t of TARIFAS) {
    if (normalizar(t.municipio) !== m) continue;
    if (!t.zona) {
      general = t.cup;
      continue;
    }
    if (z && normalizar(t.zona) === z) {
      return { estado: "zona", cup: t.cup, etiqueta: t.zona, version: VERSION_TARIFAS };
    }
  }

  return {
    estado: "a-coordinar",
    cup: 0,
    etiqueta: zona || municipio,
    ...(general > 0 ? { referenciaCup: general } : {}),
    version: VERSION_TARIFAS,
  };
}
