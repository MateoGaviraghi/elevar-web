"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, rutaDeIngreso } from "@/lib/admin/api";
import { ACCION, detalleDeEvento, fechaHora, textoDeError, type Tono } from "@/lib/admin/formato";
import type { EventoHistorial } from "@/lib/admin/tipos";
import { Chip } from "./ui";

/**
 * Piezas comunes de las pantallas con datos (05-PANTALLAS, «Estados que tiene toda pantalla»):
 * cargando, vacía, error y sin permiso; la lista que pasa a tarjetas en el celular; la
 * paginación; los filtros en la dirección.
 */

export type EstadoDatos<T> =
  | { tipo: "cargando" }
  | { tipo: "listo"; datos: T }
  | { tipo: "error"; mensaje: string; incidente: string }
  | { tipo: "sin-permiso" }
  | { tipo: "no-encontrado" };

/** Pide datos y resuelve 401 (al ingreso), 403, 404 y errores. `recargar` vuelve a pedir. */
export function useDatos<T>(pedir: () => Promise<T>, dependencias: unknown[]) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<EstadoDatos<T>>({ tipo: "cargando" });
  const pedirRef = useRef(pedir);
  pedirRef.current = pedir;

  const cargar = useCallback(async () => {
    setEstado((e) => (e.tipo === "listo" ? e : { tipo: "cargando" }));
    try {
      setEstado({ tipo: "listo", datos: await pedirRef.current() });
    } catch (error) {
      if (error instanceof ApiError && error.sinSesion) {
        router.replace(rutaDeIngreso(pathname));
        return;
      }
      if (error instanceof ApiError && error.sinPermiso) return setEstado({ tipo: "sin-permiso" });
      if (error instanceof ApiError && error.noEncontrado) return setEstado({ tipo: "no-encontrado" });
      setEstado({
        tipo: "error",
        mensaje: textoDeError(error instanceof ApiError ? error.code : undefined),
        incidente: Date.now().toString(36).toUpperCase(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router, ...dependencias]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { estado, recargar: cargar, setEstado };
}

/** Maneja un error de una acción (botón): 401 al ingreso; el resto, un texto para mostrar. */
export function useErrorDeAccion() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (error: unknown): string | null => {
      if (error instanceof ApiError && error.sinSesion) {
        router.replace(rutaDeIngreso(pathname));
        return null;
      }
      if (error instanceof ApiError && error.code === "TRANSICION_INVALIDA") return error.message;
      if (error instanceof ApiError && error.demasiados) return "Demasiados pedidos, esperá un momento.";
      return textoDeError(error instanceof ApiError ? error.code : undefined);
    },
    [pathname, router],
  );
}

export function Cargando({ filas = 5 }: { filas?: number }) {
  return (
    <div aria-busy="true" className="border border-neutral-200 bg-neutral-0">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex h-12 items-center gap-4 border-b border-neutral-200 px-4 last:border-b-0">
          <div className="h-3 w-24 bg-neutral-200" />
          <div className="h-3 flex-1 bg-neutral-200" />
          <div className="hidden h-3 w-32 bg-neutral-200 sm:block" />
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export function Vacio({ titulo, accion }: { titulo: string; accion?: ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-neutral-0 px-6 py-12 text-center">
      <p className="text-sm text-neutral-700">{titulo}</p>
      {accion && <div className="mt-4 flex justify-center">{accion}</div>}
    </div>
  );
}

export function EstadoNoListo({ estado, recargar, noEncontrado }: EstadoNoListoProps) {
  if (estado.tipo === "cargando") return <Cargando />;
  if (estado.tipo === "sin-permiso") {
    return (
      <Vacio
        titulo="No tenés acceso a esta sección."
        accion={<Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">Ir al inicio</Link>}
      />
    );
  }
  if (estado.tipo === "no-encontrado") {
    return <Vacio titulo={noEncontrado?.texto ?? "No encontramos lo que buscabas."} accion={noEncontrado?.volver} />;
  }
  if (estado.tipo === "error") {
    return (
      <div role="alert" className="border border-neutral-200 bg-neutral-0 px-6 py-12 text-center">
        <p className="text-sm text-neutral-900">{estado.mensaje}</p>
        <p className="mt-1 text-xs text-neutral-500">Código para soporte: {estado.incidente}</p>
        <button
          type="button"
          onClick={() => void recargar()}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Reintentar
        </button>
      </div>
    );
  }
  return null;
}

interface EstadoNoListoProps {
  estado: EstadoDatos<unknown>;
  recargar: () => void | Promise<void>;
  noEncontrado?: { texto: string; volver?: ReactNode };
}

export function Titulo({ children, bajada, acciones }: { children: ReactNode; bajada?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{children}</h1>
        {bajada && <p className="mt-1 text-sm text-neutral-500">{bajada}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-3">{acciones}</div>}
    </div>
  );
}

export function Estado({ texto, tono }: { texto: string; tono: Tono }) {
  return <Chip tone={tono}>{texto}</Chip>;
}

// --- Lista: tabla desde 768 px, tarjetas apiladas debajo (06-DISENO, «Tablas») -------------

export interface Columna<T> {
  titulo: string;
  celda: (fila: T) => ReactNode;
  derecha?: boolean;
  /** En la tarjeta del celular: se muestra como título (una sola columna). */
  principal?: boolean;
}

export function Lista<T>({ filas, columnas, clave, enlace }: ListaProps<T>) {
  const router = useRouter();
  return (
    <>
      <div className="hidden overflow-x-auto border border-neutral-200 bg-neutral-0 md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th
                  key={c.titulo}
                  scope="col"
                  className={`border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 ${c.derecha ? "text-right" : ""}`}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr
                key={clave(fila)}
                onClick={enlace ? () => router.push(enlace(fila)) : undefined}
                className={enlace ? "cursor-pointer hover:bg-neutral-50" : undefined}
              >
                {columnas.map((c, i) => (
                  <td
                    key={c.titulo}
                    className={`border-b border-neutral-200 px-4 py-3 align-middle text-sm text-ink-800 ${c.derecha ? "text-right tabular-nums" : ""}`}
                  >
                    {i === 0 && enlace ? (
                      <Link href={enlace(fila)} className="font-medium text-ink-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={(e) => e.stopPropagation()}>
                        {c.celda(fila)}
                      </Link>
                    ) : (
                      c.celda(fila)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {filas.map((fila) => {
          const principal = columnas.find((c) => c.principal) ?? columnas[0];
          const contenido = (
            <>
              <p className="font-medium text-ink-900">{principal.celda(fila)}</p>
              <dl className="mt-2 grid grid-cols-1 gap-1">
                {columnas
                  .filter((c) => c !== principal)
                  .map((c) => (
                    <div key={c.titulo} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{c.titulo}</dt>
                      <dd className="min-w-0 break-words text-right text-ink-800">{c.celda(fila)}</dd>
                    </div>
                  ))}
              </dl>
            </>
          );
          return (
            <li key={clave(fila)} className="border border-neutral-200 bg-neutral-0 p-4">
              {enlace ? (
                <Link href={enlace(fila)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  {contenido}
                </Link>
              ) : (
                contenido
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

interface ListaProps<T> {
  filas: T[];
  columnas: Columna<T>[];
  clave: (fila: T) => string | number;
  enlace?: (fila: T) => string;
}

// --- Filtros y página en la dirección (06-DISENO: «atrás» funciona y se puede compartir) -------

export function useFiltros<K extends string>(porDefecto: Record<K, string>) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const valores = {} as Record<K, string>;
  for (const k of Object.keys(porDefecto) as K[]) valores[k] = params.get(k) ?? porDefecto[k];

  const cambiar = useCallback(
    (cambios: Partial<Record<K | "pagina", string>>) => {
      const nuevos = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(cambios) as [string, string | undefined][]) {
        if (v === undefined || v === "" || v === (porDefecto as Record<string, string>)[k]) nuevos.delete(k);
        else nuevos.set(k, v);
      }
      if (!("pagina" in cambios)) nuevos.delete("pagina");
      const texto = nuevos.toString();
      router.replace(texto ? `${pathname}?${texto}` : pathname, { scroll: false });
    },
    [params, pathname, porDefecto, router],
  );

  const pagina = Math.max(1, Number.parseInt(params.get("pagina") ?? "1", 10) || 1);
  const porPagina = [25, 50, 100].includes(Number(params.get("por_pagina"))) ? Number(params.get("por_pagina")) : 25;
  const limpiar = () => router.replace(pathname, { scroll: false });
  return { valores, cambiar, pagina, porPagina, limpiar, clave: params.toString() };
}

export function Fichas<V extends string>({ etiqueta, valor, opciones, onCambiar }: FichasProps<V>) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{etiqueta}</legend>
      <span aria-hidden className="mr-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">{etiqueta}</span>
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(o.valor)}
            className={`min-h-[36px] border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activa ? "border-brand-100 bg-brand-50 text-brand-700" : "border-neutral-200 bg-neutral-0 text-neutral-700 hover:border-ink-900"
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </fieldset>
  );
}

interface FichasProps<V extends string> {
  etiqueta: string;
  valor: V;
  opciones: { valor: V; texto: string }[];
  onCambiar: (v: V) => void;
}

export function Paginacion({ pagina, porPagina, total, onPagina, onPorPagina }: PaginacionProps) {
  if (total === 0) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);
  const ultima = Math.max(1, Math.ceil(total / porPagina));
  const boton =
    "inline-flex min-h-[44px] items-center border border-neutral-200 bg-neutral-0 px-3 text-sm font-semibold text-ink-900 hover:border-ink-900 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
  return (
    <nav aria-label="Páginas" className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-700">
      <span className="tabular-nums">
        {desde}–{hasta} de {total}
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          Por página
          <select
            value={porPagina}
            onChange={(e) => onPorPagina(e.target.value)}
            className="min-h-[36px] border border-neutral-200 bg-neutral-0 px-2 text-sm text-ink-900"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button type="button" className={boton} disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
          Anterior
        </button>
        <button type="button" className={boton} disabled={pagina >= ultima} onClick={() => onPagina(pagina + 1)}>
          Siguiente
        </button>
      </div>
    </nav>
  );
}

interface PaginacionProps {
  pagina: number;
  porPagina: number;
  total: number;
  onPagina: (p: number) => void;
  onPorPagina: (v: string) => void;
}

export function Historial({ eventos }: { eventos: EventoHistorial[] }) {
  if (eventos.length === 0) return <p className="text-sm text-neutral-500">Todavía no hay cambios registrados.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {eventos.map((e, i) => {
        const detalle = detalleDeEvento(e.detalle);
        return (
          <li key={i} className="border-l-2 border-neutral-200 pl-3 text-sm">
            <p className="text-ink-900">{ACCION[e.accion] ?? e.accion}</p>
            {detalle && <p className="text-sm text-neutral-700">{detalle}</p>}
            <p className="text-xs text-neutral-500">
              {e.persona} · <time dateTime={e.fecha}>{fechaHora(e.fecha)}</time>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function Bloque({ titulo, children, acciones }: { titulo: string; children: ReactNode; acciones?: ReactNode }) {
  return (
    <section className="border border-neutral-200 bg-neutral-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">{titulo}</h2>
        {acciones}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{etiqueta}</dt>
      <dd className="mt-1 break-words text-sm text-ink-900">{children || "—"}</dd>
    </div>
  );
}
