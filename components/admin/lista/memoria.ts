"use client";

import { useMemo } from "react";
import { useDatos, type EstadoDatos } from "../datos";
import { origenDe, panel, recordado, rutaDe } from "@/lib/admin/api";

/**
 * Pasar de una pantalla a otra sin esperar (Etapa 3, 2026-11-26; Mateo: «navego entre las páginas y está súper
 * lento»). Envuelve `useDatos` (que no se toca): si ya se vio lo que se pide, se muestra al instante y el pedido
 * sigue por detrás y lo reemplaza cuando llega. La memoria es de la pestaña (`lib/admin/api.ts`), nunca del disco.
 */
export function useDatosRecordados<T>(pedir: () => Promise<T>, dependencias: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ruta = useMemo(() => rutaDe(pedir), dependencias);
  const base = useDatos(pedir, dependencias);
  const guardado = ruta ? recordado<T>(ruta) : undefined;
  const e = base.estado;
  let estado: EstadoDatos<T> = e;
  if (e.tipo === "listo") {
    // Datos de otro filtro (los de antes, mientras llega el nuevo pedido): si este ya se vio, va el visto.
    const de = typeof e.datos === "object" && e.datos !== null ? origenDe.get(e.datos as object) : undefined;
    if (de !== undefined && de !== ruta && guardado !== undefined) estado = { tipo: "listo", datos: guardado };
  } else if (e.tipo === "cargando" && guardado !== undefined) {
    estado = { tipo: "listo", datos: guardado };
  }
  return { ...base, estado };
}

/**
 * Lo que pide cada pantalla al abrirse sin filtros, para pedirlo cuando el mouse pasa por el menú. Tiene que
 * coincidir con los `POR_DEFECTO` de cada página: si no coincide, solo se pierde la precarga (la verificación de
 * tiempos lo muestra).
 */
const AL_ABRIR: Record<string, () => Promise<unknown>[]> = {
  "/admin": () => [panel.inicio()],
  "/admin/consultas": () => [panel.consultas({ estado: "NEW", origen: "", q: "", orden: "nuevas", page: 1, page_size: 10 }), panel.consultaCifras()],
  "/admin/ordenes": () => [panel.ordenes({ estado: "PAID", medio: "", curso: "", q: "", orden: "viejas", page: 1, page_size: 10 }), panel.ordenCifras(), panel.cursos({ page_size: 100 })],
  "/admin/inscripciones": () => [panel.fechasInscripciones({ cuando: "PROXIMAS", tipo: "", curso: "", q: "", page: 1, page_size: 10 }), panel.inscripcionCifras(), panel.cursos({ page_size: 100 })],
  "/admin/cursos": () => [panel.cursos({ estado: "TODOS", modalidad: "", categoria: "", q: "", page: 1, page_size: 10 }), panel.cursoCifras(), panel.categorias()],
};

const ultimaPrecarga = new Map<string, number>();

/** Pide lo de una pantalla del menú, una vez cada 20 s como mucho; los errores se ignoran (la pantalla los muestra). */
export function precargar(href: string) {
  const pedidos = AL_ABRIR[href];
  if (!pedidos) return;
  const ahora = Date.now();
  if (ahora - (ultimaPrecarga.get(href) ?? 0) < 20_000) return;
  ultimaPrecarga.set(href, ahora);
  for (const p of pedidos()) void p.catch(() => {});
}
