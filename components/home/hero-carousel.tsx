"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap";
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

const SLIDE_MS = 7000;

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

/**
 * Hero del Inicio (GSAP). Imágenes: fundido de 1,4 s y acercamiento lento de 1,08
 * a 1 durante toda la diapositiva (7 s). Texto: el título sube línea por línea desde
 * una máscara y el resto escalonado; antes de cambiar, el texto actual sale en 0,45 s.
 * Avanza solo a la vista, sin el mouse encima y sin movimiento reducido.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const n = SLIDES.length;
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const first = useRef(true);

  useGSAP(
    (_ctx, contextSafe) => {
      const reduce = prefersReducedMotion();
      const imgs = gsap.utils.toArray<HTMLElement>(".hc-img");
      imgs.forEach((img, i) => {
        if (i !== index) gsap.to(img, { autoAlpha: 0, duration: reduce ? 0.2 : 1.4, ease: "power2.inOut" });
      });
      const cur = imgs[index];
      gsap.to(cur, { autoAlpha: 1, duration: reduce ? 0.2 : first.current ? 1.6 : 1.4, ease: "power2.inOut" });
      if (!reduce) {
        gsap.fromTo(
          cur,
          { scale: first.current ? 1.16 : 1.08 },
          { scale: 1, duration: SLIDE_MS / 1000 + 1.4, ease: first.current ? "expo.out" : "none" }
        );
      }

      const box = text.current!;
      gsap.set(box, { visibility: "inherit" });
      const items = box.querySelectorAll(".hc-item");
      const h1 = box.querySelector("h1")!;
      let split: SplitText | null = null;
      if (reduce) {
        gsap.fromTo([items, h1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      } else {
        // Título y resto arrancan juntos, cuando las fuentes están listas.
        gsap.set([items, h1], { autoAlpha: 0 });
        document.fonts.ready.then(contextSafe!(() => {
          if (!h1.isConnected) return;
          gsap.fromTo(items, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.09, delay: 0.1 });
          split = SplitText.create(h1, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
              gsap.set(h1, { autoAlpha: 1 });
              return gsap.from(self.lines, { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.08, delay: 0.14 });
            },
          });
        }));
      }
      first.current = false;
      busy.current = false;
      return () => split?.revert();
    },
    { scope: root, dependencies: [index] }
  );

  const { contextSafe } = useGSAP({ scope: root });
  const goTo = contextSafe((next: number) => {
    if (busy.current || next === index) return;
    busy.current = true;
    if (prefersReducedMotion()) {
      setIndex(next);
      return;
    }
    gsap.to(text.current!.querySelectorAll(".hc-item, h1"), {
      autoAlpha: 0,
      y: -18,
      duration: 0.45,
      ease: "power2.in",
      stagger: 0.03,
      onComplete: () => setIndex(next),
    });
  });
  const go = (delta: number) => goTo((index + delta + n) % n);

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
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !visible || prefersReducedMotion()) return;
    const id = setTimeout(() => go(1), SLIDE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, visible, index]);

  const slide = SLIDES[index];
  const running = !paused && visible;

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[calc(100svh-64px)] items-center overflow-hidden bg-ink-900 text-neutral-0 md:min-h-[calc(100vh-100px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carrusel"
    >
      {/* Imágenes apiladas: GSAP cruza la actual con la anterior */}
      {SLIDES.map((s) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.img}
          src={s.img}
          alt=""
          aria-hidden
          className="hc-img invisible absolute inset-0 -z-20 h-full w-full object-cover opacity-0"
        />
      ))}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-900 via-ink-900/80 to-ink-900/10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/70 to-transparent" />

      {/* Texto de la diapositiva */}
      <Container className="relative w-full">
        <div className="relative max-w-2xl py-20 sm:py-24 md:py-28">
          <div className="relative min-h-[300px] sm:min-h-[340px] md:min-h-[360px]">
            <div ref={text} key={index} data-hero-in="" className="absolute inset-x-0 top-0">
              <div className="hc-item mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-brand-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">{slide.eyebrow}</span>
              </div>
              <h1 className="text-balance font-display text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-4xl sm:leading-[1.08] md:text-5xl md:leading-[1.06] lg:text-6xl">
                {slide.title}
              </h1>
              <p className="hc-item mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-neutral-200 sm:mt-6 sm:text-lg">
                {slide.desc}
              </p>
              <div className="hc-item mt-9">
                <Button variant="link" href={slide.href} className="text-neutral-0 hover:text-brand-400">
                  Conocé más
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Flechas */}
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

      {/* Indicadores: el activo se llena durante los 7 s de la diapositiva */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
        {SLIDES.map((s, idx) => (
          <button
            key={s.img}
            onClick={() => goTo(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
            aria-current={idx === index}
            className={`relative h-1 overflow-hidden bg-neutral-0/30 transition-[width] duration-500 hover:bg-neutral-0/60 ${idx === index ? "w-12" : "w-4"}`}
          >
            {idx === index && (
              <span
                key={`${index}-${running}`}
                className="hc-progress absolute inset-0 origin-left bg-brand-500"
                style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
