import type { ReactNode } from "react";

/**
 * Botones y chips de las pantallas de lista (los mismos de Consultas, 2026-11-25), para que Órdenes y las que
 * sigan se lean como un solo sistema: acciones de fila con ícono y texto, botones de la tarjeta (el principal
 * naranja se llena de azul tinta desde abajo) y los chips de la cabecera azul de la tarjeta.
 */

const ICONOS: Record<string, string> = {
  sobre: "M3.5 5.5h13v9h-13zM3.5 6l6.5 5 6.5-5",
  tilde: "m4.5 10.5 3.5 3.5 7.5-8",
  whatsapp: "M10 3.2a6.8 6.8 0 0 0-5.9 10.2L3.2 16.8l3.5-.9A6.8 6.8 0 1 0 10 3.2zM7.6 7.3c.2-.4.5-.4.7-.4l.4.1.6 1.4-.4.7.9 1.2 1.2.8.7-.4 1.4.6v.4c0 .3-.2.7-.6.9-.5.3-1.3.4-2.6-.3a7.3 7.3 0 0 1-2.6-2.6c-.6-1.1-.4-1.9-.1-2.4",
  abrir: "M8 4.5H4.5v11h11V12M11 4.5h4.5V9M15.5 4.5 9 11",
  llave: "M7 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM9.5 10.5l6-6M13 7l2 2M11.5 8.5l1.5 1.5",
  ojo: "M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5zM10 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z",
  copiar: "M7 7V4.5h8.5V13H13M4.5 7H13v8.5H4.5z",
  persona: "M4 16.5c.9-2.6 3.1-4 6-4s5.1 1.4 6 4M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  tarjeta: "M3 5.5h14v9H3zM3 8.5h14M6 12h3",
  devuelta: "M7.5 6 4.5 9l3 3M4.5 9H12a3.5 3.5 0 0 1 0 7H9",
  nota: "M5 3.5h7l3 3v10H5zM8 9.5h4M8 12.5h4",
};

export function Ic({ nombre, tam = 18 }: { nombre: string; tam?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d={ICONOS[nombre]} />
    </svg>
  );
}

/** Un botón de la fila con ícono y texto: se entiende sin pasar el mouse. */
export function BotonAccion({ icono, children, onClick, etiqueta, variante = "contorno" }: { icono: string; children: ReactNode; onClick: () => void; etiqueta: string; variante?: "contorno" | "suave" | "marca" }) {
  const estilo = {
    contorno: "border border-ink-200 bg-neutral-0 text-ink-900 [@media(hover:hover)]:hover:border-ink-900",
    suave: "bg-ink-50 text-ink-900 [@media(hover:hover)]:hover:bg-ink-100",
    marca: "bg-brand-500 text-neutral-0 [@media(hover:hover)]:hover:bg-brand-600",
  }[variante];
  return (
    <button type="button" data-accion aria-label={etiqueta} onClick={onClick}
      className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 font-sub text-[13px] font-semibold outline-none transition-[background-color,border-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.96] ${estilo}`}>
      <Ic nombre={icono} tam={16} />
      {children}
    </button>
  );
}

/** Los botones de la tarjeta: el principal naranja se llena de azul tinta desde abajo; el de contorno, blanco. */
export function BotonFicha({ children, onClick, href, externo, variante = "principal", deshabilitado, icono }: { children: ReactNode; onClick?: () => void; href?: string; externo?: boolean; variante?: "principal" | "contorno" | "claro" | "peligro"; deshabilitado?: boolean; icono?: string }) {
  const estilo = {
    principal: "bg-brand-500 text-neutral-0",
    contorno: "border border-ink-200 bg-neutral-0 text-ink-900 [@media(hover:hover)]:hover:border-ink-900",
    claro: "bg-neutral-0/10 text-neutral-0 [@media(hover:hover)]:hover:bg-neutral-0/20",
    peligro: "border border-status-error/40 bg-neutral-0 text-status-error [@media(hover:hover)]:hover:border-status-error",
  }[variante];
  const clase = `group relative inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-[12px] px-4 font-sub text-sm font-semibold outline-none transition-[transform,border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${estilo}`;
  const contenido = (
    <>
      {variante === "principal" && <span aria-hidden className="absolute inset-0 translate-y-full bg-ink-900 transition-transform duration-500 ease-[cubic-bezier(.22,.8,.24,1)] [@media(hover:hover)]:group-enabled:group-hover:translate-y-0" />}
      {icono && <span className="relative"><Ic nombre={icono} /></span>}
      <span className="relative whitespace-nowrap">{children}</span>
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
