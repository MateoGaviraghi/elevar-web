"use client";

import { ElementType, ReactNode, useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";

export type RevealVariant = "up" | "fade" | "scale" | "blur" | "left" | "right";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Tipo de entrada. Permite que no todas las secciones animen igual. */
  variant?: RevealVariant;
  /** px a recorrer (para up/left/right/blur). */
  y?: number;
  /** si se setea, anima los hijos directos con este stagger (segundos) */
  stagger?: number;
  delay?: number;
  /** duración en segundos (mínimo 1,1 s: el sitio se mueve lento y parejo) */
  duration?: number;
  as?: ElementType;
  /** Momento de disparo (ScrollTrigger). Por defecto, con la sección ya en pantalla. */
  start?: string;
}

function fromVars(variant: RevealVariant, d: number): gsap.TweenVars {
  switch (variant) {
    case "up":
      return { y: d };
    case "blur":
      return { y: Math.round(d * 0.6), filter: "blur(10px)" };
    case "left":
      return { x: -d };
    case "right":
      return { x: d };
    case "scale":
      return { scale: 0.94 };
    case "fade":
    default:
      return {};
  }
}

function toVars(variant: RevealVariant): gsap.TweenVars {
  switch (variant) {
    case "up":
      return { y: 0 };
    case "blur":
      return { y: 0, filter: "blur(0px)" };
    case "left":
    case "right":
      return { x: 0 };
    case "scale":
      return { scale: 1 };
    case "fade":
    default:
      return {};
  }
}

/**
 * Entrada al viewport con GSAP ScrollTrigger: sube (o entra de costado) con
 * expo.out, y con `stagger` escalona los hijos directos. Arranca oculto desde el
 * primer cuadro (`data-reveal` + clase `js`), así nada parpadea al cargar.
 * Movimiento reducido: todo visible, sin desplazamientos.
 */
export function Reveal({
  children,
  className,
  variant = "up",
  y = 40,
  stagger,
  delay = 0,
  duration = 1.2,
  as: Tag = "div",
  start = START,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: "inherit" });
        return;
      }
      const targets = stagger != null ? Array.from(el.children) : [el];
      if (stagger != null) gsap.set(el, { visibility: "inherit" });
      // Valor final explícito: un hijo con transición CSS (p. ej. `transition-all`)
      // puede estar a mitad de camino cuando el efecto vuelve a correr, y un
      // `from` tomaría ese valor intermedio (opacidad 0) como destino.
      gsap.fromTo(targets, { ...fromVars(variant, y), autoAlpha: 0 }, {
        ...toVars(variant),
        autoAlpha: 1,
        duration: Math.max(duration, 1.1),
        ease: "expo.out",
        delay,
        stagger: stagger != null ? Math.max(stagger, 0.07) : 0,
        clearProps: "filter",
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref as never} className={className} data-reveal="">
      {children}
    </Tag>
  );
}
