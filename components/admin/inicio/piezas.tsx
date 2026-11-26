"use client";

import Link from "next/link";
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { fechaDeHoy, ORIGEN_CONSULTA, plata } from "@/lib/admin/formato";
import type { Inicio } from "@/lib/admin/tipos";
import { pegar, sinViuda } from "@/lib/texto";
import { Icono } from "../iconos";
import { diaCorto, mesLargo, numero } from "./graficos";

/**
 * Piezas del Inicio (2026-11-24). Tres colores con trabajo propio: blanco para leer, azul tinta para el
 * contexto y los números, naranja para lo que espera. Tres fuentes: DM Sans en títulos, Space Grotesk
 * (`font-sub`) en etiquetas, cifras y botones, Inter en el texto.
 * Compactas (tercera pasada, «los componentes son tan grandes que arrancás y no ves ninguno»): cada vista
 * del Inicio entra en una pantalla. El «para qué sirve» va en el ícono de información; a la vista quedan la
 * etiqueta, la pregunta, el gráfico, la conclusión y la acción.
 */

export type Tono = "blanco" | "azul" | "naranja";

/** En una computadora con pantalla baja (menos de 780 px de alto) se esconde lo que repite otra cosa. */
export const SI_ALCANZA = "[@media(min-width:1024px)_and_(max-height:780px)]:hidden";
const TonoContexto = createContext<Tono>("blanco");
export const useTono = () => useContext(TonoContexto);

const FONDO: Record<Tono, string> = {
  blanco: "border border-ink-100 bg-neutral-0 text-ink-900",
  azul: "bg-ink-900 text-neutral-0",
  naranja: "bg-gradient-to-br from-brand-500 to-brand-600 text-neutral-0",
};

export function Tarjeta({ children, className = "", as: Etiqueta = "section", tono = "blanco", ...resto }: TarjetaProps) {
  return (
    <TonoContexto.Provider value={tono}>
      <Etiqueta {...resto} data-tarjeta="" className={`relative flex min-h-0 flex-col gap-3 rounded-[18px] p-4 ${FONDO[tono]} ${className}`}>
        {children}
      </Etiqueta>
    </TonoContexto.Provider>
  );
}

interface TarjetaProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  tono?: Tono;
}

/** Tinta suave del texto secundario según el fondo. */
export const suave = (t: Tono) => (t === "blanco" ? "text-neutral-700" : t === "azul" ? "text-neutral-0/75" : "text-neutral-0/90");

