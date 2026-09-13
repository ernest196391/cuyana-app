import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lo que guarda esta prueba es la regla del encargo aplicada a los carnets:
 * toda revelación queda registrada. Si la bitácora no se puede escribir, no se
 * entrega el enlace. El orden importa —primero apuntar, luego firmar—; al
 * revés, un fallo al apuntar dejaría carnets vistos sin rastro de quién.
 */

type Fila = Record<string, unknown>;

let esAdmin: boolean | null = true;
let usuario: { email: string } | null = { email: "ernest196391@gmail.com" };
let documento: Fila | null = { id: "doc-1", ruta: "cli-1/carnet_frente" };
let bitacoraFalla = false;
let bitacora: Fila[] = [];
/** En qué orden pasaron las cosas de verdad. */
let pasos: string[] = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: usuario }, error: null }) },
    rpc: async () => ({ data: esAdmin, error: null }),
    from: (tabla: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: documento, error: documento ? null : { message: "no existe" } }),
        }),
      }),
      insert: async (fila: Fila) => {
        pasos.push(`apunta:${tabla}`);
        if (bitacoraFalla) return { error: { message: "sin permiso" } };
        bitacora.push(fila);
        return { error: null };
      },
    }),
    storage: {
      from: () => ({
        createSignedUrl: async (ruta: string, segundos: number) => {
          pasos.push("firma");
          return { data: { signedUrl: `https://x/${ruta}?exp=${segundos}` }, error: null };
        },
      }),
    },
  }),
}));

function pedir(cabeceras: Record<string, string>, cuerpo: unknown) {
  return new Request("http://localhost/api/admin/documento", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cabeceras },
    body: JSON.stringify(cuerpo),
  });
}
const CON_SESION = { authorization: "Bearer un-token" };

beforeEach(() => {
  esAdmin = true;
  usuario = { email: "ernest196391@gmail.com" };
  documento = { id: "doc-1", ruta: "cli-1/carnet_frente" };
  bitacoraFalla = false;
  bitacora = [];
  pasos = [];
});

describe("abrir el carnet de un cliente", () => {
  it("sin sesión no se abre nada", async () => {
    const { POST } = await import("./route");
    const r = await POST(pedir({}, { documentId: "doc-1" }));
    expect(r.status).toBe(401);
    expect(pasos).toEqual([]);
  });

  it("una cuenta que no administra no pasa, aunque tenga sesión", async () => {
    esAdmin = false;
    const { POST } = await import("./route");
    const r = await POST(pedir(CON_SESION, { documentId: "doc-1" }));
    expect(r.status).toBe(403);
    // Y no se firma nada: ni siquiera se llega a mirar el archivo.
    expect(pasos).toEqual([]);
  });

  it("deja escrito quién lo abrió, y ANTES de firmar el enlace", async () => {
    const { POST } = await import("./route");
    const r = await POST(pedir(CON_SESION, { documentId: "doc-1" }));
    expect(r.status).toBe(200);
    expect(pasos).toEqual(["apunta:document_views", "firma"]);
    expect(bitacora[0]).toMatchObject({
      document_id: "doc-1",
      visto_por: "ernest196391@gmail.com",
    });
  });

  it("si la bitácora no se puede escribir, no hay enlace", async () => {
    bitacoraFalla = true;
    const { POST } = await import("./route");
    const r = await POST(pedir(CON_SESION, { documentId: "doc-1" }));
    expect(r.status).toBe(500);
    // Lo que de verdad se comprueba: nunca se firmó. Un carnet no se enseña
    // sin poder decir después quién lo vio.
    expect(pasos).toEqual(["apunta:document_views"]);
    expect(await r.json()).not.toHaveProperty("url");
  });

  it("el enlace que devuelve es de vida corta", async () => {
    const { POST } = await import("./route");
    const r = await POST(pedir(CON_SESION, { documentId: "doc-1" }));
    const cuerpo = await r.json();
    expect(cuerpo.segundos).toBeLessThanOrEqual(60);
    expect(cuerpo.url).toContain("exp=60");
  });

  it("un documento que no existe no inventa nada", async () => {
    documento = null;
    const { POST } = await import("./route");
    const r = await POST(pedir(CON_SESION, { documentId: "doc-9" }));
    expect(r.status).toBe(404);
    expect(pasos).toEqual([]);
  });
});
