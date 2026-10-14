"use client";

import { ReactNode, useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion, airMasks, LINE_FROM } from "@/lib/gsap";
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
  md: "min-h-[36vh] py-16 sm:py-20 md:py-24",
  lg: "min-h-[46vh] py-20 sm:py-24 md:py-32",
  xl: "min-h-[60vh] py-24 sm:py-28 md:py-40",
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
  const contentRef = useRef<HTMLDivElement>(null);

  // Entrada: imagen, título y texto llegan juntos (nada aparece antes que el resto).
  // La imagen se abre acercándose y el título sube línea por línea desde una máscara.
  useGSAP(
    (_ctx, contextSafe) => {
      const root = ref.current;
      const bg = bgRef.current;
      const content = contentRef.current;
      if (!root || !bg || !content) return;
      if (prefersReducedMotion()) {
        gsap.set(root.querySelectorAll("[data-hero-in]"), { visibility: "inherit" });
        return;
      }

      // Todo arranca en el mismo instante, cuando las fuentes están listas (si no,
      // el título partido en líneas llegaría tarde respecto del resto).
      gsap.set([bg, content], { autoAlpha: 0 });
      let split: SplitText | null = null;
      const h1 = content.querySelector("h1");
      const parts = Array.from(content.children).filter((c) => c.tagName !== "H1");
      document.fonts.ready.then(contextSafe!(() => {
        if (!ref.current) return;
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.fromTo(bg, { autoAlpha: 0, scale: 1.22 }, { autoAlpha: 1, scale: 1, duration: 1.8 }, 0)
          .set(content, { autoAlpha: 1 }, 0)
          .from(parts, { y: 24, autoAlpha: 0, duration: 1.2, stagger: 0.08 }, 0.05);
        if (h1) {
          split = SplitText.create(h1, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
            airMasks(self.masks);
              return gsap.from(self.lines, { yPercent: LINE_FROM, duration: 1.3, ease: "expo.out", stagger: 0.08, delay: 0.05 });
            },
          });
        }
      }));

      // Parallax: el fondo (sobredimensionado) se traslada con el scroll.
      gsap.to(bg, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
      ScrollTrigger.refresh();
      return () => split?.revert();
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className={`relative flex items-end overflow-hidden bg-ink-900 text-neutral-0 ${SIZES[size]} ${className}`}
    >
      {/* Fondo sobredimensionado (overscan) para que el parallax no muestre bordes */}
      <div ref={bgRef} data-hero-in="" className="pointer-events-none absolute -inset-[12%] -z-0 will-change-transform">
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
        <div ref={contentRef} data-hero-in="" className="max-w-3xl">
          {children}
          {eyebrow && (
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-300">
                {eyebrow}
              </span>
            </div>
          )}
          <h1 className="text-balance font-display text-[1.95rem] font-semibold leading-[1.12] tracking-tight sm:text-4xl sm:leading-[1.08] md:text-5xl lg:text-6xl lg:leading-[1.05]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-neutral-300 sm:mt-6 sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
