"use client";

// Logo animado de ELEVAR — "Niveles" (referencias: Off+Brand, la construcción del
// logo; Dennis Snellenberg, la animación al pasar el mouse en su lugar).
// Entrada: las barras suben pasando un poco su altura y se asientan, como un
// medidor (1,3 s `back.out`); los arcos se dibujan de abajo hacia arriba y las
// letras de "ELEVAR" suben una por una. Mouse encima, foco o toque: pulso corto de
// niveles (0,7 s). El logo nunca sigue al cursor. Con movimiento reducido, quieto.

import { useId, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, START, useGSAP } from "@/lib/gsap";
import { LOGO_ARCS, LOGO_BARS, LOGO_LETTERS, LOGO_ORANGE, LOGO_VIEWBOX, LOGO_WORD } from "./logo-geometry";

export type LogoTrigger =
  /** Al montarse (header, menú del celular). */
  | "mount"
  /** Al entrar en pantalla con el scroll (footer). */
  | "scroll";

/** Alturas del pulso al pasar el mouse, por barra (izquierda, centro, derecha). */
const PULSO = [0.6, 0.35, 0.7];

export function Logo({
  wordColor,
  trigger = "mount",
  delay = 0.2,
  className,
}: {
  /** Color de "ELEVAR": gris sobre claro, blanco sobre oscuro. */
  wordColor: string;
  trigger?: LogoTrigger;
  delay?: number;
  /** Fija el alto (p. ej. `h-7`); el ancho sale de la proporción del logo. */
  className?: string;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const uid = useId().replace(/:/g, "");

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current!;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: "inherit" });
        return;
      }
      const q = gsap.utils.selector(el);
      const bars = q(".lg-bar");
      const draws = q(".lg-draw");
      const letters = q(".lg-letter");

      gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(draws, { strokeDashoffset: 1 });
      gsap.set(letters, { y: 440 });
      gsap.set(el, { visibility: "inherit" });

      const entrada = gsap
        .timeline({ paused: true, delay })
        .to(bars, { scaleY: 1, duration: 1.3, ease: "back.out(1.6)", stagger: 0.1 }, 0)
        .to(draws, { strokeDashoffset: 0, duration: 1.0, ease: "power3.out" }, 0.3)
        .to(letters, { y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, 0.45);

      const pulso = gsap.timeline({ paused: true });
      bars.forEach((b, i) =>
        pulso
          .to(b, { scaleY: PULSO[i], duration: 0.22, ease: "power2.in" }, i * 0.05)
          .to(b, { scaleY: 1, duration: 0.5, ease: "back.out(2)" }, 0.22 + i * 0.05)
      );

      if (trigger === "mount") entrada.play();
      else ScrollTrigger.create({ trigger: el, start: `clamp(${START})`, once: true, onEnter: () => entrada.play() });

      // El pulso se engancha al enlace que contiene el logo, si lo hay.
      const host = (el.closest("a") as HTMLElement | null) ?? el;
      const onEnter = contextSafe!(() => {
        if (entrada.progress() < 1 || pulso.isActive()) return;
        pulso.restart();
      });
      host.addEventListener("pointerenter", onEnter);
      host.addEventListener("focus", onEnter);
      return () => {
        host.removeEventListener("pointerenter", onEnter);
        host.removeEventListener("focus", onEnter);
      };
    },
    { scope: root }
  );

  const W = LOGO_WORD;
  return (
    <span ref={root} data-reveal="" className={`block ${className ?? ""}`}>
      <svg viewBox={LOGO_VIEWBOX} role="img" aria-label="Elevar" className="block h-full w-auto overflow-visible">
        <defs>
          <mask id={`${uid}-word`} maskUnits="userSpaceOnUse" x={W.x} y={W.y} width={W.w} height={W.h}>
            <image href={W.src} x={W.x} y={W.y} width={W.w} height={W.h} preserveAspectRatio="none" />
          </mask>
          <clipPath id={`${uid}-wclip`}>
            <rect x={W.x - 10} y={W.y - 10} width={W.w + 20} height={W.h + 20} />
          </clipPath>
          {LOGO_ARCS.map((a) => (
            <mask key={a.id} id={`${uid}-arc-${a.id}`} maskUnits="userSpaceOnUse" x="-2" y="0" width="680" height="981">
              <path className="lg-draw" d={a.draw} fill="none" stroke="#fff" strokeWidth="96" pathLength={1} strokeDasharray="1 1" />
            </mask>
          ))}
        </defs>

        <g fill={LOGO_ORANGE}>
          {LOGO_ARCS.map((a) => (
            <path key={a.id} d={a.d} mask={`url(#${uid}-arc-${a.id})`} />
          ))}
          {LOGO_BARS.map((b) => (
            <path key={b.id} d={b.d} className="lg-bar" />
          ))}
        </g>

        <g clipPath={`url(#${uid}-wclip)`}>
          {LOGO_LETTERS.map(([x0, x1], i) => (
            <g key={i} className="lg-letter">
              <rect x={x0 - 4} y={W.y} width={x1 - x0 + 8} height={W.h} fill={wordColor} mask={`url(#${uid}-word)`} />
            </g>
          ))}
        </g>
      </svg>
    </span>
  );
}
