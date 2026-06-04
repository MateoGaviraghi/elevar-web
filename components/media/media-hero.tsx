"use client";

import { ReactNode, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Container } from "@/components/ui/container";

export interface MediaHeroProps {
  /** Imagen de fondo (poster si hay video). */
  image: string;
  /** Video de fondo opcional (mp4/webm). Si está, se reproduce en loop. */
  video?: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Contenido extra encima del título (breadcrumb) o debajo (CTA). */
  children?: ReactNode;
  /** Alto del hero. */
  size?: "md" | "lg" | "xl";
  className?: string;
}

const SIZES: Record<NonNullable<MediaHeroProps["size"]>, string> = {
  md: "min-h-[42vh] py-20 md:py-24",
  lg: "min-h-[58vh] py-24 md:py-32",
  xl: "min-h-[72vh] py-28 md:py-40",
};

/**
 * Hero premium con imagen o video de fondo, overlay para legibilidad,
 * Ken Burns sutil (escala) y parallax al scroll (GSAP ScrollTrigger, scrub).
 * Respeta prefers-reduced-motion.
 */
export function MediaHero({
  image,
  video,
  eyebrow,
  title,
  subtitle,
  children,
  size = "lg",
  className = "",
}: MediaHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      const bg = bgRef.current;
      if (!root || !bg || prefersReducedMotion()) return;

      // Entrada: zoom-out sutil al cargar (da vida sin animación perpetua).
      gsap.from(bg, { scale: 1.18, duration: 1.6, ease: "power2.out" });

      // Parallax: el fondo (sobredimensionado) se traslada con el scroll.
      gsap.to(bg, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      ScrollTrigger.refresh();
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className={`relative flex items-end overflow-hidden bg-ink-900 text-neutral-0 ${SIZES[size]} ${className}`}
    >
      {/* Fondo sobredimensionado (overscan) para que el parallax no muestre bordes */}
      <div ref={bgRef} className="pointer-events-none absolute -inset-[12%] -z-0 will-change-transform">
        {video ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={image}
          >
            <source src={video} />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" aria-hidden className="h-full w-full object-cover" />
        )}
      </div>

      {/* Overlay: oscurece y da legibilidad, con un acento de marca abajo a la izquierda */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/40" />
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-ink-900/80 via-ink-900/30 to-transparent" />
      <span
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden
      />

      <Container className="relative w-full">
        <div className="max-w-3xl">
          {children}
          {eyebrow && (
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
                {eyebrow}
              </span>
            </div>
          )}
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">{subtitle}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
