"use client";

/**
 * Aviso de "consulta enviada" (pedido de Mateo 2026-11-06: "una animación con un card que te
 * haga un tilde, gracias por tu consulta, en breve, animado con el logo, un card tipo 3D tipo
 * alerta cuando envías el formulario").
 *
 * Entrada encadenada: el fondo se oscurece (0,5 s); la tarjeta llega desde abajo inclinada
 * hacia atrás y se endereza (1,2 s, expo.out); el logo arma sus niveles; el círculo naranja se
 * dibuja (0,7 s) y adentro el tilde (0,5 s); suben los textos y el botón. En la compu la tarjeta
 * se inclina hasta 6° siguiendo el mouse. Se cierra con "Listo", Esc o tocando afuera.
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/brand/logo";
import { LOGO_GRAY } from "@/components/brand/logo-geometry";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { pegar } from "@/lib/texto";

export function AvisoEnviado({ email, onClose }: { email: string; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      boton.current?.focus({ preventScroll: true });
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo(".av-veil", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0)
        .fromTo(
          ".av-card",
          { y: 120, rotateX: 28, scale: 0.88, autoAlpha: 0, transformOrigin: "50% 100%" },
          { y: 0, rotateX: 0, scale: 1, autoAlpha: 1, duration: 1.2 },
          0.1
        )
        .fromTo(".av-ring", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", autoRound: false }, 0.55)
        .fromTo(".av-check", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out", autoRound: false }, 1.1)
        .fromTo(".av-pop", { scale: 0.6 }, { scale: 1, duration: 0.9, ease: "back.out(2.2)" }, 0.55)
        .fromTo(".av-in", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 1.0);
    },
    { scope: root }
  );

  // Inclinación 3D siguiendo el mouse (solo con puntero fino, nunca en el celular).
  useEffect(() => {
    const el = card.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const rx = gsap.quickTo(el, "rotateX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotateY", { duration: 0.8, ease: "power3.out" });
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const y = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      ry(Math.max(-1, Math.min(1, x)) * 6);
      rx(Math.max(-1, Math.min(1, -y)) * 6);
    };
    // Empieza después de la entrada, para no pelearse con ella.
    const t = window.setTimeout(() => window.addEventListener("pointermove", mover), 1300);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointermove", mover);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div ref={root} className="fixed inset-0 z-[70] flex items-center justify-center p-4 [perspective:1400px]">
      <div aria-hidden onClick={onClose} className="av-veil absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]" />
      <div
        ref={card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="av-titulo"
        aria-describedby="av-texto"
        className="av-card relative w-full max-w-[420px] overflow-hidden bg-neutral-0 px-7 pb-8 pt-7 text-center [transform-style:preserve-3d] shadow-[0_2px_4px_rgba(11,30,51,0.08),0_24px_48px_-12px_rgba(11,30,51,0.35),0_80px_120px_-40px_rgba(11,30,51,0.55)] sm:px-10 sm:pb-10"
      >
        {/* Filo naranja arriba: la tarjeta como una pieza de la marca. */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand-500" />

        <div className="flex justify-center">
          <Logo wordColor={LOGO_GRAY} delay={0.35} className="h-7" />
        </div>

        <div className="av-pop mx-auto mt-7 grid h-24 w-24 place-items-center rounded-full bg-brand-50">
          <svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-hidden>
            <circle className="av-ring" cx="32" cy="32" r="29" stroke="#E94E1B" strokeWidth="3" pathLength={1} strokeDasharray="1 1" transform="rotate(-90 32 32)" />
            <path className="av-check" d="M19 33l9 9 17-19" stroke="#E94E1B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" />
          </svg>
        </div>

        <h2 id="av-titulo" className="av-in mt-6 text-balance font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
          ¡Gracias por tu consulta!
        </h2>
        <p id="av-texto" className="av-in mt-3 text-[15px] leading-relaxed text-neutral-700">
          <span className="block">{pegar("Te respondemos en breve a")}</span>
          <span className="block break-all font-semibold text-ink-900">{email}</span>
        </p>

        <button
          ref={boton}
          type="button"
          onClick={onClose}
          className="av-in mt-8 inline-flex h-12 w-full items-center justify-center bg-ink-900 text-[15px] font-semibold text-neutral-0 transition-colors hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Listo
        </button>
      </div>
    </div>,
    document.body
  );
}
