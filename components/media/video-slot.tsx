"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

export interface VideoSlotProps {
  /** Imagen poster que se ve detrás del placeholder. */
  poster: string;
  /** Etiqueta que aclara que es un espacio para video (mockup). */
  label?: string;
  /** Relación de aspecto CSS, p.ej. "16/9" o "21/9". */
  aspect?: string;
  className?: string;
}

/**
 * Placeholder DELICADO de video (mockup): muestra el poster con un botón de play
 * sutil y una etiqueta que indica que ahí se insertará el video. No reproduce nada.
 */
export function VideoSlot({
  poster,
  label = "Video próximamente",
  aspect = "16/9",
  className = "",
}: VideoSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !imgRef.current) return;
      gsap.to(imgRef.current, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden border border-neutral-200 bg-ink-900 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={poster}
        alt=""
        aria-hidden
        className="absolute -inset-[8%] h-[116%] w-[116%] object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-ink-900/45 transition-colors duration-500 group-hover:bg-ink-900/35" />

      {/* Botón de play delicado (pulso solo en hover) */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid place-items-center">
          <span className="absolute h-16 w-16 rounded-full bg-brand-500/20 transition-transform duration-500 group-hover:scale-150 group-hover:bg-brand-500/10" aria-hidden />
          <span className="relative grid h-16 w-16 place-items-center rounded-full border border-neutral-0/40 bg-neutral-0/10 backdrop-blur-sm transition-transform duration-500 ease-out group-hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5 text-neutral-0" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Etiqueta de mockup */}
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 border border-neutral-0/20 bg-ink-900/40 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-0/90 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
        {label}
      </span>
    </div>
  );
}
