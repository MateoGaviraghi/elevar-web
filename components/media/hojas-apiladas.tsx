"use client";

/* Muestra real de lo que recibe el alumno, en lugar del video que no hay (KAN-39).
 * Mateo eligió «Apiladas» (de Stripe Atlas) entre tres prototipos el 2026-11-18: tres hojas
 * encimadas sobre un bloque naranja. Al llegar, el bloque se abre desde la derecha y las hojas
 * entran una detrás de otra; después quedan quietas. Se usa en Inicio y en Formación.
 * Ficha y comprobante son capturas de las páginas que ya arma la web (curso CA55, compra de
 * prueba con datos inventados). El certificado es un ejemplo hasta que Laura mande el real. */

import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { useMotion } from "@/components/curso/ficha-parts";

type Hoja = { key: string; nombre: string; src: string; alt: string };

// De atrás hacia adelante.
const HOJAS: Hoja[] = [
  { key: "certificado", nombre: "Certificado", src: "/assets/muestra/certificado.webp", alt: "Certificado de aprobación de ejemplo" },
  { key: "comprobante", nombre: "Comprobante", src: "/assets/muestra/comprobante.webp", alt: "Comprobante de inscripción con número de orden y total pagado" },
  { key: "ficha", nombre: "Ficha del curso", src: "/assets/muestra/ficha.webp", alt: "Ficha del curso CA55 con objetivos, temario y modalidad" },
];

// Posición de cada hoja dentro del cuadro (en % del ancho y del alto) y su giro.
const LUGAR = [
  { left: "4%", top: "5%", rot: -5 },
  { left: "30%", top: "13%", rot: 2 },
  { left: "56%", top: "21%", rot: -1.5 },
];

export function HojasApiladas() {
  const ref = useMotion<HTMLDivElement>((root) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top 70%", once: true } });
    tl.from(root.querySelector(".ap-bloque"), { scaleX: 0, transformOrigin: "right center", duration: 1.3, ease: "expo.inOut" })
      .from(root.querySelectorAll(".ap-hoja"), { y: 90, rotate: (i: number) => LUGAR[i].rot + 8, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.22 }, "-=0.55");
    // Arranca oculto desde el primer cuadro (`data-reveal` + clase `js`); ya con el estado
    // inicial puesto por los `from`, se muestra sin parpadeo.
    gsap.set(root, { visibility: "inherit" });
  });
  return (
    <div ref={ref} data-reveal="" className="relative aspect-[5/4] w-full">
      <div className="ap-bloque absolute bottom-[6%] left-[16%] right-0 top-[9%] bg-brand-500" />
      {HOJAS.map((hoja, i) => {
        const l = LUGAR[i];
        return (
          <figure
            key={hoja.key}
            className="ap-hoja absolute aspect-[1000/1414] w-[40%] bg-neutral-0 shadow-[0_24px_48px_-12px_rgba(11,30,51,0.45),0_2px_6px_rgba(11,30,51,0.18)]"
            style={{ left: l.left, top: l.top, zIndex: i + 1, transform: `rotate(${l.rot}deg)` }}
          >
            <Image src={hoja.src} alt={hoja.alt} fill sizes="(min-width: 1024px) 280px, 40vw" className="object-cover" />
            <figcaption className="absolute bottom-0 left-0 whitespace-nowrap bg-ink-900 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
              {hoja.nombre}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
