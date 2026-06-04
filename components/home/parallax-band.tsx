"use client";

import { ReactNode, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Container } from "@/components/ui/container";

/** Interludio cinemático: foto de fondo con parallax y un enunciado encima. */
export function ParallaxBand({ image, children }: { image: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (bg.current) {
        gsap.to(bg.current, {
          yPercent: 18,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
      if (content.current) {
        gsap.from(content.current, {
          y: 34,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        });
      }
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[48vh] items-center overflow-hidden bg-ink-900 py-20 text-neutral-0 md:min-h-[56vh]"
    >
      <div ref={bg} className="pointer-events-none absolute -inset-[12%] -z-0 will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" aria-hidden className="h-full w-full object-cover opacity-50" />
      </div>
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-ink-900/40" />
      <span
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl"
        aria-hidden
      />
      <Container className="relative">
        <div ref={content}>{children}</div>
      </Container>
    </section>
  );
}