/** El ícono propio de cada tarjeta en un cuadro que contrasta con el fondo; se dibuja al entrar (0,6 s). */
function CajaIcono({ icono }: { icono: string }) {
  const t = useTono();
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const trazos = ref.current?.querySelectorAll("path");
    if (!trazos?.length || prefersReducedMotion()) return;
    gsap.fromTo(trazos, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out", stagger: 0.12, delay: 0.15, autoRound: false });
  }, { scope: ref });
  const caja = t === "blanco" ? "bg-ink-900 text-neutral-0" : t === "azul" ? "bg-brand-500 text-neutral-0" : "bg-neutral-0 text-ink-900";
  const acento = t === "blanco" ? "#F37040" : t === "azul" ? "#0B1E33" : "#E94E1B";
  return (
    <span ref={ref} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] shadow-sm ${caja}`}>
      <Icono nombre={icono} className="h-5 w-5" acento={acento} grosor={2} />
    </span>
  );
}

/** «¿Para qué sirve?»: un ícono que muestra la explicación al pasar el mouse, al enfocarlo o al tocarlo. */
export function Info({ texto }: { texto: string }) {
  const t = useTono();
  return (
    <span className="group/info relative shrink-0">
      <button type="button" aria-label={`Para qué sirve: ${texto}`}
        className={`grid h-7 w-7 place-items-center rounded-full font-sub text-xs font-bold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 ${t === "blanco" ? "bg-ink-50 text-ink-500 [@media(hover:hover)]:hover:bg-ink-100" : "bg-neutral-0/10 text-neutral-0/80 [@media(hover:hover)]:hover:bg-neutral-0/20"}`}>
        ?
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-64 rounded-[12px] bg-ink-900 p-3 text-xs leading-relaxed text-neutral-0 shadow-lg ring-1 ring-neutral-0/10 group-focus-within/info:block [@media(hover:hover)]:group-hover/info:block">
        {pegar(texto)}
      </span>
    </span>
  );
}

/** Encabezado en una línea: ícono, etiqueta y la pregunta; a la derecha, el «para qué sirve» y una acción. */
export function Encabezado({ icono, etiqueta, titulo, paraQue, id, extra, chico = false }: EncabezadoProps) {
  const t = useTono();
  const texto = t === "blanco" ? "text-ink-500" : t === "azul" ? "text-neutral-0/70" : "text-neutral-0/85";
  return (
    <header className="flex items-start gap-3">
      <CajaIcono icono={icono} />
      <div className="min-w-0 flex-1">
        <p className={`font-sub text-[11px] font-semibold uppercase tracking-wider ${texto}`}>{etiqueta}</p>
        <h2 id={id} className={`font-display font-semibold leading-snug tracking-tight ${chico ? "text-sm" : "text-base"}`}>{sinViuda(titulo)}</h2>
      </div>
      {/* En el celular el enlace del encabezado no entra al lado de la pregunta: queda el menú. */}
      {extra && <span className="hidden shrink-0 sm:inline-flex">{extra}</span>}
      {paraQue && <Info texto={paraQue} />}
    </header>
  );
}

interface EncabezadoProps {
  icono: string;
  etiqueta: string;
  titulo: string;
  paraQue?: string;
  id?: string;
  extra?: ReactNode;
  chico?: boolean;
}

/**
 * El lugar del gráfico: ocupa lo que le queda a la tarjeta y le pasa ese alto al gráfico. En el celular,
 * donde las tarjetas se apilan, usa el mínimo.
 */
export function Lienzo({ min = 110, children }: { min?: number; children: (alto: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [alto, setAlto] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAlto(Math.floor(e!.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    // El mínimo vale en el celular; en la computadora el gráfico usa lo que quede (desde 64 px).
    <div ref={ref} className="relative min-h-[var(--min)] flex-1 lg:min-h-[64px]" style={{ ["--min" as string]: `${min}px` }}>
      {alto > 0 && <div className="absolute inset-0">{children(Math.max(64, alto))}</div>}
    </div>
  );
}

/** La referencia del gráfico: qué es cada color o cada forma. */
export function Referencia({ items, children }: { items?: { muestra: "barra" | "linea" | "punteada" | "punto" | "apagada"; texto: string }[]; children?: ReactNode }) {
  const t = useTono();
  const claro = t !== "blanco";
  const color = t === "naranja" ? "bg-neutral-0" : "bg-brand-500";
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${suave(t)} ${SI_ALCANZA}`}>
      {items?.map((it) => (
        <span key={it.texto} className="inline-flex items-center gap-2">
          {it.muestra === "barra" && <span className={`h-2.5 w-2.5 rounded-[3px] ${color}`} />}
          {it.muestra === "apagada" && <span className={`h-2.5 w-2.5 rounded-[3px] ${t === "azul" ? "bg-ink-500" : claro ? "bg-neutral-0/25" : "bg-ink-200"}`} />}
          {it.muestra === "punto" && <span className={`h-2.5 w-2.5 rounded-full ${color}`} />}
          {it.muestra === "linea" && <span className={`h-0.5 w-5 rounded-full ${color}`} />}
          {it.muestra === "punteada" && <span className={`h-0 w-5 border-t-2 border-dashed ${claro ? "border-neutral-0/70" : "border-neutral-500"}`} />}
          {it.texto}
        </span>
      ))}
      {children && <span>{pegar(String(children))}</span>}
    </div>
  );
}

/** La conclusión del dato de hoy, en una franja marcada. */
export function Conclusion({ children }: { children: ReactNode }) {
  const t = useTono();
  const c = t === "blanco" ? "bg-ink-50 text-ink-900 before:bg-brand-500" : t === "azul" ? "bg-neutral-0/[0.07] text-neutral-0 before:bg-brand-500" : "bg-neutral-0/15 text-neutral-0 before:bg-neutral-0";
  return (
    <p className={`${SI_ALCANZA} relative rounded-[10px] py-2 pl-3.5 pr-3 text-[13px] font-semibold leading-snug before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full ${c}`}>
      {children}
    </p>
  );
}

