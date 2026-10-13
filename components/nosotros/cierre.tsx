"use client";

// Cierre de /nosotros: bloque naranja completo antes del footer azul. Título
// grande en tinta por líneas (SplitLines) y dos salidas: el formulario de contacto
// (tinta que se llena de blanco) y WhatsApp (blanco que se llena de tinta).

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { SplitLines } from "@/components/anim/split-lines";
import { CONTACT } from "@/lib/contact";
import { CIERRE } from "./contenido";

// Botón tinta sobre naranja: se llena de blanco al pasar el mouse.
const INK_BUTTON =
  "group relative isolate inline-flex h-14 items-center justify-center gap-2 overflow-hidden bg-ink-900 px-8 text-sm font-semibold tracking-wide text-neutral-0 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-neutral-0 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-ink-900 hover:before:scale-y-100 motion-reduce:before:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-900 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500";

// Botón blanco sobre naranja: se llena de tinta al pasar el mouse.
const WHITE_BUTTON =
  "group relative isolate inline-flex h-14 items-center justify-center gap-2 overflow-hidden bg-neutral-0 px-8 text-sm font-semibold tracking-wide text-ink-900 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-ink-900 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-neutral-0 hover:before:scale-y-100 motion-reduce:before:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-900 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500";

export function Cierre() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      gsap.set(el, { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        el.querySelectorAll(".ci-in"),
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.2, scrollTrigger: { trigger: el, start: START, once: true } }
      );
    },
    { scope: root }
  );

  return (
    <section className="bg-brand-500 py-20 md:py-32">
      <Container>
        <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <SplitLines className="font-display text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[0.98] tracking-tight text-ink-900">
            {CIERRE.title}
          </SplitLines>
          <div ref={root} data-reveal="">
            <p className="ci-in text-lg leading-relaxed text-ink-900">{CIERRE.text}</p>
            <div className="ci-in mt-8 flex flex-wrap gap-3">
              <Link href="/contacto" className={INK_BUTTON}>
                Contactanos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  <line x1="4" y1="12" x2="19" y2="12" />
                  <polyline points="13 6 19 12 13 18" />
                </svg>
              </Link>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={WHITE_BUTTON}>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
