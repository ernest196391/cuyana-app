/**
 * Logotipo oficial de Curuguay. Los SVG son masters vectoriales cerrados.
 * Nunca recrear con formas propias: siempre este SVG, sin deformar. Se usa
 * <img> en vez de next/image porque es vectorial (no aplica optimización de
 * raster) — next/image sí se usa para las fotografías de campaña.
 */
export default function Logo({
  variant = "horizontal",
  height = 32,
}: {
  variant?: "horizontal" | "symbol" | "header";
  height?: number;
}) {
  if (variant === "symbol") {
    const width = height;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/curuguay/symbol.svg" alt="Curuguay" width={width} height={height} />
    );
  }
  if (variant === "header") {
    const width = Math.round(height * 4.23);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/curuguay/logo-primary.svg" alt="Curuguay" width={width} height={height} />
    );
  }
  const width = Math.round(height * 4.23);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/curuguay/logo-primary.svg"
      alt="Curuguay — Cerca, aunque estén lejos."
      width={width}
      height={height}
    />
  );
}
