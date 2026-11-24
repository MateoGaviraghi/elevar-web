"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ApiError, panel, rutaDeIngreso, salir, yo } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";
import type { Yo } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Icono, useEscribirIcono } from "./iconos";

/**
 * Estructura del panel: el marco (menú por tarea, logo, cuenta y «Salir») alrededor de cada pantalla.
 * Pide yo/ para saber quién es. El control de acceso lo hace Django en cada pedido: esto solo
 * decide qué mostrar y adónde llevar cuando la API dice 401 o 403.
 *
 * Marco elegido el 2026-11-24 (versión A): barra azul tinta con el menú por tarea, el contador al lado de
 * lo que espera y la cuenta abajo. Siempre en azul («te olvidás del azul»). Sin cabecera
 * arriba en escritorio (método del portal CESS, 02 B2): logo y cuenta van dentro de la barra.
 */

interface ItemMenu {
  href: string;
  texto: string;
  icono: string;
  cuenta?: "consultas" | "ordenes";
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

// Agrupado por tarea (06-DISENO, «Menú»). El control de acceso lo hace la API, no el menú.
const MENU: GrupoMenu[] = [
  {
    titulo: "Atender",
    items: [
      { href: "/admin", texto: "Inicio", icono: "inicio" },
      { href: "/admin/consultas", texto: "Consultas", icono: "consultas", cuenta: "consultas" },
      { href: "/admin/ordenes", texto: "Órdenes", icono: "ordenes", cuenta: "ordenes" },
      { href: "/admin/inscripciones", texto: "Inscripciones", icono: "inscripciones" },
    ],
  },
  { titulo: "Catálogo", items: [{ href: "/admin/cursos", texto: "Cursos", icono: "cursos" }] },
  { titulo: "Administración", items: [{ href: "/admin/auditoria", texto: "Auditoría", icono: "auditoria" }] },
];

const UsuarioContexto = createContext<Yo | null>(null);

export function useUsuario(): Yo {
  const usuario = useContext(UsuarioContexto);
  if (!usuario) throw new Error("useUsuario va dentro de PanelShell");
  return usuario;
}

type Estado = { tipo: "cargando" } | { tipo: "listo"; usuario: Yo } | { tipo: "error"; mensaje: string };
type Cuentas = Partial<Record<"consultas" | "ordenes", number>>;

export function PanelShell({ children }: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  const cargar = useCallback(async () => {
    setEstado({ tipo: "cargando" });
    try {
      const usuario = await yo();
      if (!usuario.segundo_factor_listo) {
        router.replace("/admin/primer-ingreso");
        return;
      }
      setEstado({ tipo: "listo", usuario });
    } catch (error) {
      if (error instanceof ApiError && error.sinSesion) {
        router.replace(rutaDeIngreso(pathname));
        return;
      }
      if (error instanceof ApiError && error.code === "FALTA_SEGUNDO_FACTOR") {
        router.replace("/admin/primer-ingreso");
        return;
      }
      setEstado({ tipo: "error", mensaje: textoDeError(error instanceof ApiError ? error.code : undefined) });
    }
  }, [pathname, router]);

  useEffect(() => {
    void cargar();
    // Solo al montar: cada pantalla maneja sus propios 401.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo === "cargando") {
    return (
      <div className="min-h-screen bg-ink-50 lg:pl-64" aria-busy="true">
        <div className="fixed inset-y-0 left-0 hidden w-64 bg-ink-900 lg:block" />
        <div className="h-14 bg-ink-900 lg:hidden" />
        <div className="space-y-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 rounded-[8px] bg-neutral-200" />
          <div className="h-4 w-64 rounded-[8px] bg-neutral-200" />
        </div>
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  if (estado.tipo === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="max-w-sm rounded-[20px] border border-neutral-200 bg-neutral-0 p-6 text-center">
          <p role="alert" className="text-sm text-neutral-900">{estado.mensaje}</p>
          <button
            type="button"
            onClick={() => void cargar()}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <UsuarioContexto.Provider value={estado.usuario}>
      <Marco usuario={estado.usuario}>{children}</Marco>
    </UsuarioContexto.Provider>
  );
}

function Marco({ usuario, children }: { usuario: Yo; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [cuentas, setCuentas] = useState<Cuentas>({});
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  // Los contadores del menú salen del Inicio, una vez por pantalla (TD: un pedido propio más liviano).
  useEffect(() => {
    let vivo = true;
    panel.inicio().then((d) => vivo && setCuentas({ consultas: d.consultas_nuevas, ordenes: d.ordenes_sin_cumplir })).catch(() => {});
    return () => { vivo = false; };
  }, [pathname]);

  useEffect(() => setAbierto(false), [pathname]);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await salir();
    } catch {
      // Aunque falle (p. ej. la sesión ya venció), se vuelve al ingreso.
    }
    // push y no replace: «atrás» vuelve a una página del panel, que le pregunta a Django y,
    // sin sesión, lleva de nuevo al ingreso (09-ETAPAS, etapa 2).
    router.push("/admin/ingresar");
  }

  const props = { usuario, cuentas, pathname, saliendo, cerrarSesion };
  return (
    <div className="min-h-screen bg-ink-50 lg:pl-64">
      {/* Celular y tablet: una barra fina arriba y el menú entra desde la izquierda. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 bg-ink-900 px-3 text-neutral-0 lg:hidden">
        <button type="button" aria-expanded={abierto} aria-controls="menu-panel" onClick={() => setAbierto(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-neutral-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <span className="sr-only">Abrir el menú</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" /></svg>
        </button>
        <Link href="/admin" className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="ELEVAR, inicio del panel">
          <Logo wordColor="#FFFFFF" className="h-6" />
        </Link>
        <Iniciales nombre={usuario.nombre} oscura />
      </header>
      <Cajon abierto={abierto} cerrar={() => setAbierto(false)}>
        <BarraCompleta {...props} oscura />
      </Cajon>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <BarraCompleta {...props} oscura />
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

interface BarraProps {
  usuario: Yo;
  cuentas: Cuentas;
  pathname: string;
  saliendo: boolean;
  cerrarSesion: () => void;
}

const esActivo = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

/**
 * Barra completa: grupos por tarea, contador al lado de lo que espera, un resaltado
 * que se desliza a la opción bajo el mouse y vuelve a la actual (0,35 s).
 */
function BarraCompleta({ usuario, cuentas, pathname, saliendo, cerrarSesion, oscura }: BarraProps & { oscura: boolean }) {
  const lista = useRef<HTMLDivElement>(null);
  const resalte = useRef<HTMLSpanElement>(null);
  const escribir = useEscribirIcono();

  const mover = useCallback((el: Element | null, inmediato = false) => {
    const r = resalte.current, cont = lista.current;
    if (!r || !cont || !el) return;
    const a = (el as HTMLElement).getBoundingClientRect(), b = cont.getBoundingClientRect();
    const destino = { y: a.top - b.top, height: a.height, opacity: 1 };
    if (inmediato || prefersReducedMotion()) gsap.set(r, destino);
    else gsap.to(r, { ...destino, duration: 0.35, ease: "power3.out", overwrite: "auto" });
  }, []);
  const volver = useCallback(() => mover(lista.current?.querySelector("[aria-current='page']") ?? null), [mover]);
  useLayoutEffect(() => { mover(lista.current?.querySelector("[aria-current='page']") ?? null, true); }, [pathname, mover]);

  const c = oscura
    ? { fondo: "bg-ink-900 text-neutral-0", borde: "border-neutral-0/10", titulo: "text-neutral-0/55", item: "text-neutral-0/80", activo: "text-neutral-0", resalte: "bg-neutral-0/10", cuenta: "bg-brand-500 text-neutral-0", logo: "#FFFFFF" }
    : { fondo: "bg-neutral-0 text-ink-900 border-r border-neutral-200", borde: "border-neutral-200", titulo: "text-neutral-700", item: "text-neutral-700", activo: "text-ink-900", resalte: "bg-neutral-50 ring-1 ring-neutral-200", cuenta: "bg-brand-50 text-brand-700", logo: "#0B1E33" };

  return (
    <nav id="menu-panel" aria-label="Menú del panel" className={`flex h-full w-64 flex-col ${c.fondo}`}>
      <Link href="/admin" className="mx-5 mt-6 flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="ELEVAR, inicio del panel">
        <Logo wordColor={c.logo} className="h-7" />
        <span className={`border-l pl-2 font-sub text-xs font-semibold uppercase tracking-widest ${c.borde} ${c.titulo}`}>Panel</span>
      </Link>

      <div ref={lista} className="relative mt-6 flex-1 overflow-y-auto px-3" onPointerLeave={volver}>
        <span ref={resalte} aria-hidden className={`pointer-events-none absolute inset-x-3 top-0 rounded-[12px] opacity-0 ${c.resalte}`} />
        {MENU.map((grupo) => (
          <div key={grupo.titulo} className="mb-4">
            <p className={`px-3 pb-1 font-sub text-[11px] font-semibold uppercase tracking-wider ${c.titulo}`}>{grupo.titulo}</p>
            <ul>
              {grupo.items.map((item) => {
                const activo = esActivo(item.href, pathname);
                const n = item.cuenta ? cuentas[item.cuenta] : undefined;
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={activo ? "page" : undefined}
                      onPointerEnter={(e) => { mover(e.currentTarget); escribir(e); }} onFocus={(e) => { mover(e.currentTarget); escribir(e); }} onBlur={volver}
                      className={`relative flex min-h-[44px] items-center gap-3 rounded-[12px] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${activo ? `font-semibold ${c.activo}` : c.item}`}>
                      {activo && <span aria-hidden className="absolute -left-3 top-2.5 h-6 w-1 rounded-r-full bg-brand-500" />}
                      <Icono nombre={item.icono} />
                      <span className="flex-1">{item.texto}</span>
                      {n ? <span className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${c.cuenta}`} aria-label={`${n} sin atender`}>{n}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className={`border-t p-3 ${c.borde}`}>
        <Link href="/admin/cuenta" aria-current={pathname.startsWith("/admin/cuenta") ? "page" : undefined}
          className={`flex min-h-[48px] items-center gap-3 rounded-[12px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${oscura ? "[@media(hover:hover)]:hover:bg-neutral-0/10" : "[@media(hover:hover)]:hover:bg-neutral-50"}`}>
          <Iniciales nombre={usuario.nombre} oscura={oscura} />
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-semibold ${c.activo}`}>{usuario.nombre}</span>
            <span className={`block text-xs ${c.titulo}`}>Mi cuenta</span>
          </span>
        </Link>
        <button type="button" onClick={cerrarSesion} disabled={saliendo} onPointerEnter={escribir}
          className={`mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-[12px] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60 ${c.item} ${oscura ? "[@media(hover:hover)]:hover:bg-neutral-0/10" : "[@media(hover:hover)]:hover:bg-neutral-50"}`}>
          <Icono nombre="salir" />
          {saliendo ? "Saliendo…" : "Salir"}
        </button>
      </div>
    </nav>
  );
}

/** El menú del celular: entra desde la izquierda (0,35 s) sobre un fondo que se oscurece; Esc o tocar afuera lo cierran. */
function Cajon({ abierto, cerrar, children }: { abierto: boolean; cerrar: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const fondo = useRef<HTMLDivElement>(null);
  const [montado, setMontado] = useState(false);
  useEffect(() => { if (abierto) setMontado(true); }, [abierto]);
  useGSAP(() => {
    if (!montado || !panelRef.current || !fondo.current) return;
    const quieto = prefersReducedMotion();
    if (abierto) {
      gsap.fromTo(panelRef.current, { xPercent: -100 }, { xPercent: 0, duration: quieto ? 0 : 0.35, ease: "power3.out" });
      gsap.fromTo(fondo.current, { opacity: 0 }, { opacity: 1, duration: quieto ? 0 : 0.25 });
      panelRef.current.querySelector<HTMLElement>("a,button")?.focus();
    } else {
      gsap.to(panelRef.current, { xPercent: -100, duration: quieto ? 0 : 0.25, ease: "power2.in" });
      gsap.to(fondo.current, { opacity: 0, duration: quieto ? 0 : 0.25, onComplete: () => setMontado(false) });
    }
  }, { dependencies: [abierto, montado] });
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto, cerrar]);
  if (!montado) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
      <div ref={fondo} className="absolute inset-0 bg-ink-900/50" onClick={cerrar} />
      <div ref={panelRef} className="absolute inset-y-0 left-0 shadow-lg">{children}</div>
    </div>
  );
}

function Iniciales({ nombre, oscura = false }: { nombre: string; oscura?: boolean }) {
  const ini = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  return (
    <span aria-hidden className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${oscura ? "bg-brand-500 text-neutral-0" : "bg-ink-900 text-neutral-0"}`}>
      {ini || "·"}
    </span>
  );
}

export interface PanelShellProps {
  children: ReactNode;
}