/**
 * Tres botones (el relleno crece con `scale-y` desde abajo; el color del texto al llenarse va con `hover:` del
 * propio link: con `group-hover:` no se aplicaba y «Ver los inscriptos» quedaba blanco sobre blanco, 2026-11-26):
 * - principal: relleno naranja; al pasar el mouse se llena de azul tinta desde abajo (0,5 s).
 * - secundario: relleno azul tinta; se llena de naranja desde abajo.
 * - enlace: texto con flecha que se corre.
 * Sobre una tarjeta azul o naranja cambian para que siempre contrasten.
 */
export function Boton({ href, children, variante = "principal", chico = false }: { href: string; children: ReactNode; variante?: "principal" | "secundario" | "enlace"; chico?: boolean }) {
  const t = useTono();
  const flecha = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="relative transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:translate-x-1">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (variante === "enlace") {
    const c = t === "blanco" ? "text-ink-900 decoration-brand-500" : "text-neutral-0 decoration-neutral-0/60";
    return (
      <Link href={href} className={`group inline-flex min-h-[40px] items-center gap-2 rounded-[8px] font-sub text-sm font-semibold underline decoration-2 underline-offset-[6px] outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${c}`}>
        {children}{flecha}
      </Link>
    );
  }
  // [fondo, texto, relleno que sube, texto al llenarse]
  const estilos: Record<Tono, Record<"principal" | "secundario", [string, string, string, string]>> = {
    blanco: { principal: ["bg-brand-500", "text-neutral-0", "bg-ink-900", ""], secundario: ["bg-ink-900", "text-neutral-0", "bg-brand-500", ""] },
    azul: { principal: ["bg-brand-500", "text-neutral-0", "bg-neutral-0", "[@media(hover:hover)]:hover:text-ink-900"], secundario: ["bg-neutral-0/10", "text-neutral-0", "bg-neutral-0", "[@media(hover:hover)]:hover:text-ink-900"] },
    naranja: { principal: ["bg-neutral-0", "text-brand-700", "bg-ink-900", "[@media(hover:hover)]:hover:text-neutral-0"], secundario: ["bg-ink-900", "text-neutral-0", "bg-neutral-0", "[@media(hover:hover)]:hover:text-ink-900"] },
  };
  const [fondo, texto, relleno, textoLleno] = estilos[t][variante];
  return (
    <Link href={href}
      className={`group relative inline-flex ${chico ? "min-h-[36px] px-3 text-[13px]" : "min-h-[44px] px-4 text-sm"} shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[12px] font-sub font-semibold outline-none transition-[transform,color] duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] ${fondo} ${texto} ${textoLleno}`}>
      <span aria-hidden className={`absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(.22,.8,.24,1)] [@media(hover:hover)]:group-hover:scale-y-100 ${relleno}`} />
      <span className="relative whitespace-nowrap">{children}</span>
      {flecha}
    </Link>
  );
}

/** El pie de una tarjeta con lo que se puede hacer. */
export function Acciones({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>;
}

/**
 * La banda azul de arriba, baja (unos 120 px): la fecha, el saludo y lo de hoy en una oración a la izquierda;
 * a la derecha, la pila de urgencias (como el Inicio del portal CESS).
 */
export function Bienvenida({ d, nombre, urgente }: { d: Inicio; nombre: string; urgente?: ReactNode }) {
  const hoy = d.consultas_dias.at(-1)?.n ?? 0;
  return (
    <Tarjeta tono="azul" className="shrink-0 rounded-[22px] px-5 py-4 sm:px-6" aria-labelledby="hola">
      <Trama />
      <div className="relative grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div className="min-w-0">
          <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-neutral-0/70 first-letter:uppercase">{fechaDeHoy()}</p>
          <h1 id="hola" className="mt-0.5 font-display text-3xl font-semibold tracking-tight">Hola, {nombre}</h1>
          <p className={`mt-1 text-sm text-neutral-0/85 ${SI_ALCANZA}`}>{pegar(resumenDelDia(d, hoy))}</p>
        </div>
        {urgente && <div className="flex min-w-0 justify-center lg:justify-end">{urgente}</div>}
      </div>
    </Tarjeta>
  );
}

export function resumenDelDia(d: Inicio, hoy: number): string {
  const entraron = hoy === 0 ? "Hoy todavía no entraron consultas" : hoy === 1 ? "Hoy entró 1 consulta" : `Hoy entraron ${numero(hoy)} consultas`;
  const sin = d.consultas_nuevas === 0 ? "no queda ninguna sin contestar" : `${plural(d.consultas_nuevas, "espera", "esperan")} respuesta`;
  const compras = d.ordenes_sin_cumplir === 0 ? "todas las compras ya tienen acceso al aula" : `${plural(d.ordenes_sin_cumplir, "compra espera", "compras esperan")} el acceso al aula`;
  return `${entraron}, ${sin} y ${compras}.`;
}

/** Trama de líneas finas y un brillo naranja en una esquina: le da profundidad a la banda azul. */
export function Trama() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_left,#000,transparent_70%)]" />
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
      </div>
    </>
  );
}

