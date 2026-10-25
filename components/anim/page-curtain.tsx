"use client";

/* Transición entre páginas: cortina curva (referencia Dennis Snellenberg, "tu elección";
 * Mateo 2026-10-25 con "go"). Al hacer clic en un link a otra página del sitio, una
 * cortina tinta sube desde abajo con el borde de arriba curvo y el nombre de la página
 * adonde se va (0,8 s), la página cambia detrás, el nombre queda a la vista 0,25 s y la
 * cortina sigue subiendo con el borde de abajo curvo hasta destaparla (0,9 s). Tapa el corte seco y el cuadro en blanco del
 * cambio de página. Sin cortina: entre dos listas de modalidad (lo hace la lista), links
 * a otra pestaña, a otros sitios, mail/WhatsApp, a la misma página, al pago, atrás /
 * adelante y con movimiento reducido. Si la página tarda, espera hasta 4 s y se va igual.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { MODALITIES } from "@/lib/formacion-modalities";
import { FORMACION, SERVICIOS } from "@/lib/nav";

const EASE = "power3.inOut";
const COVER = 0.8;
const REVEAL = 0.9;
/** Pausa con el nombre a la vista antes de destapar (Mateo: "un poquito más lento, como una inmersión"). */
const HOLD = 0.25;
const MAX_WAIT = 4000;

/** Rutas fuera del sitio público (otro diseño): sin cortina. */
const OUTSIDE = /^\/(checkout|admin|pago-mp|pago-paypal|api)(\/|$)/;

const SECTION_LABEL: Record<string, string> = {
  "": "Inicio",
  formacion: "Formación",
  servicios: "Servicios",
  nosotros: "Nosotros",
  contacto: "Contacto",
  blog: "Blog",
  promociones: "Promociones",
  carrito: "Carrito",
  cursos: "Curso",
  orden: "Tu orden",
};

const isModalityList = (path: string) => {
  const slug = path.match(/^\/formacion\/([^/]+)$/)?.[1];
  return !!slug && MODALITIES.some((m) => m.slug === slug);
};

/** Nombre que muestra la cortina: el de la página adonde se va. */
function labelFor(path: string): string {
  const modality = path.match(/^\/formacion\/([^/]+)$/)?.[1];
  const m = modality && MODALITIES.find((x) => x.slug === modality);
  if (m) return m.title;
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1 && SECTION_LABEL[parts[0] ?? ""]) return SECTION_LABEL[parts[0] ?? ""];
  const fromNav = [...SERVICIOS, ...FORMACION].find((l) => l.href === path);
  if (fromNav) return fromNav.label;
  return SECTION_LABEL[path.split("/")[1] ?? ""] ?? "ELEVAR";
}

export function PageCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLParagraphElement>(null);
  const [label, setLabel] = useState("");
  /** Página adonde se va mientras la cortina tapa; null = sin transición en curso. */
  const target = useRef<string | null>(null);
  const fallback = useRef<number | null>(null);

  const reveal = () => {
    if (fallback.current) window.clearTimeout(fallback.current);
    fallback.current = null;
    const el = panel.current;
    if (!el || !root.current) return;
    gsap.to(word.current, { autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.in", delay: HOLD, overwrite: true });
    gsap.to(el, {
      yPercent: -118,
      duration: REVEAL,
      ease: EASE,
      delay: HOLD,
      overwrite: true,
      onComplete: () => {
        gsap.set(root.current, { autoAlpha: 0 });
        target.current = null;
      },
    });
  };

  // Clic en un link a otra página del sitio: la cortina tapa y recién ahí se navega.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const from = window.location.pathname;
      const to = url.pathname;
      if (to === from || OUTSIDE.test(to) || /\.[a-z0-9]{2,4}$/i.test(to)) return;
      if (isModalityList(from) && isModalityList(to)) return;
      if (prefersReducedMotion() || !panel.current || !root.current) return;
      e.preventDefault();
      if (target.current) return; // ya hay una en curso
      target.current = to;
      setLabel(labelFor(to));
      gsap.set(root.current, { autoAlpha: 1 });
      gsap.fromTo(word.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", delay: 0.4, overwrite: true });
      gsap.fromTo(
        panel.current,
        { yPercent: 118 },
        {
          yPercent: 0,
          duration: COVER,
          ease: EASE,
          overwrite: true,
          onComplete: () => {
            router.push(url.pathname + url.search + url.hash);
            fallback.current = window.setTimeout(reveal, MAX_WAIT);
          },
        }
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // La página nueva ya está: dos cuadros para que se pinte y la cortina se va.
  useEffect(() => {
    if (!target.current || pathname !== target.current) return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => reveal());
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => {
    if (fallback.current) window.clearTimeout(fallback.current);
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none invisible fixed inset-0 z-[80] overflow-hidden opacity-0">
      {/* Sin transform inicial: GSAP lo leería como `y` en px y se sumaría al yPercent. */}
      <div ref={panel} className="absolute inset-0 bg-ink-900">
        {/* Borde curvo de arriba (al subir) y de abajo (al irse): medias elipses del mismo tinta. */}
        <span className="absolute -left-[10%] bottom-full h-[16vh] w-[120%] translate-y-1/2 rounded-[50%] bg-ink-900" />
        <span className="absolute -left-[10%] top-full h-[16vh] w-[120%] -translate-y-1/2 rounded-[50%] bg-ink-900" />
        <p ref={word} className="absolute inset-0 flex items-center justify-center gap-3 font-display text-2xl font-medium text-neutral-0 opacity-0 md:text-3xl">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          {label}
        </p>
      </div>
    </div>
  );
}
