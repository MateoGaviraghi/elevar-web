"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Course, Promo } from "@/types";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { setScrollLocked } from "@/components/anim/smooth-scroll";
import { CourseCarousel } from "@/components/catalog/course-carousel";
import { CourseRailCard, RAIL_GRADIENTS } from "@/components/catalog/course-rail-card";
import { CourseQuickDetail } from "@/components/catalog/course-quick-detail";

// Carrusel de cursos con detalle rápido: la tarjeta crece desde su lugar hasta una
// ventana centrada (en el teléfono, a pantalla completa). Referencias: Apple · Get to
// know iPhone (fila) y Aceternity · Apple Cards Carousel (ventana).

export function CourseRail({
  courses,
  promos,
  label,
  header,
}: {
  courses: Course[];
  promos: Promo[];
  label: string;
  header?: ReactNode;
}) {
  const [open, setOpen] = useState<{ course: Course; from: HTMLElement } | null>(null);
  return (
    <>
      <CourseCarousel label={label} header={header}>
        {courses.map((c) => (
          <CourseRailCard key={c.id} course={c} onOpen={(course, el) => setOpen({ course, from: el })} />
        ))}
      </CourseCarousel>
      {open && <Ventana course={open.course} from={open.from} promos={promos} onClosed={() => setOpen(null)} />}
    </>
  );
}

function Ventana({ course, from, promos, onClosed }: { course: Course; from: HTMLElement; promos: Promo[]; onClosed: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  // Lleva el marco (en su lugar final) a la tarjeta: escala pareja (el texto no se
  // deforma) y centros alineados.
  function toCard() {
    const a = from.getBoundingClientRect();
    const b = frame.current!.getBoundingClientRect();
    const scale = Math.min(a.width / b.width, a.height / b.height);
    return {
      x: a.left + a.width / 2 - (b.left + b.width / 2),
      y: a.top + a.height / 2 - (b.top + b.height / 2),
      scale,
    };
  }

  // Apertura: la ventana entera (con su contenido) crece desde la tarjeta, todo junto.
  const { contextSafe } = useGSAP(
    () => {
      setScrollLocked(true);
      const reduce = prefersReducedMotion();
      const tl = gsap.timeline();
      tl.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: reduce ? 0.2 : 0.7, ease: "power2.out" }, 0);
      if (reduce) {
        tl.fromTo(frame.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0);
      } else {
        tl.fromTo(frame.current, { ...toCard(), opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 1, ease: "expo.out" }, 0)
          .fromTo(".qd-item", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.035 }, 0.08)
          .fromTo(".vt-code", { yPercent: 30 }, { yPercent: 0, duration: 1, ease: "expo.out" }, 0);
      }
      return () => setScrollLocked(false);
    },
    { scope: root }
  );

  const close = contextSafe(() => {
    if (closing.current) return;
    closing.current = true;
    const reduce = prefersReducedMotion();
    gsap
      .timeline({ onComplete: onClosed })
      .to(frame.current, reduce ? { opacity: 0, duration: 0.15 } : { ...toCardFromCurrent(), opacity: 0, duration: 0.6, ease: "expo.in" }, 0)
      .to(overlay.current, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, reduce ? 0 : 0.15);
  });

  // Al cerrar el marco ya está en su lugar (sin transformar): misma cuenta.
  function toCardFromCurrent() {
    gsap.set(frame.current, { clearProps: "transform" });
    return toCard();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  // Teléfono: arrastrar la cabecera hacia abajo cierra.
  const drag = useRef<{ y0: number; dy: number } | null>(null);

  return (
    <div ref={root} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={course.title}>
      <div ref={overlay} className="absolute inset-0 bg-ink-900/60" onClick={close} aria-hidden />
      <div className="pointer-events-none absolute inset-0 flex items-stretch justify-center sm:items-center sm:p-8">
        <div ref={frame} className="pointer-events-auto relative h-full w-full sm:h-auto sm:max-h-[88dvh] sm:max-w-[880px]">
          <div
            ref={panel}
            className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-0 sm:max-h-[88dvh] sm:flex-row sm:border sm:border-neutral-200"
          >
            <div
              className={`relative h-[150px] shrink-0 touch-none overflow-hidden bg-gradient-to-br sm:h-auto sm:w-[240px] ${RAIL_GRADIENTS[course.modality]}`}
              onPointerDown={(e) => {
                if (e.pointerType === "mouse") return;
                drag.current = { y0: e.clientY, dy: 0 };
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                drag.current.dy = Math.max(0, e.clientY - drag.current.y0);
                gsap.set(frame.current, { y: drag.current.dy });
              }}
              onPointerUp={() => {
                const d = drag.current;
                drag.current = null;
                if (!d) return;
                if (d.dy > 110) {
                  gsap.set(frame.current, { y: 0 });
                  close();
                } else gsap.to(frame.current, { y: 0, duration: 0.5, ease: "power3.out" });
              }}
            >
              <svg className="absolute -right-12 -top-12 h-64 w-64 text-neutral-0/12" viewBox="0 0 200 200" fill="none" aria-hidden>
                <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2" />
                <circle cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="2" />
                <circle cx="100" cy="100" r="36" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="vt-code absolute bottom-5 left-6 font-display text-6xl font-bold tracking-tight text-neutral-0/90 sm:left-7 sm:text-5xl">
                {course.code}
              </span>
            </div>
            <button
              type="button"
              onClick={close}
              autoFocus
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center bg-neutral-0 text-ink-900 transition-colors hover:bg-ink-900 hover:text-neutral-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-7 sm:px-8 sm:pr-16">
              <CourseQuickDetail promos={promos} course={course} onClose={close} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
