"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";

/**
 * Imagen editorial: al llegar se abre como cortina (una placa del color del fondo
 * se retira hacia arriba) mientras la foto se acerca de 1,25 a 1,1; después la
 * foto se desplaza suave con el scroll (parallax). Sólo transform y opacity.
 */
export function RevealImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  curtain = "bg-neutral-0",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Color de la placa: el del fondo de la sección. */
  curtain?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const img = el.querySelector("img");
      const plate = el.querySelector(".ri-plate");
      gsap.set(img, { scale: 1.1 });
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: START, once: true } })
        .fromTo(plate, { scaleY: 1 }, { scaleY: 0, duration: 1.3, ease: "expo.inOut" }, 0)
        .fromTo(img, { scale: 1.25 }, { scale: 1.1, duration: 1.8, ease: "expo.out" }, 0.1);
      gsap.fromTo(
        img,
        { yPercent: -4 },
        { yPercent: 4, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} aria-hidden={alt ? undefined : true} className={`block w-full object-cover ${imgClassName}`} />
      <span
        aria-hidden
        className={`ri-plate pointer-events-none absolute inset-0 hidden origin-top motion-safe:[.js_&]:block ${curtain}`}
      />
    </div>
  );
}
