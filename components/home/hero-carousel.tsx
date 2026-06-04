"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

interface Slide {
  img: string;
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
}

const SLIDES: Slide[] = [
  {
    img: "/assets/hero/slide-auditorias.png",
    eyebrow: "Mejora continua",
    title: "Auditorías internas",
    desc: "Evaluamos los sistemas de gestión de calidad de los laboratorios para mantener la confianza de sus clientes.",
    href: "/servicios/auditorias-internas",
  },
  {
    img: "/assets/hero/slide-acreditacion.png",
    eyebrow: "Seguridad y reconocimiento",
    title: "Acompañamiento en el proceso de acreditación",
    desc: "Expertos en diferentes campos ayudan a lograr y mantener un posicionamiento en el mercado basado en el reconocimiento de la competencia técnica.",
    href: "/servicios/acreditacion-iso-17025",
  },
  {
    img: "/assets/hero/slide-iso17025.png",
    eyebrow: "Trayectoria y experiencia",
    title: "Implementación ISO/IEC 17025",
    desc: "Nos unimos a los laboratorios que deseen, de forma voluntaria, desarrollar un sistema de gestión basado en la competencia técnica.",
    href: "/servicios/implementacion-normativa",
  },
  {
    img: "/assets/hero/slide-gestion.png",
    eyebrow: "Respaldo y confianza",
    title: "Especialistas en gestión de calidad",
    desc: "Elevar es una consultora de gestión de calidad aplicada a laboratorios de primera, segunda y tercera parte.",
    href: "/servicios/gestion",
  },
];

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = SLIDES.length;

  const go = useCallback((delta: number) => setIndex((p) => (p + delta + n) % n), [n]);

  // Swipe táctil (feel de app nativa en teléfono).
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % n), 6500);
    return () => clearInterval(id);
  }, [paused, n]);

  const slide = SLIDES[index];

  const containerV = {
    initial: {},
    animate: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };
  const itemV = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-64px)] items-center overflow-hidden bg-ink-900 text-neutral-0 md:min-h-[calc(100vh-100px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carrusel"
    >
      {/* Slide images (crossfade + slow zoom) */}
      <AnimatePresence initial={false}>
        <motion.img
          key={slide.img}
          src={slide.img}
          alt=""
          aria-hidden
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0.3 } : { opacity: { duration: 1 }, scale: { duration: 8, ease: "linear" } }}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-900 via-ink-900/80 to-ink-900/10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/70 to-transparent" />

      {/* Slide text */}
      <Container className="relative w-full">
        <div className="relative max-w-2xl py-20 sm:py-24 md:py-28">
          <div className="relative min-h-[300px] sm:min-h-[340px] md:min-h-[360px]">
            <AnimatePresence>
              <motion.div
                key={index}
                className="absolute inset-x-0 top-0"
                variants={containerV}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.div variants={itemV} className="mb-6 flex items-center gap-3">
                  <span className="h-px w-10 bg-brand-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                    {slide.eyebrow}
                  </span>
                </motion.div>
                <motion.h1
                  variants={itemV}
                  className="text-balance font-display text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-4xl sm:leading-[1.08] md:text-5xl md:leading-[1.06] lg:text-6xl"
                >
                  {slide.title}
                </motion.h1>
                <motion.p variants={itemV} className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-neutral-200 sm:mt-6 sm:text-lg">
                  {slide.desc}
                </motion.p>
                <motion.div variants={itemV} className="mt-9">
                  <Button variant="link" href={slide.href} className="text-neutral-0 hover:text-brand-400">
                    Conocé más
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>

      {/* Arrows */}
      <button
        onClick={() => go(-1)}
        aria-label="Slide anterior"
        className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-neutral-0/60 transition-colors hover:text-neutral-0 md:left-5 md:flex"
      >
        <Chevron dir="left" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Slide siguiente"
        className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-neutral-0/60 transition-colors hover:text-neutral-0 md:right-5 md:flex"
      >
        <Chevron dir="right" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
        {SLIDES.map((s, idx) => (
          <button
            key={s.img}
            onClick={() => setIndex(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
            aria-current={idx === index}
            className={`h-1 transition-all duration-300 ${
              idx === index ? "w-9 bg-brand-500" : "w-4 bg-neutral-0/40 hover:bg-neutral-0/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
