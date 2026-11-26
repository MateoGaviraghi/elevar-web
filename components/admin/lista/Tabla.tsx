"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "./insignia.css";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { SCROLL_FINO } from "../inicio/piezas";
import { cambio, useLlega } from "./Banda";

/**
 * La tabla del portal CESS dentro de una tarjeta redondeada: encabezado gris de 11 px que queda fijo, filas
 * de 56 px con línea entre ellas, tocar una fila abre su ficha y las acciones de la derecha se ven siempre.
 * En la computadora la tabla corre por dentro (barra fina) y el pie con la paginación queda abajo, así la
 * pantalla entera entra sin scroll. Debajo de 640 px cada fila pasa a ser una tarjeta de dos líneas.
 */
export function Tabla<T>({ etiqueta, filas: nuevas, columnas, clave, alAbrir, movil, pie, cargando, vacio, activa }: TablaProps<T>) {
  const caja = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  useLlega(caja, 2, { scale: 0.98 });

  // Mientras llega la página nueva quedan las filas de antes, apenas apagadas (el portal no salta a un esqueleto).
  const firmaNueva = nuevas.map(clave).join(",");
  const [previas, setPrevias] = useState({ filas: nuevas, firma: firmaNueva, listas: !cargando });
  if (!cargando && (firmaNueva !== previas.firma || !previas.listas)) setPrevias({ filas: nuevas, firma: firmaNueva, listas: true });
  const esperando = !!cargando && previas.listas;
  const filas = esperando ? previas.filas : nuevas;
  const firma = esperando ? previas.firma : firmaNueva;

  // Movimiento de las filas (2026-11-25, Mateo: «que sea como de izquierda a derecha… que parezca que es algo
  // fluido»). La primera vez entran en cascada como en el portal (20 px, 0,5 s, 60 ms entre filas, hasta la 15).
  // Al cambiar la lista (cifra, filtro, búsqueda, página) es un pase de lado: las filas de antes se van hacia un
  // costado (0,22 s) y las nuevas entran desde el otro (56 px, 0,5 s, 35 ms entre filas). La dirección la marca
  // quien cambió la lista (`cambio.direccion`): ir a una cifra o una página de la izquierda trae la lista desde
  // la izquierda.
  const primera = useRef(true);
  const visibles = () => (cuerpo.current ? [...cuerpo.current.querySelectorAll<HTMLElement>("[data-fila]")].filter((el) => el.offsetParent !== null) : []);
  useLayoutEffect(() => {
    if (!esperando || prefersReducedMotion()) return;
    const salen = visibles().slice(0, 15);
    if (salen.length) gsap.to(salen, { x: -40 * cambio.direccion, opacity: 0, duration: 0.22, stagger: 0.012, ease: "power2.in", overwrite: "auto" });
  }, [esperando]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (cargando) return;
    const filasDom = visibles();
    const dir = cambio.direccion;
    cambio.direccion = 1;
    if (!filasDom.length) return void (primera.current = false);
    if (prefersReducedMotion()) return void gsap.set(filasDom, { clearProps: "opacity,transform" });
    if (primera.current) {
      primera.current = false;
      gsap.fromTo(filasDom.slice(0, 15), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.2, ease: "power3.out", clearProps: "opacity,transform" });
      return;
    }
    gsap.fromTo(filasDom.slice(0, 15), { opacity: 0, x: 56 * dir }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.035, ease: "power3.out", overwrite: "auto", clearProps: "opacity,transform" });
    if (filasDom.length > 15) gsap.set(filasDom.slice(15), { clearProps: "opacity,transform" });
  }, [firma, cargando]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={caja} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-ink-100 bg-neutral-0">
      <div ref={cuerpo} aria-busy={cargando || undefined} className={`min-h-0 flex-1 ${SCROLL_FINO}`}>
        {cargando && !esperando ? (
          <Esqueleto />
        ) : filas.length === 0 ? (
          vacio
        ) : (
          <>
            <table className="hidden w-full border-collapse text-sm sm:table" aria-label={etiqueta}>
              <thead className="sticky top-0 z-10 bg-neutral-0">
                <tr className="border-b border-ink-100">
                  {columnas.map((c) => (
                    <th key={c.titulo} scope="col"
                      className={`h-10 whitespace-nowrap px-4 font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500 first:pl-5 last:pr-5 ${c.derecha ? "text-right" : c.centro ? "text-center" : "text-left"} ${c.ocultar ?? ""} ${c.ancho ?? ""}`}>
                      {c.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const k = clave(f);
                  return (
                    <tr key={k} data-fila={k} onClick={(e) => !(e.target as HTMLElement).closest("[data-accion]") && alAbrir(f)}
                      className={`cursor-pointer border-b border-ink-100 transition-colors duration-150 last:border-b-0 [@media(hover:hover)]:hover:bg-ink-50/70 ${activa === k ? "bg-ink-50" : ""}`}>
                      {columnas.map((c, i) => (
                        <td key={c.titulo} className={`h-14 px-4 py-2 align-middle first:pl-5 last:pr-5 ${c.derecha ? "text-right" : c.centro ? "text-center" : ""} ${c.ocultar ?? ""}`}>
                          {i === 0 ? (
                            <button type="button" onClick={(e) => { e.stopPropagation(); alAbrir(f); }} data-abrir={k}
                              className="block w-full rounded-[8px] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
                              {c.celda(f)}
                            </button>
                          ) : c.celda(f)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ul className="divide-y divide-ink-100 sm:hidden" aria-label={etiqueta}>
              {filas.map((f) => {
                const k = clave(f);
                return (
                  <li key={k} data-fila={k}>
                    <button type="button" onClick={() => alAbrir(f)} data-abrir={k}
                      className="block w-full px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 active:bg-ink-50">
                      {movil(f)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      {pie && <div className="shrink-0 border-t border-ink-100 px-3 py-2 sm:px-5">{pie}</div>}
    </div>
  );
}

export interface Columna<T> {
  titulo: string;
  celda: (fila: T) => ReactNode;
  derecha?: boolean;
  /** Centrada, como las columnas de datos del portal CESS. */
  centro?: boolean;
  /** Clases para esconder la columna en pantallas más chicas (por ejemplo `hidden xl:table-cell`). */
  ocultar?: string;
  ancho?: string;
}

interface TablaProps<T> {
  etiqueta: string;
  filas: T[];
  columnas: Columna<T>[];
  clave: (fila: T) => string | number;
  alAbrir: (fila: T) => void;
  /** Lo que muestra cada fila en el celular. */
  movil: (fila: T) => ReactNode;
  pie?: ReactNode;
  cargando?: boolean;
  vacio?: ReactNode;
  activa?: string | number | null;
}

/** Las filas quietas, con el alto final: nada salta cuando llegan los datos. */
function Esqueleto() {
  return (
    <div aria-busy="true" className="flex flex-col">
      <div className="h-10 border-b border-ink-100" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex h-14 items-center gap-4 border-b border-ink-100 px-5">
          <span className="h-8 w-8 rounded-full bg-ink-50" />
          <span className="h-3 w-40 rounded-full bg-ink-50" />
          <span className="ml-auto h-3 w-24 rounded-full bg-ink-50" />
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** El estado vacío dentro de la tarjeta: qué pasó y qué hacer. */
export function Vacia({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-1.5 px-6 py-8 text-center">
      <p className="font-display text-lg font-semibold text-ink-900">{titulo}</p>
      {texto && <p className="text-sm text-neutral-700">{texto}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}

// --- Etiqueta de estado (Etapa 2, 2026-11-26) ------------------------------------------------------------------
// La de Sanalys (Halo Badge en vidrio, `insignia.css`), llena del color del estado: verde, ámbar, naranja, rojo o
// gris. Rechazadas: etiqueta sólida con ícono, ícono con texto sin caja, barra en la fila y el chip con punto.

/** El estado de una fila o de una tarjeta. La palabra dice el estado; el color lo repite y se nota. */
export function ChipPunto({ texto, tono }: { texto: string; tono: "nuevo" | "ok" | "neutro" | "marca" | "peligro" }) {
  return (
    <span className="panel-insignia" data-tono={tono}>
      <span className="panel-insignia-punto" aria-hidden />
      {texto}
    </span>
  );
}

/** Un botón de ícono para las acciones de una fila (siempre a la vista, nunca solo al pasar el mouse). */
export function BotonFila({ etiqueta, onClick, children, deshabilitado }: { etiqueta: string; onClick: () => void; children: ReactNode; deshabilitado?: boolean }) {
  return (
    <button type="button" data-accion aria-label={etiqueta} title={etiqueta} onClick={onClick} disabled={deshabilitado}
      className="inline-grid h-9 w-9 place-items-center rounded-[10px] text-ink-500 outline-none transition-[color,background-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.94] disabled:opacity-40 [@media(hover:hover)]:hover:bg-ink-50 [@media(hover:hover)]:hover:text-ink-900">
      {children}
    </button>
  );
}