/** «hace 5 h», «hace 3 días»: cuánto lleva esperando algo. */
export function hace(iso: string, ahora = Date.now()): string {
  const h = Math.max(0, (ahora - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "hace menos de una hora";
  if (h < 24) return `hace ${Math.floor(h)} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

/** Barra de scroll fina del portal CESS, para las listas que corren adentro de una tarjeta. */
export const SCROLL_FINO = "overflow-y-auto overscroll-contain [scrollbar-color:rgba(11,30,51,.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink-900/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5";

/** Las consultas sin contestar más viejas, como filas que llevan a cada una (la lista corre adentro). */
export function ConsultasViejas({ d }: { d: Inicio }) {
  if (!d.consultas_viejas.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
        <p className="font-display text-lg font-semibold text-ink-900">Todo al día.</p>
        <p className="text-sm text-neutral-700">No hay consultas sin contestar.</p>
      </div>
    );
  }
  return (
    <ul className={`-mr-1.5 flex min-h-0 flex-1 flex-col gap-1.5 pr-1.5 ${SCROLL_FINO}`}>
      {d.consultas_viejas.map((c, k) => (
        <li key={c.id}>
          <Link href={`/admin/consultas/${c.id}`} className="group flex min-h-[48px] items-center gap-3 rounded-[12px] border border-ink-100 px-2.5 py-1.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:border-ink-900 [@media(hover:hover)]:hover:bg-ink-50">
            <span aria-hidden className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sub text-[11px] font-semibold ${k === 0 ? "bg-brand-500 text-neutral-0" : "bg-ink-900 text-neutral-0"}`}>
              {iniciales(c.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900">{c.name}</span>
              <span className="block truncate text-xs text-neutral-700">{c.company || "Sin empresa"} · {ORIGEN_CONSULTA[c.source] ?? c.source}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-sub text-xs font-semibold tabular-nums text-ink-900">{hace(c.created_at).replace("hace ", "")}</span>
              {k === 0 && <span className="block text-[11px] font-semibold text-brand-600">la que más espera</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "·";

// --- Cuentas que salen de los datos ---------------------------------------------------------------

export const suma = (v: number[]) => v.reduce((a, b) => a + b, 0);

/** «12 % más» / «8 % menos» / «lo mismo» que en el período anterior. */
export function cambio(ahora: number, antes: number): string {
  if (antes === 0) return ahora === 0 ? "igual que antes" : "y antes no había";
  const p = Math.round(((ahora - antes) / antes) * 100);
  if (p === 0) return "igual que en los 30 anteriores";
  return `${Math.abs(p)} % ${p > 0 ? "más" : "menos"} que en los 30 anteriores`;
}

export function textoMontos(montos: Record<string, string>): string {
  const partes = Object.entries(montos).map(([moneda, valor]) => plata(valor, moneda));
  return partes.length ? partes.join(" y ") : "sin cobros";
}

export function frasesDelMes(d: Inicio) {
  const mes = d.compras_meses.at(-1);
  return {
    mesNombre: mes ? mesLargo(`${mes.mes}-01`) : "",
    comprasMes: mes?.cantidad ?? 0,
    comprasAntes: d.compras_meses.at(-2)?.cantidad ?? 0,
    montosMes: mes?.montos ?? {},
  };
}

export function consultaMasVieja(d: Inicio): string | null {
  const c = d.consultas_viejas[0];
  if (!c) return null;
  const iso = c.created_at.slice(0, 10);
  // Si es de otro año, se dice el año: «27 nov 2025».
  return iso.slice(0, 4) === String(new Date().getFullYear()) ? diaCorto(iso) : `${diaCorto(iso)} ${iso.slice(0, 4)}`;
}

export const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

