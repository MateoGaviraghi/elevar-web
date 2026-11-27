"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { pegar } from "@/lib/texto";
import { Icono, useEscribirIcono } from "../iconos";
import { CifraRueda } from "../inicio/graficos";
import { SI_ALCANZA, Trama } from "../inicio/piezas";

/**
 * La cabecera de una pantalla de lista, con la forma del portal CESS (2026-11-24, Mateo: «mantené el diseño
 * como el del portal… las cards, los filtros, la paginación, el formulario»): banda azul tinta con la sección,
 * el título y su contador, una bajada corta y, abajo, las cifras que filtran al tocarlas. La cifra elegida
 * queda blanca. A la derecha del título va lo que la pantalla necesite (acá, las pestañas).
 */
/**
 * La entrada de una pieza al llegar a la pantalla, como la cascada del portal (su `.llega [data-llega]`): sube
 * 14 px y aparece en 0,5 s, `orden` × 80 ms después de la anterior. Corre antes de pintar (nada asoma antes de
 * tiempo) y una sola vez por montaje; con «menos movimiento», nada.
 */
export function useLlega(ref: RefObject<HTMLElement | null>, orden: number, desde: { y?: number; scale?: number } = { y: 14 }) {
  useLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const t = gsap.fromTo(ref.current, { opacity: 0, ...desde }, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: orden * 0.08, ease: "power3.out", clearProps: "opacity,transform" });
    return () => void t.progress(1).kill();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hacia dónde va el próximo cambio de la lista: 1 = la lista nueva entra desde la derecha (se avanza: una cifra
 * más a la derecha, la página siguiente, un filtro), -1 = desde la izquierda. Lo marca quien cambia la lista y
 * lo usa la tabla una vez (después vuelve a 1).
 */
export const cambio = { direccion: 1 as 1 | -1 };

