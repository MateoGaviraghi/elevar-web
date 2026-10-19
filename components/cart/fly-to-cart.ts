import type { Modality } from "@/types";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { RAIL_GRADIENTS } from "@/components/catalog/course-rail-card";

/* Vuelo al carrito. (Vive en components/ para que Tailwind lea sus clases.)
 * Referencia: Codrops · Shopping Cart Animation (elegida por Mateo, 2026-10-19).
 * Una copia de la tapa del curso (color de la modalidad + código) sale de donde
 * se tocó "Agregar", sube, hace un arco y entra en la bolsa del header
 * achicándose (1,4 s power2.inOut). Mientras vuela, las otras tarjetas se apagan
 * (0,6 s) y vuelven (0,8 s). Al llegar se agrega el curso y la bolsa rebota.
 * El carrito queda cerrado (Mateo: "queda cerrado").
 */

interface FlyOptions {
  /** Desde dónde sale: la tapa de la tarjeta, o el botón si no hay tapa. */
  from: HTMLElement | null;
  code: string;
  modality: Modality;
  /** La tarjeta entera: sus hermanas se apagan mientras vuela. */
  card?: HTMLElement | null;
  /** Se llama al llegar (o al instante, con movimiento reducido). */
  onLand: () => void;
}

export function flyToCart({ from, code, modality, card, onLand }: FlyOptions): void {
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  const tr = target?.getBoundingClientRect();
  const land = onLand;

  if (!from || !tr || tr.width === 0 || prefersReducedMotion()) {
    land();
    return;
  }

  // La copia nace con el tamaño de la tapa; desde un botón, como un boleto de 160 × 100.
  const fr = from.getBoundingClientRect();
  const w = Math.min(fr.width, 320) || 160;
  const h = fr.height > 60 ? Math.min(fr.height, 240) : 100;
  const left = fr.width > 60 ? fr.left : fr.left + fr.width / 2 - w / 2;
  const top = fr.height > 60 ? fr.top : fr.top - h - 8;

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = `pointer-events-none fixed z-[80] overflow-hidden bg-gradient-to-br shadow-[0_24px_60px_-20px_rgba(15,23,42,0.55)] ${RAIL_GRADIENTS[modality]}`;
  Object.assign(ghost.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` });
  const label = document.createElement("span");
  label.className = "absolute bottom-4 left-5 font-display text-5xl font-semibold tracking-tight text-neutral-0";
  label.textContent = code;
  ghost.appendChild(label);
  document.body.appendChild(ghost);

  const dx = tr.left + tr.width / 2 - (left + w / 2);
  const dy = tr.top + tr.height / 2 - (top + h / 2);

  const siblings = card?.parentElement
    ? Array.from(card.parentElement.children).filter((el): el is HTMLElement => el !== card && el instanceof HTMLElement)
    : [];

  const tl = gsap.timeline({
    onComplete: () => {
      if (siblings.length) gsap.set(siblings, { clearProps: "opacity" });
    },
  });
  if (siblings.length) {
    tl.to(siblings, { opacity: 0.35, duration: 0.6, stagger: 0.04, ease: "power2.out" }, 0);
    tl.to(siblings, { opacity: 1, duration: 0.8, stagger: 0.03, ease: "power2.out" }, 1.2);
  }
  tl.to(
    ghost,
    {
      keyframes: {
        "35%": { x: dx * 0.12, y: -70, scale: 0.72, rotation: -5 },
        "100%": { x: dx, y: dy, scale: 0.06, rotation: 0, opacity: 0.6 },
      },
      duration: 1.4,
      ease: "power2.inOut",
    },
    0
  );
  tl.add(land, 1.32);
  tl.add(() => ghost.remove(), 1.4);
}
