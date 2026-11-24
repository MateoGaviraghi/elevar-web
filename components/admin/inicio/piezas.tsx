"use client";

import Link from "next/link";
import { createContext, useContext, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { fechaDeHoy, fechaHora, ORIGEN_CONSULTA, plata } from "@/lib/admin/formato";
import type { Inicio } from "@/lib/admin/tipos";
import { pegar, sinViuda } from "@/lib/texto";
import { Icono } from "../iconos";
import { diaCorto, mesLargo, numero } from "./graficos";

/**
 * Piezas comunes de las tres versiones del Inicio (prototipo del 2026-11-24, segunda pasada).
 * Tres colores con trabajo propio: blanco para leer, azul tinta para el contexto y los números,
 * naranja para lo que espera. Tres fuentes: DM Sans en títulos, Space Grotesk (`font-sub`) en
 * etiquetas, cifras y botones, Inter en el texto.
 * Cada tarjeta sigue el mismo orden: etiqueta con ícono, la pregunta, para qué sirve, el gráfico
 * con su referencia, la conclusión y lo que se puede hacer.
 */

export type Tono = "blanco" | "azul" | "naranja";
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
      <Etiqueta {...resto} className={`relative overflow-hidden rounded-[20px] p-5 sm:p-6 ${FONDO[tono]} ${className}`}>
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

/**
 * La etiqueta de arriba: el ícono propio de esa tarjeta en un cuadro de color que contrasta con el
 * fondo (azul sobre blanco, naranja sobre azul, blanco sobre naranja) y el nombre del tema en
 * Space Grotesk. Al entrar, el ícono se dibuja (0,6 s).
 */
export function Etiqueta({ icono, children }: { icono: string; children: ReactNode }) {
  const t = useTono();
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const trazos = ref.current?.querySelectorAll("path");
    if (!trazos?.length || prefersReducedMotion()) return;
    gsap.fromTo(trazos, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out", stagger: 0.12, delay: 0.15, autoRound: false });
  }, { scope: ref });
  const caja = t === "blanco" ? "bg-ink-900 text-neutral-0" : t === "azul" ? "bg-brand-500 text-neutral-0" : "bg-neutral-0 text-ink-900";
  const acento = t === "blanco" ? "#F37040" : t === "azul" ? "#0B1E33" : "#E94E1B";
  const texto = t === "blanco" ? "text-ink-500" : t === "azul" ? "text-neutral-0/75" : "text-neutral-0/90";
  return (
    <p className="flex items-center gap-3">
      <span ref={ref} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] shadow-sm ${caja}`}>
        <Icono nombre={icono} className="h-6 w-6" acento={acento} grosor={2} />
      </span>
      <span className={`font-sub text-xs font-semibold uppercase tracking-wider ${texto}`}>{children}</span>
    </p>
  );
}

/** Encabezado de una tarjeta: etiqueta, la pregunta que contesta (título) y para qué sirve. */
export function Encabezado({ icono, etiqueta, titulo, paraQue, id, grande = false }: EncabezadoProps) {
  const t = useTono();
  return (
    <header className="flex flex-col gap-3">
      <Etiqueta icono={icono}>{etiqueta}</Etiqueta>
      <div className="flex flex-col gap-1.5">
        <h2 id={id} className={`font-display font-semibold leading-tight tracking-tight ${grande ? "text-2xl sm:text-3xl" : "text-xl"}`}>{sinViuda(titulo)}</h2>
        {paraQue && <p className={`text-sm ${suave(t)}`}>{pegar(paraQue)}</p>}
      </div>
    </header>
  );
}

interface EncabezadoProps {
  icono: string;
  etiqueta: string;
  titulo: string;
  paraQue?: string;
  id?: string;
  grande?: boolean;
}

/** La referencia del gráfico: qué es cada color o cada forma, y cómo se lee. */
export function Referencia({ items, children }: { items?: { muestra: "barra" | "linea" | "punteada" | "punto" | "apagada"; texto: string }[]; children?: ReactNode }) {
  const t = useTono();
  const claro = t !== "blanco";
  const color = t === "naranja" ? "bg-neutral-0" : "bg-brand-500";
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${suave(t)}`}>
      {items?.map((it) => (
        <span key={it.texto} className="inline-flex items-center gap-2">
          {it.muestra === "barra" && <span className={`h-3 w-3 rounded-[3px] ${color}`} />}
          {it.muestra === "apagada" && <span className={`h-3 w-3 rounded-[3px] ${t === "azul" ? "bg-ink-500" : claro ? "bg-neutral-0/25" : "bg-ink-200"}`} />}
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
    <p className={`relative rounded-[12px] py-2.5 pl-4 pr-3 text-sm font-semibold before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full ${c}`}>
      {children}
    </p>
  );
}

/**
 * Tres botones:
 * - principal: relleno naranja; al pasar el mouse se llena de azul tinta desde abajo (0,5 s).
 * - secundario: relleno azul tinta; se llena de naranja desde abajo.
 * - enlace: texto con flecha que se corre.
 * Sobre una tarjeta azul o naranja cambian para que siempre contrasten.
 */
export function Boton({ href, children, variante = "principal" }: { href: string; children: ReactNode; variante?: "principal" | "secundario" | "enlace" }) {
  const t = useTono();
  const flecha = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="relative transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:translate-x-1">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (variante === "enlace") {
    const c = t === "blanco" ? "text-ink-900 decoration-brand-500" : "text-neutral-0 decoration-neutral-0/60";
    return (
      <Link href={href} className={`group inline-flex min-h-[44px] items-center gap-2 rounded-[8px] font-sub text-sm font-semibold underline decoration-2 underline-offset-[6px] outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${c}`}>
        {children}{flecha}
      </Link>
    );
  }
  // [fondo, texto, relleno que sube, texto al llenarse]
  const estilos: Record<Tono, Record<"principal" | "secundario", [string, string, string, string]>> = {
    blanco: { principal: ["bg-brand-500", "text-neutral-0", "bg-ink-900", ""], secundario: ["bg-ink-900", "text-neutral-0", "bg-brand-500", ""] },
    azul: { principal: ["bg-brand-500", "text-neutral-0", "bg-neutral-0", "[@media(hover:hover)]:group-hover:text-ink-900"], secundario: ["bg-neutral-0/10", "text-neutral-0", "bg-neutral-0", "[@media(hover:hover)]:group-hover:text-ink-900"] },
    naranja: { principal: ["bg-neutral-0", "text-brand-700", "bg-ink-900", "[@media(hover:hover)]:group-hover:text-neutral-0"], secundario: ["bg-ink-900", "text-neutral-0", "bg-neutral-0", "[@media(hover:hover)]:group-hover:text-ink-900"] },
  };
  const [fondo, texto, relleno, textoLleno] = estilos[t][variante];
  return (
    <Link href={href}
      className={`group relative inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-[12px] px-4 font-sub text-sm font-semibold outline-none transition-[transform,color] duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] ${fondo} ${texto} ${textoLleno}`}>
      <span aria-hidden className={`absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(.22,.8,.24,1)] [@media(hover:hover)]:group-hover:translate-y-0 ${relleno}`} />
      <span className="relative">{children}</span>
      {flecha}
    </Link>
  );
}

/** El pie de una tarjeta con lo que se puede hacer. */
export function Acciones({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">{children}</div>;
}

/**
 * La banda azul de arriba: la fecha, el saludo, lo de hoy en una oración, las cosas que más se hacen y, a la
 * derecha, la pila de urgencias (como el Inicio del portal CESS).
 */
export function Bienvenida({ d, nombre, acciones, urgente }: { d: Inicio; nombre: string; acciones?: ReactNode; urgente?: ReactNode }) {
  const hoy = d.consultas_dias.at(-1)?.n ?? 0;
  return (
    <Tarjeta tono="azul" className="rounded-[24px] sm:p-8" aria-labelledby="hola">
      <Trama />
      <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
        <div className="flex min-w-0 flex-col gap-5">
        <div className="max-w-2xl">
          <p className="font-sub text-xs font-semibold uppercase tracking-wider text-neutral-0/70 first-letter:uppercase">{fechaDeHoy()}</p>
          <h1 id="hola" className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Hola, {nombre}</h1>
          <p className="mt-3 text-base text-neutral-0/85">{pegar(resumenDelDia(d, hoy))}</p>
        </div>
        <Acciones>
          {acciones ?? (
            <>
              <Boton href="/admin/consultas">Contestar consultas</Boton>
              <Boton href="/admin/ordenes" variante="secundario">Ver las órdenes</Boton>
            </>
          )}
        </Acciones>
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
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_left,#000,transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
    </>
  );
}

/**
 * El título de cada piso del Inicio: «Para hacer hoy», «Lo que viene», «Cómo va el negocio».
 * Una línea fina que se extiende al entrar (0,9 s) separa un piso del otro.
 */
export function Piso({ titulo, detalle, id }: { titulo: string; detalle: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const linea = ref.current?.querySelector("[data-linea]");
    if (!linea || prefersReducedMotion()) return;
    gsap.fromTo(linea, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.9, ease: "power3.out" });
  }, { scope: ref });
  return (
    <div ref={ref} className="mt-4 flex flex-col gap-1 lg:col-span-12">
      <div className="flex items-center gap-4">
        <h2 id={id} className="shrink-0 font-sub text-sm font-bold uppercase tracking-wider text-ink-900">{titulo}</h2>
        <span data-linea aria-hidden className="h-px flex-1 bg-ink-200" />
      </div>
      <p className="text-sm text-neutral-700">{pegar(detalle)}</p>
    </div>
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

/** Las consultas sin contestar más viejas, como filas que llevan a cada una. */
export function ConsultasViejas({ d }: { d: Inicio }) {
  if (!d.consultas_viejas.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
        <p className="font-display text-lg font-semibold text-ink-900">Todo al día.</p>
        <p className="text-sm text-neutral-700">No hay consultas sin contestar.</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {d.consultas_viejas.map((c, k) => (
        <li key={c.id}>
          <Link href={`/admin/consultas/${c.id}`} className="group flex min-h-[60px] items-center gap-3 rounded-[14px] border border-ink-100 px-3 py-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:border-ink-900 [@media(hover:hover)]:hover:bg-ink-50">
            <span aria-hidden className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-sub text-xs font-semibold ${k === 0 ? "bg-brand-500 text-neutral-0" : "bg-ink-900 text-neutral-0"}`}>
              {iniciales(c.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900">{c.name}</span>
              <span className="block truncate text-xs text-neutral-700">{c.company || "Sin empresa"} · {ORIGEN_CONSULTA[c.source] ?? c.source}</span>
              <span className="block font-sub text-xs font-semibold tabular-nums text-ink-900 sm:hidden">
                {fechaHora(c.created_at)}{k === 0 && <span className="text-brand-600"> · La que más espera</span>}
              </span>
            </span>
            <span className="hidden shrink-0 text-right sm:block">
              <span className="block font-sub text-xs font-semibold tabular-nums text-ink-900">{fechaHora(c.created_at)}</span>
              {k === 0 && <span className="block text-[11px] font-semibold text-brand-600">La que más espera</span>}
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
