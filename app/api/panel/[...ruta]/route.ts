/**
 * Puente del panel: reenvía /api/panel/<ruta> a Django (<PANEL_API_URL>/api/v1/panel/<ruta>/).
 *
 * Decisión 1 de docs/sistema-interno/10-PENDIENTES.md (2026-11-17). El puente NO decide nada de
 * seguridad: la sesión, el segundo factor y los permisos los controla Django en cada pedido.
 * - Reenvía solo a PANEL_API_URL (variable del servidor), nunca a una dirección del pedido.
 * - Solo pasan la cookie de sesión del panel y la del token CSRF; el resto de las cookies del
 *   sitio no salen hacia el backend.
 * - Devuelve la respuesta tal cual, incluidas sus Set-Cookie.
 */
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIES_PERMITIDAS = new Set(["__Host-elevar_panel", "elevar_panel", "csrftoken"]);
const ENCABEZADOS_PEDIDO = ["content-type", "accept", "x-csrftoken", "origin", "referer"];
const ENCABEZADOS_RESPUESTA = ["content-type", "content-disposition", "retry-after"];
const SEGMENTO_VALIDO = /^[a-z0-9][a-z0-9_-]*$/i;
const ESPERA_MS = 15_000;

function errorPuente(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

function cookiesFiltradas(encabezado: string | null): string {
  if (!encabezado) return "";
  return encabezado
    .split(";")
    .map((parte) => parte.trim())
    .filter((parte) => COOKIES_PERMITIDAS.has(parte.split("=", 1)[0]))
    .join("; ");
}

async function reenviar(request: NextRequest, ruta: string[]): Promise<NextResponse> {
  const base = process.env.PANEL_API_URL;
  if (!base) return errorPuente(503, "PUENTE_SIN_CONFIGURAR", "El panel no está disponible.");
  if (ruta.length === 0 || !ruta.every((s) => SEGMENTO_VALIDO.test(s))) {
    return errorPuente(404, "NOT_FOUND", "No existe.");
  }

  const destino = new URL(`/api/v1/panel/${ruta.join("/")}/`, base);
  destino.search = request.nextUrl.search;

  const encabezados = new Headers();
  for (const nombre of ENCABEZADOS_PEDIDO) {
    const valor = request.headers.get(nombre);
    if (valor) encabezados.set(nombre, valor);
  }
  const cookies = cookiesFiltradas(request.headers.get("cookie"));
  if (cookies) encabezados.set("cookie", cookies);

  const conCuerpo = !["GET", "HEAD"].includes(request.method);
  let respuesta: Response;
  try {
    respuesta = await fetch(destino, {
      method: request.method,
      headers: encabezados,
      body: conCuerpo ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(ESPERA_MS),
    });
  } catch {
    return errorPuente(502, "BACKEND_NO_DISPONIBLE", "No pudimos conectar. Reintentá.");
  }

  const salida = new Headers({ "Cache-Control": "no-store" });
  for (const nombre of ENCABEZADOS_RESPUESTA) {
    const valor = respuesta.headers.get(nombre);
    if (valor) salida.set(nombre, valor);
  }
  for (const cookie of respuesta.headers.getSetCookie()) salida.append("set-cookie", cookie);

  const cuerpo = respuesta.status === 204 ? null : await respuesta.arrayBuffer();
  return new NextResponse(cuerpo, { status: respuesta.status, headers: salida });
}

type Contexto = { params: Promise<{ ruta: string[] }> };

async function manejar(request: NextRequest, { params }: Contexto) {
  const { ruta } = await params;
  return reenviar(request, ruta);
}

export { manejar as GET, manejar as POST, manejar as PUT, manejar as PATCH, manejar as DELETE };
