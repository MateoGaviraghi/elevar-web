"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/anim/counter";

export function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(".hero-eyebrow, .hero-line, .hero-sub, .hero-cta, .hero-stat", { opacity: 1, y: 0, yPercent: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { opacity: 0, y: 18, duration: 0.6 })
        .from(".hero-line", { yPercent: 115, duration: 0.95, stagger: 0.12 }, "-=0.2")
        .from(".hero-sub", { opacity: 0, y: 18, duration: 0.6 }, "-=0.45")
        .from(".hero-cta", { opacity: 0, y: 14, duration: 0.5, stagger: 0.1 }, "-=0.35")
        .from(".hero-stat", { opacity: 0, y: 14, duration: 0.5, stagger: 0.1 }, "-=0.25")
        .from(".hero-cue", { opacity: 0, duration: 0.6 }, "-=0.2");

      // Ken Burns in + parallax on scroll
      gsap.fromTo(img.current, { scale: 1.14 }, { scale: 1, duration: 2.6, ease: "power2.out" });
      gsap.to(img.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-ink-900 text-neutral-0"
    >
      <img
        ref={img}
        src="/assets/porque-elegirnos.png"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-900 via-ink-900/85 to-ink-900/30" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900 via-transparent to-ink-900/40" />

      <Container className="relative py-28">
        <div className="hero-eyebrow mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-brand-500" />
          <span className="text-xs uppercase tracking-widest text-neutral-300">
            Consultoría en calidad de laboratorio
          </span>
        </div>

        <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.03] tracking-tight md:text-6xl lg:text-7xl">
          <span className="block overflow-hidden py-[0.05em]">
            <span className="hero-line block">Elevamos la competencia</span>
          </span>
          <span className="block overflow-hidden py-[0.05em]">
            <span className="hero-line block">técnica de tu laboratorio</span>
          </span>
        </h1>

        <p className="hero-sub mt-8 max-w-xl text-lg leading-relaxed text-neutral-300">
          Formación, asistencia técnica, auditorías e implementación de la norma
          ISO/IEC&nbsp;17025 para laboratorios de ensayo y calibración en Argentina y LATAM.
        </p>

        <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="hero-cta">
            <Button variant="primary" size="lg" href="/formacion">
              Ver formación
            </Button>
          </div>
          <div className="hero-cta">
            <Button variant="link" href="/servicios" className="text-neutral-0 hover:text-brand-400">
              Conocé los servicios
            </Button>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-x-12 gap-y-4 border-t border-neutral-0/10 pt-6">
          <div className="hero-stat flex items-baseline gap-2">
            <Counter to={20} suffix="+" className="font-display text-xl font-semibold text-neutral-0" />
            <span className="text-sm text-neutral-400">años de experiencia</span>
          </div>
          <div className="hero-stat flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-neutral-0">LATAM</span>
            <span className="text-sm text-neutral-400">alcance regional</span>
          </div>
          <div className="hero-stat flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-neutral-0">OAA</span>
            <span className="text-sm text-neutral-400">experta técnica acreditadora</span>
          </div>
        </div>
      </Container>

      <div className="hero-cue pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-neutral-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce" aria-hidden>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>
    </section>
  );
}
