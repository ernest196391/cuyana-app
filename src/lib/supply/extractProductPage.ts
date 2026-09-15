export interface ExtractedProductPage {
  price: number | null;
  available: boolean | null;
  currency: string | null;
}

/**
 * Sacar precio y existencia de la página de un proveedor.
 *
 * Se intentan varias formas, de la más fiable a la menos, y se para en la
 * primera que dé un número. El orden no es capricho: las tres primeras leen
 * datos que la tienda declara A PROPÓSITO para que los lean máquinas, así que
 * si están, son el precio de verdad. La última es adivinar mirando el texto, y
 * adivinar mal aquí significa publicar un precio equivocado y venderle a
 * alguien por debajo de lo que nos cuesta.
 *
 * Por qué hizo falta ampliarlo: el 15 de septiembre, de 16 páginas de alawao
 * que se abrieron sin problema, 10 no soltaron precio. No estaban rotas — es
 * que solo se sabía leer JSON-LD, y esas tiendas publican el precio de otra
 * manera. El motor las daba por ilegibles y las sacaba del escaparate.
 */

function nodosDeProducto(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(nodosDeProducto);
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  const propio = object["@type"] === "Product" ? [object] : [];
  return [...propio, ...nodosDeProducto(object["@graph"])];
}

/**
 * Un precio escrito para personas: «1.234,56», «1,234.56», «$27.95».
 *
 * La regla del último separador: el que esté más a la derecha con dos o menos
 * dígitos detrás es el decimal, y lo demás son miles. Así «1.234,56» y
 * «1,234.56» dan lo mismo, que es justo donde se equivoca un `Number()` a
 * secas — y equivocarse aquí es un factor de mil en el precio de venta.
 */
export function numeroDeTexto(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,]/g, "");
  if (!limpio) return null;
  const corte = Math.max(limpio.lastIndexOf(","), limpio.lastIndexOf("."));

  let normalizado: string;
  if (corte === -1) {
    normalizado = limpio;
  } else if (limpio.length - corte - 1 <= 2) {
    normalizado = `${limpio.slice(0, corte).replace(/[.,]/g, "")}.${limpio.slice(corte + 1)}`;
  } else {
    // Más de dos dígitos detrás del último separador: era separador de miles.
    normalizado = limpio.replace(/[.,]/g, "");
  }

  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const AGOTADO = /sin existencias|agotado|no disponible|sin stock|out of stock|sold ?out|unavailable/i;
const HAY = /hay existencias|en existencia|disponible|in ?stock|a[ñn]adir al carrito|add to cart|comprar ahora/i;

function existencia(html: string): boolean | null {
  if (AGOTADO.test(html)) return false;
  if (HAY.test(html)) return true;
  return null;
}

/** 1 · Lo que la tienda declara para máquinas. Lo más fiable que hay. */
function desdeJsonLd(html: string): ExtractedProductPage | null {
  const scripts = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
  for (const script of scripts) {
    try {
      for (const nodo of nodosDeProducto(JSON.parse(script[1].trim()))) {
        const bruto = Array.isArray(nodo.offers) ? nodo.offers[0] : nodo.offers;
        if (!bruto || typeof bruto !== "object") continue;
        const oferta = bruto as Record<string, unknown>;
        const precio = numeroDeTexto(String(oferta.price ?? oferta.lowPrice ?? ""));
        if (precio === null) continue;
        const disp = String(oferta.availability ?? "").toLowerCase();
        return {
          price: precio,
          available: disp ? !/outofstock|soldout|discontinued/.test(disp) : null,
          currency: typeof oferta.priceCurrency === "string" ? oferta.priceCurrency : null,
        };
      }
    } catch {
      /* JSON-LD de otro o mal formado: se prueba el siguiente. */
    }
  }
  return null;
}

/** 2 · Microdatos y etiquetas `meta`. También declarados a propósito. */
function desdeEtiquetas(html: string): ExtractedProductPage | null {
  const patrones = [
    /<meta[^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["']/i,
    /<[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
    /<[^>]+content=["']([^"']+)["'][^>]+itemprop=["']price["']/i,
  ];
  for (const patron of patrones) {
    const precio = numeroDeTexto(html.match(patron)?.[1] ?? "");
    if (precio !== null) {
      const moneda =
        html.match(
          /(?:product:price:currency|og:price:currency)["'][^>]+content=["']([A-Z]{3})["']|itemprop=["']priceCurrency["'][^>]+content=["']([A-Z]{3})["']/i,
        ) ?? [];
      return { price: precio, available: existencia(html), currency: moneda[1] ?? moneda[2] ?? null };
    }
  }
  return null;
}

/**
 * 3 · El precio dentro de un elemento que se llama «precio».
 *
 * Es lo que usan WooCommerce y casi cualquier tienda hecha con plantilla. Se
 * exige que la clase o el id digan «price» o «precio», y que el texto lleve
 * símbolo de moneda: buscar un `$` suelto por toda la página —que es lo que
 * se hacía antes— es peligroso, porque el primer dólar de una tienda suele
 * ser «envío gratis desde $50», y ese número acabaría siendo el precio.
 */
function desdeMarcadoDePrecio(html: string): ExtractedProductPage | null {
  const bloques = Array.from(
    html.matchAll(
      /<(?:span|p|div|bdi|ins|strong)[^>]*(?:class|id)=["'][^"']*(?:price|precio)[^"']*["'][^>]*>([\s\S]{0,200}?)<\/(?:span|p|div|bdi|ins|strong)>/gi,
    ),
  );
  for (const bloque of bloques) {
    const texto = bloque[1].replace(/<[^>]*>/g, " ");
    if (!/[$€]|\bUSD\b|\bCUP\b/i.test(texto)) continue;
    const precio = numeroDeTexto(texto);
    if (precio !== null) {
      return { price: precio, available: existencia(html), currency: /€/.test(texto) ? "EUR" : "USD" };
    }
  }
  return null;
}

/**
 * 4 · Último recurso: un importe con símbolo de moneda en el texto.
 *
 * Se queda por compatibilidad con páginas muy simples, pero es el que más se
 * puede equivocar. Por eso el motor trata «sin precio» como motivo para
 * bloquear: mejor no vender que vender a un número adivinado.
 */
function desdeTextoSuelto(html: string): ExtractedProductPage {
  const sinMarcado = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
  const m = sinMarcado.match(/(?:\$\s*([\d.,]+)|([\d.,]+)\s*(?:\$|USD))/);
  const precio = numeroDeTexto(m?.[1] ?? m?.[2] ?? "");
  return { price: precio, available: existencia(html), currency: precio !== null ? "USD" : null };
}

export function extractProductPage(html: string): ExtractedProductPage {
  return desdeJsonLd(html) ?? desdeEtiquetas(html) ?? desdeMarcadoDePrecio(html) ?? desdeTextoSuelto(html);
}