export function Banda({ sobre, titulo, contador, bajada, derecha, children, cinco }: BandaProps) {
  const caja = useRef<HTMLElement>(null);
  useLlega(caja, 0);
  return (
    <section ref={caja} aria-labelledby="titulo-lista" className="relative shrink-0 overflow-hidden rounded-[22px] bg-ink-900 px-5 py-4 text-neutral-0 sm:px-6">
      <Trama />
      <div className="relative flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-brand-300">{sobre}</p>
            <h1 id="titulo-lista" className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl font-semibold tracking-tight">
              {titulo}
              {contador && <span className="rounded-full bg-neutral-0/10 px-2.5 py-0.5 font-sub text-xs font-semibold tabular-nums tracking-normal ring-1 ring-neutral-0/15">{contador}</span>}
            </h1>
            {bajada && <p className={`mt-1 text-sm text-neutral-0/80 ${SI_ALCANZA}`}>{pegar(bajada)}</p>}
          </div>
          {derecha && <div className="shrink-0">{derecha}</div>}
        </div>
        {children && <div className={`grid grid-cols-2 gap-2 xl:gap-3 ${cinco ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>{children}</div>}
      </div>
    </section>
  );
}

interface BandaProps {
  sobre: string;
  titulo: string;
  contador?: string;
  bajada?: string;
  derecha?: ReactNode;
  children?: ReactNode;
  /** Cinco cifras en vez de cuatro (Órdenes, con «A revisar»). */
  cinco?: boolean;
}

/**
 * Una cifra de la banda: ícono, nombre, para qué y el número. Es un enlace que filtra la lista; la elegida
 * queda en blanco (`aria-current`). `aviso` es una línea en naranja (por ejemplo, los vencidos).
 */
export function CifraFiltro({ href, icono, nombre, detalle, valor, elegida, aviso, className = "" }: CifraFiltroProps) {
  const escribir = useEscribirIcono();
  return (
    <Link href={href} scroll={false} aria-current={elegida ? "true" : undefined} onPointerEnter={escribir} onFocus={escribir}
      onClick={(e) => {
        const hermanos = [...(e.currentTarget.parentElement?.children ?? [])];
        const yo = hermanos.indexOf(e.currentTarget);
        const actual = hermanos.findIndex((h) => h.getAttribute("aria-current") === "true");
        cambio.direccion = actual >= 0 && yo < actual ? -1 : 1;
      }}
      className={`${className} group flex min-h-[64px] flex-col items-start gap-1 rounded-[16px] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 outline-none transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-[0.98] sm:px-4 ${
        elegida ? "bg-neutral-0 text-ink-900 shadow-[0_10px_30px_-12px_rgba(0,0,0,.5)]" : "bg-neutral-0/[0.06] text-neutral-0 ring-1 ring-neutral-0/10 [@media(hover:hover)]:hover:bg-neutral-0/[0.12]"
      }`}>
      <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-[12px] 2xl:inline-flex ${elegida ? "bg-ink-900 text-neutral-0" : "bg-neutral-0/10 text-neutral-0"}`}>
        <Icono nombre={icono} className="h-5 w-5" acento={elegida ? "#F37040" : "#F79268"} grosor={2} />
      </span>
      <span className="w-full min-w-0 flex-1">
        <span className="block truncate font-sub text-sm font-semibold">{nombre}</span>
        <span className={`${aviso ? "block" : "hidden sm:block"} truncate text-xs ${aviso ? (elegida ? "font-semibold text-brand-600" : "font-semibold text-brand-300") : elegida ? "text-neutral-700" : "text-neutral-0/70"}`}>{aviso ?? detalle}</span>
      </span>
      <CifraRueda valor={valor} className="font-sub text-3xl font-bold tabular-nums tracking-tight" />
    </Link>
  );
}

interface CifraFiltroProps {
  href: string;
  icono: string;
  nombre: string;
  detalle: string;
  valor: number;
  elegida: boolean;
  aviso?: string;
  className?: string;
}

/**
 * Pestañas sobre la banda azul: un resaltado blanco que se desliza a la elegida (0,3 s); flechas, Inicio y Fin
 * del teclado. Mismo comportamiento que las del Inicio.
 */
export function Pestanas<V extends string>({ vistas, vista, elegir, etiqueta }: { vistas: readonly { id: V; texto: string }[]; vista: V; elegir: (v: V) => void; etiqueta: string }) {
  const lista = useRef<HTMLDivElement>(null);
  const resalte = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);
  useLayoutEffect(() => {
    const el = lista.current?.querySelector<HTMLElement>(`[data-vista="${vista}"]`);
    if (!el || !resalte.current) return;
    const destino = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1 };
    if (primera.current || prefersReducedMotion()) gsap.set(resalte.current, destino);
    else gsap.to(resalte.current, { ...destino, duration: 0.3, ease: "power3.out" });
    primera.current = false;
  }, [vista]);
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = vistas.findIndex((v) => v.id === vista);
    const n = vistas.length;
    const sig = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (sig < 0) return;
    e.preventDefault();
    elegir(vistas[sig]!.id);
    lista.current?.querySelector<HTMLElement>(`[data-vista="${vistas[sig]!.id}"]`)?.focus();
  };
  return (
    <div ref={lista} role="tablist" aria-label={etiqueta} onKeyDown={tecla}
      className="relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-neutral-0/10 p-1 ring-1 ring-neutral-0/15">
      <span ref={resalte} aria-hidden className="absolute bottom-1 left-0 top-1 rounded-full bg-neutral-0 opacity-0" />
      {vistas.map((v) => {
        const activa = v.id === vista;
        return (
          <button key={v.id} type="button" role="tab" id={`pestana-${v.id}`} data-vista={v.id} aria-selected={activa} aria-controls={`vista-${v.id}`}
            tabIndex={activa ? 0 : -1} onClick={() => elegir(v.id)}
            className={`relative z-[1] inline-flex min-h-[38px] items-center whitespace-nowrap rounded-full px-4 font-sub text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-400 ${activa ? "text-ink-900" : "text-neutral-0/85 [@media(hover:hover)]:hover:text-neutral-0"}`}>
            {v.texto}
          </button>
        );
      })}
    </div>
  );
}
