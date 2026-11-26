"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icono, escribirEn } from "../iconos";

/**
 * Botones y chips de las pantallas de lista (los mismos de Consultas, 2026-11-25), para que todas se lean como
 * un solo sistema: acciones de fila con ícono y texto, botones de la tarjeta (el principal naranja se llena de
 * azul tinta desde abajo) y los chips de la cabecera azul de la tarjeta.
 * Los íconos son los de `iconos.tsx`: a dos colores y se escriben al pasar el mouse, enfocar o tocar
 * (Mateo, 2026-11-26: «los seguís haciendo estáticos»).
 */

/** Un ícono de botón o de dato: el mismo `Icono` del menú, con el tamaño en píxeles. */
export function Ic({ nombre, tam = 18 }: { nombre: string; tam?: number }) {
  return <Icono nombre={nombre} tam={tam} grosor={1.9} />;
}

/**
 * El ícono de un bloque de la tarjeta (Llevarte la lista, En el sitio, Dar acceso, Escribirle): 24 px en un
 * cuadro de 44 px que contrasta. Se escribe al aparecer; el bloque que lo contiene lleva `data-escribe` para
 * que se reescriba al pasar el mouse.
 */
const CUADRO = {
  tinta: "bg-ink-900 text-neutral-0 [--acento:#F79268]",
  marca: "bg-brand-500 text-neutral-0 [--acento:#0B1E33]",
  suave: "bg-ink-50 text-ink-900",
  exito: "bg-status-success/15 text-ink-900 [--acento:#15803D]",
} as const;

export function CuadroIcono({ nombre, tono = "tinta" }: { nombre: string; tono?: keyof typeof CUADRO }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) escribirEn(el, 0.2);
  }, [nombre]);
  return (
    <span ref={ref} className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] ${CUADRO[tono]}`}>
      <Icono nombre={nombre} tam={24} grosor={1.9} />
    </span>
  );
}

/** Un botón de la fila con ícono y texto: se entiende sin pasar el mouse. */
export function BotonAccion({ icono, children, onClick, etiqueta, variante = "contorno" }: { icono: string; children: ReactNode; onClick: () => void; etiqueta: string; variante?: "contorno" | "suave" | "marca" }) {
  const estilo = {
    contorno: "border border-ink-200 bg-neutral-0 text-ink-900 [@media(hover:hover)]:hover:border-ink-900",
    suave: "bg-ink-50 text-ink-900 [@media(hover:hover)]:hover:bg-ink-100",
    marca: "bg-brand-500 text-neutral-0 [--acento:#0B1E33] [@media(hover:hover)]:hover:bg-brand-600",
  }[variante];
  return (
    <button type="button" data-accion aria-label={etiqueta} onClick={onClick}
      className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 font-sub text-[13px] font-semibold outline-none transition-[background-color,border-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.96] ${estilo}`}>
      <Ic nombre={icono} tam={18} />
      {children}
    </button>
  );
}

/**
 * Los botones de la tarjeta: el principal naranja se llena de azul tinta desde abajo; el de contorno, blanco.
 * El relleno crece con `scale-y` desde abajo: escondido mide 0 y no deja la línea que dejaba `translate-y-full`
 * en el borde redondeado (las «líneas azules» de «Nuevo curso», 2026-11-26). El texto y el ícono van encima.
 */
export function BotonFicha({ children, onClick, href, externo, variante = "principal", deshabilitado, icono }: { children: ReactNode; onClick?: () => void; href?: string; externo?: boolean; variante?: "principal" | "contorno" | "claro" | "peligro"; deshabilitado?: boolean; icono?: string }) {
  const estilo = {
    principal: "bg-brand-500 text-neutral-0 [--acento:#0B1E33] [@media(hover:hover)]:enabled:hover:[--acento:#F79268]",
    contorno: "border border-ink-200 bg-neutral-0 text-ink-900 [@media(hover:hover)]:hover:border-ink-900",
    claro: "bg-neutral-0/10 text-neutral-0 [--acento:#F79268] [@media(hover:hover)]:hover:bg-neutral-0/20",
    peligro: "border border-status-error/40 bg-neutral-0 text-status-error [--acento:#0B1E33] [@media(hover:hover)]:hover:border-status-error",
  }[variante];
  const clase = `group relative isolate inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-[12px] px-4 font-sub text-sm font-semibold outline-none transition-[transform,border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${estilo}`;
  const contenido = (
    <>
      {variante === "principal" && <span aria-hidden className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-ink-900 transition-transform duration-500 ease-[cubic-bezier(.22,.8,.24,1)] [@media(hover:hover)]:group-enabled:group-hover:scale-y-100" />}
      {icono && <Ic nombre={icono} tam={20} />}
      <span className="whitespace-nowrap">{children}</span>
    </>
  );
  if (href) return <a href={href} className={clase} {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{contenido}</a>;
  return <button type="button" onClick={onClick} disabled={deshabilitado} className={clase}>{contenido}</button>;
}

/** Un chip de la cabecera azul de la tarjeta, con un punto de color opcional. */
export function ChipOscuro({ children, punto }: { children: ReactNode; punto?: string }) {
  return (
    <span className="inline-flex min-h-[30px] items-center gap-2 rounded-full border border-neutral-0/25 bg-neutral-0/10 px-3 text-[13px] font-semibold">
      {punto && <span aria-hidden className={`h-2 w-2 rounded-full ${punto}`} />}
      {children}
    </span>
  );
}

/** El título chico de un bloque de la tarjeta. */
export function Rotulo({ children }: { children: ReactNode }) {
  return <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">{children}</p>;
}
