"use client";

// Card de curso "Corrimiento" (referencias: DesignCode, card numerada + cult-ui
// Shift Card, panel que se revela). En reposo: bloque de color de la modalidad
// con el código grande y el título. Al pasar el mouse el bloque se achica a una
// franja, el código se corre a la esquina y entran bajada, datos y compra.
// Sin hover (teléfono) o con movimiento reducido se ve directamente abierta.

import { useRef } from "react";
import Link from "next/link";
import type { Course } from "@/types";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatARS } from "@/lib/formatters";
import { canQuickAdd, quickAddCourse } from "@/lib/quick-add";
import { courseWhen, RAIL_GRADIENTS } from "@/components/catalog/course-rail-card";
import { ModalityChip } from "@/components/ui/modality-chip";

const BAND = 56; // alto de la franja de color abierta (px)
const HOVER = "(hover: hover) and (prefers-reduced-motion: no-preference)";

function badgeLabel(badge: string): string {
  if (badge === "NUEVO") return "Nuevo";
  if (badge === "PROXIMO") return "Próximo";
  return badge;
}

interface CourseCardProps {
  course: Course;
  /** Posición en la grilla (0, 1, …): se muestra como "01", "02"… */
  index: number;
}

export function CourseCard({ course, index }: CourseCardProps) {
  const root = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const href = `/cursos/${course.slug}`;
  const free = parseFloat(course.price) === 0;
  const meta = [course.duration_hours ? `${course.duration_hours} h` : null, course.level || null, courseWhen(course)].filter(
    Boolean
  ) as string[];

  // La línea de tiempo se mide sobre la card real; se rehace al cambiar el ancho.
  const build = () => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const block = el.querySelector<HTMLElement>(".cr-block")!;
    const code = el.querySelector<HTMLElement>(".cr-code")!;
    const blockH = block.offsetHeight;
    const s = 0.42;
    const bx = block.getBoundingClientRect();
    const cx = code.getBoundingClientRect();
    const t = gsap.timeline({ paused: true, defaults: { duration: 1.1, ease: "expo.inOut" } });
    t.to(q(".cr-bg"), { scaleY: BAND / blockH }, 0)
      .to(q(".cr-num, .cr-badge"), { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 0)
      .to(
        code,
        {
          x: bx.right - 20 - cx.width * s - cx.left,
          y: bx.top + (BAND - cx.height * s) / 2 - cx.top,
          scale: s,
        },
        0
      )
      .to(q(".cr-body"), { y: -(blockH - BAND) }, 0)
      .fromTo(q(".cr-more"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.9, ease: "expo.out" }, 0.35);
    return t;
  };

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(HOVER, () => {
        gsap.set(root.current!.querySelectorAll(".cr-more"), { autoAlpha: 0 });
        const reset = () => {
          tl.current?.progress(0).kill();
          tl.current = null;
        };
        window.addEventListener("resize", reset);
        return () => {
          window.removeEventListener("resize", reset);
          reset();
        };
      });
      mm.add(`not all and ${HOVER}`, () => {
        // Teléfono / movimiento reducido: abierta desde el arranque.
        tl.current = build().progress(1);
        const reset = () => {
          tl.current?.progress(0).kill();
          tl.current = build().progress(1);
        };
        window.addEventListener("resize", reset);
        return () => {
          window.removeEventListener("resize", reset);
          tl.current?.progress(0).kill();
          tl.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const enter = contextSafe(() => {
    if (!window.matchMedia(HOVER).matches) return;
    if (!tl.current) tl.current = build();
    tl.current.timeScale(1).play();
  });
  const leave = contextSafe(() => {
    if (!window.matchMedia(HOVER).matches || !tl.current) return;
    tl.current.timeScale(1.4).reverse();
  });

  const btn =
    "relative isolate inline-flex h-10 items-center gap-2 overflow-hidden whitespace-nowrap bg-brand-500 px-4 text-sm font-semibold text-neutral-0 before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-ink-900 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.19,1,0.22,1)] hover:before:scale-y-100";

  return (
    <article
      ref={root}
      onPointerEnter={enter}
      onPointerLeave={leave}
      className="relative flex h-[360px] flex-col overflow-hidden border border-neutral-200 bg-neutral-0 transition-[border-color] duration-500 hover:border-ink-900 md:h-[420px] lg:h-[360px]"
    >
      <Link href={href} className="absolute inset-0 z-0" aria-label={`Ver curso: ${course.title}`} />

      {/* Bloque de color: el fondo se achica con scaleY; el código viaja a la esquina */}
      <div className="cr-block pointer-events-none relative h-[52%] shrink-0">
        <div className={`cr-bg absolute inset-0 origin-top bg-gradient-to-br ${RAIL_GRADIENTS[course.modality]}`} />
        <span className="cr-num absolute left-6 top-5 font-mono text-xs tabular-nums text-neutral-0/60">
          {String(index + 1).padStart(2, "0")}
        </span>
        {course.badge && (
          <span className="cr-badge absolute right-6 top-5 bg-neutral-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600">
            {badgeLabel(course.badge)}
          </span>
        )}
        <span className="cr-code absolute bottom-5 left-6 origin-top-left font-display text-5xl font-semibold tracking-tight text-neutral-0">
          {course.code}
        </span>
      </div>

      {/* Cuerpo: sube cuando el bloque se achica; lo de abajo entra escalonado */}
      <div className="cr-body pointer-events-none relative flex flex-col px-6 pt-5">
        <ModalityChip modality={course.modality} className="self-start" />
        <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900">{course.title}</h3>
        <p className="cr-more mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-700">{course.summary}</p>
        <p className="cr-more mt-3 flex flex-wrap gap-x-2 text-[13px] text-neutral-500">
          {meta.map((m, i) => (
            <span key={m}>
              {i > 0 && <span className="mr-2 text-neutral-200">·</span>}
              {m}
            </span>
          ))}
        </p>
        <div className="cr-more pointer-events-auto relative z-10 mt-5 flex items-center justify-between gap-4 border-t border-neutral-200 pt-4">
          <span className="font-display text-xl font-semibold text-ink-900">{free ? "Gratis" : formatARS(course.price)}</span>
          {canQuickAdd(course) ? (
            <button type="button" onClick={() => quickAddCourse(course, root.current?.querySelector<HTMLElement>(".cr-block") ?? null, root.current)} className={btn}>
              <span aria-hidden className="text-lg leading-none">+</span>
              Agregar al carrito
            </button>
          ) : course.modality === "WEBINAR" ? (
            <Link href={href} className={btn}>
              Inscribite gratis
            </Link>
          ) : (
            <span className="text-sm font-semibold text-neutral-500">Próximamente</span>
          )}
        </div>
      </div>
    </article>
  );
}
