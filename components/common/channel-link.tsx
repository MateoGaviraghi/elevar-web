"use client";

// Canales de contacto con ícono de marca (referencia: Olivier Larose · Creative
// Buttons). El logo queda quieto, en blanco; al pasar el mouse, tocar o enfocar con
// teclado, el relleno sube desde abajo en el color oficial de la marca (0,8 s, la
// misma curva que los botones del sitio). Al entrar en pantalla, `ChannelGroup`
// hace una sola "ola": cada cuadro muestra su color y lo suelta, escalonado.

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, START, useGSAP } from "@/lib/gsap";
import type { Channel } from "@/lib/contact";
import { BrandIcon, BRANDS } from "@/components/common/brand-icons";

export type ChannelSize = "md" | "sm";
const BOX: Record<ChannelSize, string> = { md: "h-11 w-11", sm: "h-9 w-9" };
const ICON: Record<ChannelSize, number> = { md: 20, sm: 16 };

const FILL =
  "ch-fill pointer-events-none absolute inset-0 origin-bottom scale-y-0 transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100 group-active:scale-y-100 motion-reduce:transition-none";

/** Cuadro con el logo y el relleno de marca. Se activa con el `group` que lo contiene. */
function Tile({ channel, size }: { channel: Channel; size: ChannelSize }) {
  return (
    <span
      className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden border border-neutral-0/20 text-neutral-0/80 transition-[color,border-color] duration-500 group-hover:border-transparent group-hover:text-neutral-0 group-focus-visible:border-transparent group-focus-visible:text-neutral-0 ${BOX[size]}`}
    >
      <span aria-hidden className={`${FILL} -z-10`} style={{ background: BRANDS[channel.brand].fill }} />
      <BrandIcon brand={channel.brand} size={ICON[size]} />
    </span>
  );
}

function linkProps(channel: Channel) {
  return {
    href: channel.href,
    "aria-label": channel.aria,
    ...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
  };
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** Solo el ícono (redes sociales). */
export function ChannelIcon({ channel, size = "md" }: { channel: Channel; size?: ChannelSize }) {
  return (
    <a {...linkProps(channel)} className={`group inline-flex ${FOCUS}`}>
      <Tile channel={channel} size={size} />
    </a>
  );
}

/** Ícono + dato (dirección, teléfono, WhatsApp, mail). Toda la fila es el enlace. */
export function ChannelRow({
  channel,
  size = "md",
  textClassName = "text-neutral-300 group-hover:text-neutral-0",
}: {
  channel: Channel;
  size?: ChannelSize;
  textClassName?: string;
}) {
  return (
    <a {...linkProps(channel)} className={`group flex items-center gap-4 ${FOCUS}`}>
      <Tile channel={channel} size={size} />
      <span className={`text-sm leading-relaxed transition-colors duration-500 ${textClassName}`}>{channel.text}</span>
    </a>
  );
}

/**
 * Contenedor de canales: al entrar en pantalla, cada cuadro sube y suelta su color
 * de marca una vez (0,9 s, escalonado 0,12 s). Después queda el hover normal.
 */
export function ChannelGroup({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const fills = gsap.utils.toArray<HTMLElement>(".ch-fill", root.current);
      if (!fills.length) return;
      // La ola se arma recién al dispararse: hasta entonces no deja estilos en línea,
      // que le ganarían al hover de CSS. `clamp()` asegura que se dispare aunque el
      // grupo quede al fondo de la página (footer) y no alcance el 78 %.
      const wave = () => {
        // El relleno tiene transición CSS para el hover: se apaga durante la ola.
        gsap.set(fills, { transition: "none" });
        const tl = gsap.timeline({
          onComplete: () => gsap.set(fills, { clearProps: "transition,transform,transformOrigin" }),
        });
        fills.forEach((f, i) => {
          tl.fromTo(f, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.45, ease: "expo.out" }, i * 0.12)
            .set(f, { transformOrigin: "50% 0%" }, i * 0.12 + 0.45)
            .to(f, { scaleY: 0, duration: 0.45, ease: "expo.in" }, i * 0.12 + 0.45);
        });
      };
      ScrollTrigger.create({ trigger: root.current, start: `clamp(${START})`, once: true, onEnter: wave });
    },
    { scope: root }
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
