"use client";

// Enfoque: el primer párrafo de presentación en grande ("capacidad resolutiva" y
// "respuesta rápida" en naranja), encendiéndose palabra por
// palabra con el scroll (opacidad 0,18 → 1, scrub suavizado); los otros dos al
// costado, más chicos, entran escalonados. Con movimiento reducido, todo a la vista.

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { ENFOQUE } from "./contenido";

export function Enfoque() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".ef-word",
        { opacity: 0.18 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: ".ef-lead", start: "top 80%", end: "bottom 50%", scrub: 0.8 } }
      );
      gsap.fromTo(
        ".ef-p",
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".ef-cols", start: START, once: true } }
      );
    },
    { scope: root }
  );

  return (
    <section ref={root} className="bg-neutral-0 py-24 md:py-36">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-20">
          <p className="ef-lead font-display text-[clamp(1.6rem,3.4vw,3rem)] font-semibold leading-[1.18] tracking-tight text-ink-900 [text-wrap:balance]">
            {ENFOQUE.lead.split(" ").map((w, i) => (
              <span key={i} className={`ef-word ${ENFOQUE.hot.includes(w) ? "text-brand-500" : ""}`}>
                {w}{" "}
              </span>
            ))}
          </p>
          <div className="ef-cols space-y-6 border-t border-neutral-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            {ENFOQUE.paragraphs.map((p) => (
              <p key={p} className="ef-p leading-relaxed text-neutral-700">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
