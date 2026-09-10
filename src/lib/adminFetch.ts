/**
 * Carga de datos del panel.
 *
 * El patrón anterior (`if (!supabase) return;` antes de setLoading, y la
 * consulta sin try/catch) dejaba la vista en "Cargando…" para siempre en
 * cuanto la promesa se rechazaba: fallo de red, CORS o cuelgue. Nunca hay que
 * mostrarle a nadie un spinner que no termina — o hay datos, o hay un error
 * con su motivo y un botón para reintentar.
 */

const TIMEOUT_MS = 8000;

/** Corta cualquier consulta que se quede colgada, para que el error sea visible. */
export function conTimeout<T>(consulta: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(consulta),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("La conexión tardó demasiado.")), ms)
    ),
  ]);
}

/**
 * Texto legible a partir de lo que sea que se haya lanzado. Quien usa este
 * panel administra un negocio, no depura JavaScript: "Failed to fetch" no le
 * dice qué hacer, "no hay conexión" sí.
 */
export function mensajeDeError(err: unknown) {
  let msg = "";
  if (err && typeof err === "object" && "message" in err) {
    msg = String((err as { message: unknown }).message);
  }
  if (!msg) return "Error desconocido.";
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return "No se pudo conectar con el servidor. Revisa tu conexión a internet.";
  }
  return msg;
}
