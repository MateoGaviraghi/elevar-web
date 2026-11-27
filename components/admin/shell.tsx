"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ApiError, olvidarTodo, panel, rutaDeIngreso, salir, yo } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";
import type { Yo } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Icono, useEscribirIcono } from "./iconos";
import { precargar } from "./lista/memoria";

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

const EVENTO_CONTADORES = "panel:contadores";
/** Pide que el menú vuelva a contar (después de marcar, contestar o dar acceso). */
export function avisarContadores() {
  window.dispatchEvent(new Event(EVENTO_CONTADORES));
}

const EVENTO_USUARIO = "panel:usuario";
/** Avisa al marco que cambió algo tuyo (el nombre, desde Mi cuenta) para que la barra lo muestre sin recargar. */
export function avisarUsuario(cambios: Partial<Yo>) {
  window.dispatchEvent(new CustomEvent<Partial<Yo>>(EVENTO_USUARIO, { detail: cambios }));
}

export function PanelShell({ children }: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    const cambiar = (e: Event) => {
      const cambios = (e as CustomEvent<Partial<Yo>>).detail;
      setEstado((s) => (s.tipo === "listo" ? { ...s, usuario: { ...s.usuario, ...cambios } } : s));
    };
    window.addEventListener(EVENTO_USUARIO, cambiar);
    return () => window.removeEventListener(EVENTO_USUARIO, cambiar);
  }, []);

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

  // Los contadores del menú: un pedido liviano al cambiar de pantalla y cada vez que una pantalla avisa que
  // cambió algo (`avisarContadores()`, p. ej. al dar acceso a una orden), sin esperar a navegar (2026-11-25).
  useEffect(() => {
    let vivo = true;
    const pedir = () => panel.contadores().then((d) => vivo && setCuentas(d)).catch(() => {});
    void pedir();
    window.addEventListener(EVENTO_CONTADORES, pedir);
    return () => { vivo = false; window.removeEventListener(EVENTO_CONTADORES, pedir); };
  }, [pathname]);

  useEffect(() => setAbierto(false), [pathname]);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await salir();
    } catch {
      // Aunque falle (p. ej. la sesión ya venció), se vuelve al ingreso.
    }
    // Lo que se vio en esta pestaña no queda en memoria después de salir.
    olvidarTodo();
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
      {/* «PANEL» y la raya se alinean con la palabra ELEVAR, no con el dibujo entero: la palabra ocupa del
          42 % al 84 % del alto del logo (`LOGO_WORD`), así que con 28 px va de 11,8 a 23,6 px (2026-11-26,
          Mateo: «en el navbar está mal centrado»). */}
      <Link href="/admin" className="mx-6 mt-6 flex h-7 items-start gap-2.5 self-start rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="ELEVAR, inicio del panel">
        <Logo wordColor={c.logo} className="h-7" />
        <span aria-hidden className={`mt-[11.8px] h-[11.8px] w-px ${oscura ? "bg-neutral-0/25" : "bg-neutral-200"}`} />
        <span className={`mt-[11.8px] font-sub text-[11px] font-semibold uppercase leading-[11.8px] tracking-[0.2em] ${c.titulo}`}>Panel</span>
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
                      onPointerEnter={(e) => { mover(e.currentTarget); escribir(e); precargar(item.href); }} onFocus={(e) => { mover(e.currentTarget); escribir(e); precargar(item.href); }} onBlur={volver}
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
        <MenuCuenta usuario={usuario} pathname={pathname} saliendo={saliendo} cerrarSesion={cerrarSesion} oscura={oscura} />
      </div>
    </nav>
  );
}

/**
 * El pie de la barra como entrada a la cuenta, como el `MenuCuenta` del portal CESS (su D-024 y D-035): tus
 * iniciales, tu nombre y tu correo. Al tocarlo se abre hacia arriba una tarjeta con «Mi cuenta» y «Salir»:
 * crece desde el pie en 0,3 s y sus filas caen una detrás de otra. ↑ ↓ recorren, Esc o tocar afuera cierran
 * y el foco vuelve al pie (2026-11-26, Mateo: «falta la cuenta como la que tiene el portal»).
 */
function MenuCuenta({ usuario, pathname, saliendo, cerrarSesion, oscura }: { usuario: Yo; pathname: string; saliendo: boolean; cerrarSesion: () => void; oscura: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const escribir = useEscribirIcono();
  const enCuenta = pathname.startsWith("/admin/cuenta");

  useEffect(() => setAbierto(false), [pathname]);

  useLayoutEffect(() => {
    const t = tarjeta.current;
    if (!abierto || !t) return;
    t.querySelector<HTMLElement>("[role='menuitem']")?.focus();
    if (prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(t, { opacity: 0, y: 10, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power3.out", transformOrigin: "bottom left", clearProps: "opacity,transform" })
      .fromTo(t.querySelectorAll("[role='menuitem']"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: "power2.out", clearProps: "opacity,transform" }, 0.06);
    return () => { tl.kill(); };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: PointerEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener("pointerdown", afuera);
    return () => document.removeEventListener("pointerdown", afuera);
  }, [abierto]);

  const cerrar = () => { setAbierto(false); boton.current?.focus(); };
  const teclas = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); cerrar(); return; }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const items = Array.from(tarjeta.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const sig = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[sig]?.focus();
  };

  const hover = oscura ? "[@media(hover:hover)]:hover:bg-neutral-0/10" : "[@media(hover:hover)]:hover:bg-neutral-50";
  const fila = "flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-900 outline-none focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:bg-neutral-50";
  return (
    <div ref={caja} className="relative" onKeyDown={teclas}>
      {abierto && (
        <div ref={tarjeta} role="menu" aria-label="Tu cuenta" className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-[14px] border border-neutral-200 bg-neutral-0 p-1.5 shadow-[0_12px_32px_-12px_rgb(11_30_51/0.35)]">
          <Link href="/admin/cuenta" role="menuitem" tabIndex={-1} aria-current={enCuenta ? "page" : undefined} onPointerEnter={escribir} onFocus={escribir} onClick={() => setAbierto(false)} className={fila}>
            <Icono nombre="persona" className="text-ink-700" />
            Mi cuenta
          </Link>
          <button type="button" role="menuitem" tabIndex={-1} disabled={saliendo} onPointerEnter={escribir} onFocus={escribir} onClick={cerrarSesion} className={`${fila} disabled:opacity-60`}>
            <Icono nombre="salir" className="text-ink-700" />
            {saliendo ? "Saliendo…" : "Salir"}
          </button>
        </div>
      )}
      <button ref={boton} type="button" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}
        aria-label={`Tu cuenta: ${usuario.nombre}`}
        className={`flex min-h-[52px] w-full items-center gap-3 rounded-[12px] px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${hover} ${abierto || enCuenta ? (oscura ? "bg-neutral-0/10" : "bg-neutral-50") : ""}`}>
        <Iniciales nombre={usuario.nombre} oscura={oscura} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-semibold ${oscura ? "text-neutral-0" : "text-ink-900"}`}>{saliendo ? "Saliendo…" : usuario.nombre}</span>
          <span className={`block truncate text-xs ${oscura ? "text-neutral-0/60" : "text-neutral-700"}`}>{usuario.correo}</span>
        </span>
        <Icono nombre="flechas" tam={16} className={oscura ? "text-neutral-0/60" : "text-neutral-700"} acento="currentColor" />
      </button>
    </div>
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
