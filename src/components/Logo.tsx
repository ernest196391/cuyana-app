/**
 * Logotipo oficial de Cuyana (assets/brand del paquete de marca corregido).
 * Nunca recrear con formas propias: siempre este SVG, sin deformar. Se usa
 * <img> en vez de next/image porque es vectorial (no aplica optimización de
 * raster) — next/image sí se usa para las fotografías de campaña.
 */
export default function Logo({
  variant = "horizontal",
  height = 32,
}: {
  variant?: "horizontal" | "symbol";
  height?: number;
}) {
  if (variant === "symbol") {
    const width = Math.round((height * 256) / 192);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/cuyana/cuyana-symbol.svg" alt="Cuyana" width={width} height={height} />
    );
  }
  const width = Math.round((height * 720) / 220);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/cuyana/cuyana-logo-horizontal.svg"
      alt="Cuyana — Cerca de los tuyos."
      width={width}
      height={height}
    />
  );
}
