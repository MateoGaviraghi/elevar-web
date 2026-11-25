"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * La barra de filtros del portal CESS (su D-033), con los colores del panel: un buscador ancho, menús con la
 * etiqueta arriba y lo elegido abajo, del alto de un campo, resaltados cuando filtran, y las pastillas de
 * los filtros puestos, que se sacan con un toque. Todo vive en una tarjeta blanca.
 */
export function BarraFiltros({ children, pastillas }: { children: ReactNode; pastillas?: ReactNode }) {
  return (
    <div className="shrink-0 rounded-[18px] border border-ink-100 bg-neutral-0 p-2.5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">{children}</div>
      {pastillas && <div className="mt-2 flex flex-wrap items-center gap-2 px-1">{pastillas}</div>}
    </div>
  );
}

/** El buscador: la etiqueta chica arriba, adentro del campo, como en el portal. Aplica al dejar de escribir. */
export function Buscador({ etiqueta, valor, onCambiar }: { etiqueta: string; valor: string; onCambiar: (v: string) => void }) {
  const [texto, setTexto] = useState(valor);
  const id = useId();
  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    if (texto.trim() === valor) return;
    const t = setTimeout(() => onCambiar(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto, valor, onCambiar]);
  return (
    <label htmlFor={id}
      className="group relative flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-[12px] border border-ink-100 bg-ink-50/60 px-3.5 transition-colors duration-150 focus-within:border-ink-900 focus-within:bg-neutral-0 focus-within:ring-2 focus-within:ring-ink-900/10">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden className="shrink-0 text-ink-500">
        <circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" stroke="#E94E1B" />
      </svg>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-sub text-[11px] font-semibold text-ink-500">{etiqueta}</span>
        <input id={id} type="search" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off"
          className="w-full bg-transparent text-base text-ink-900 outline-none placeholder:text-neutral-500 sm:text-sm" />
      </span>
      {texto && (
        <button type="button" onClick={() => { setTexto(""); onCambiar(""); }} aria-label="Borrar la búsqueda"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:bg-ink-100">
          <Cruz />
        </button>
      )}
    </label>
  );
}

export type Opcion<V extends string> = { valor: V; texto: string };

/**
 * Un menú de la barra: etiqueta arriba, lo elegido abajo y una flecha. Abre una lista que entra en cascada
 * (0,22 s). Teclado: Enter, Espacio o ↓ abre; ↑ ↓ recorren; Enter elige; Esc cierra; afuera también cierra.
 */
export function Menu<V extends string>({ etiqueta, valor, opciones, onCambiar, porDefecto, icono }: MenuProps<V>) {
  const [abierto, setAbierto] = useState(false);
  const [foco, setFoco] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const id = useId();
  const elegida = opciones.find((o) => o.valor === valor) ?? opciones[0]!;
  const filtra = porDefecto !== undefined && valor !== porDefecto;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    lista.current?.querySelector<HTMLElement>(`[data-i="${foco}"]`)?.focus();
  }, [abierto, foco]);

  useEffect(() => {
    if (!abierto || prefersReducedMotion()) return;
    const items = lista.current?.querySelectorAll("li");
    if (items?.length) gsap.fromTo(items, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.22, stagger: 0.02, ease: "power2.out", clearProps: "opacity,transform" });
  }, [abierto]);

  const abrir = () => {
    setFoco(Math.max(0, opciones.findIndex((o) => o.valor === valor)));
    setAbierto(true);
  };
  const cerrar = () => {
    setAbierto(false);
    boton.current?.focus();
  };
  const elegir = (v: V) => {
    if (v !== valor) onCambiar(v);
    cerrar();
  };
  const teclaBoton = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      abrir();
    }
  };
  const teclaLista = (e: KeyboardEvent) => {
    if (e.key === "Escape") return e.preventDefault(), cerrar();
    if (e.key === "Tab") return setAbierto(false);
    const n = opciones.length;
    const sig = e.key === "ArrowDown" ? (foco + 1) % n : e.key === "ArrowUp" ? (foco - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (sig >= 0) {
      e.preventDefault();
      setFoco(sig);
    }
  };

  return (
    <div ref={caja} className="relative min-w-0 lg:w-[11.5rem]">
      <button ref={boton} type="button" aria-haspopup="listbox" aria-expanded={abierto} aria-controls={id} onClick={() => (abierto ? cerrar() : abrir())} onKeyDown={teclaBoton}
        className={`flex min-h-[52px] w-full items-center gap-2.5 rounded-[12px] border px-3.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 ${
          filtra ? "border-brand-500 bg-brand-50" : "border-ink-100 bg-neutral-0 [@media(hover:hover)]:hover:border-ink-200"
        }`}>
        {icono}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-sub text-[11px] font-semibold text-ink-500">{etiqueta}</span>
          <span className="truncate text-sm font-semibold text-ink-900">{elegida.texto}</span>
        </span>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden className={`shrink-0 text-ink-500 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}>
          <path d="m5.5 8 4.5 4.5L14.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {abierto && (
        <ul ref={lista} id={id} role="listbox" aria-label={etiqueta} onKeyDown={teclaLista}
          className="absolute right-0 top-full z-40 mt-1.5 min-w-full overflow-hidden rounded-[14px] border border-ink-100 bg-neutral-0 p-1.5 shadow-[0_18px_40px_-16px_rgba(11,30,51,.35)]">
          {opciones.map((o, i) => {
            const marcada = o.valor === valor;
            return (
              <li key={o.valor} data-i={i} role="option" aria-selected={marcada} tabIndex={-1}
                onClick={() => elegir(o.valor)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), elegir(o.valor))} onPointerEnter={() => setFoco(i)}
                className={`flex min-h-[40px] cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-[10px] px-3 text-sm outline-none focus:bg-ink-50 ${marcada ? "font-semibold text-ink-900" : "text-ink-900/85"}`}>
                {o.texto}
                {marcada && (
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden className="shrink-0 text-brand-500">
                    <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface MenuProps<V extends string> {
  etiqueta: string;
  valor: V;
  opciones: Opcion<V>[];
  onCambiar: (v: V) => void;
  /** El valor que no filtra: con otro valor el menú queda resaltado. Sin esto (por ejemplo, el orden) nunca se resalta. */
  porDefecto?: V;
  icono?: ReactNode;
}

/** Una pastilla de un filtro puesto: tocarla lo saca. */
export function Pastilla({ texto, onQuitar }: { texto: string; onQuitar: () => void }) {
  return (
    <button type="button" onClick={onQuitar} aria-label={`Sacar el filtro ${texto}`}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 pl-3 pr-2 text-xs font-semibold text-ink-900 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:border-ink-900">
      {texto}
      <Cruz chica />
    </button>
  );
}

/** «Limpiar todo», al lado de las pastillas. */
export function Limpiar({ onLimpiar }: { onLimpiar: () => void }) {
  return (
    <button type="button" onClick={onLimpiar}
      className="min-h-[32px] rounded-full px-2 font-sub text-xs font-semibold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      Limpiar todo
    </button>
  );
}

function Cruz({ chica = false }: { chica?: boolean }) {
  const s = chica ? 14 : 16;
  return (
    <svg viewBox="0 0 16 16" width={s} height={s} fill="none" aria-hidden>
      <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
