import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * El alias `@/` es el que usa Next en todo el proyecto (tsconfig → paths).
 * Vitest no lo hereda, así que hasta ahora solo se podían probar archivos que
 * importaran por ruta relativa. Con esto también se pueden probar las rutas de
 * API y los componentes, que sí lo usan.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
