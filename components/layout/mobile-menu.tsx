"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { FORMACION, NAV_FORMACION_CARDS, NAV_SERVICIOS_CARDS, PLATAFORMA_URL, type NavCard } from "@/lib/nav";
import { CommunityButton } from "@/components/common/whatsapp";
import { setScrollLocked } from "@/components/anim/smooth-scroll";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/* Menú del celular y la tablet (< lg).
 * Referencia: Olivier Larose · Navigation Menu (elegida por Mateo, 2026-10-19), hecha en GSAP.
 * Una cortina en tinta baja desde el borde del header (1,0 s power3.inOut); desde
 * 0,45 s las seis palabras suben letra por letra, una fila cada 0,07 s; el pie
 * (comunidad y plataforma) entra a 0,85 s. "Formación" y "Servicios" se abren
 * debajo de su palabra (0,5 s). Al cerrar, el contenido se apaga en 0,3 s y la
 * cortina sube en 0,7 s. Movimiento reducido: aparece y desaparece, sin desplazar.
 */

type SubId = "formacion" | "servicios";

interface Row {
  label: string;
  href: string;
  sub?: SubId;
}

const ROWS: Row[] = [
  { label: "Inicio", href: "/" },
  { label: "Formación", href: "/formacion", sub: "formacion" },
  { label: "Servicios", href: "/servicios", sub: "servicios" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
];

const SUBS: Record<SubId, { cards: NavCard[]; links: { label: string; href: string }[] }> = {
  formacion: {
    cards: NAV_FORMACION_CARDS,
    links: FORMACION.filter((f) => f.href === "/formacion" || f.href === "/promociones"),
  },
  servicios: { cards: NAV_SERVICIOS_CARDS, links: [{ label: "Todos los servicios", href: "/servicios" }] },
};

export function MobileMenu({
  open,
  onClose,
  anchorRef,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  /** El header: la cortina nace en su borde de abajo. */
  anchorRef: RefObject<HTMLElement>;
  isActive: (href: string) => boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const subRefs = useRef<Record<SubId, HTMLDivElement | null>>({ formacion: null, servicios: null });
  const [sub, setSub] = useState<SubId | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const first = useRef(true);

  // Cortina: abrir / cerrar.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      if (!open) return;
    }
    const k = prefersReducedMotion() ? 0 : 1;
    tl.current?.kill();

    if (open) {
      el.style.top = `${Math.max(0, anchorRef.current?.getBoundingClientRect().bottom ?? 64)}px`;
      el.removeAttribute("inert");
      setScrollLocked(true);
      const rows = gsap.utils.toArray<HTMLElement>(".mm-row", el);
      const t = gsap.timeline();
      t.set(el, { autoAlpha: 1 })
        .set(inner.current, { autoAlpha: 1, y: 0 })
        .fromTo(curtain.current, { yPercent: k ? -100 : 0, autoAlpha: k ? 1 : 0 }, { yPercent: 0, autoAlpha: 1, duration: k ? 1.0 : 0.2, ease: "power3.inOut" });
      rows.forEach((row, i) => {
        t.fromTo(
          row.querySelectorAll(".mm-char"),
          { yPercent: k ? 115 : 0, autoAlpha: k ? 1 : 0 },
          { yPercent: 0, autoAlpha: 1, duration: k ? 0.9 : 0.2, ease: "expo.out", stagger: 0.018 * k },
          k ? 0.45 + i * 0.07 : 0.1
        );
        t.fromTo(row.querySelectorAll(".mm-aside"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, k ? 0.6 + i * 0.07 : 0.1);
        t.fromTo(row.querySelector(".mm-rule"), { scaleX: 0 }, { scaleX: 1, duration: k ? 1.0 : 0, ease: "expo.out" }, k ? 0.5 + i * 0.07 : 0);
      });
      t.fromTo(el.querySelector(".mm-foot"),{ autoAlpha: 0, y: 16 * k }, { autoAlpha: 1, y: 0, duration: k ? 0.7 : 0.2, ease: "expo.out" }, k ? 0.85 : 0.1);
      tl.current = t;
    } else {
      const t = gsap.timeline({
        onComplete: () => {
          gsap.set(el, { autoAlpha: 0 });
          el.setAttribute("inert", "");
          setSub(null);
        },
      });
      t.to(inner.current, { autoAlpha: 0, y: -10 * k, duration: k ? 0.3 : 0.15, ease: "power2.in" }).to(
        curtain.current,
        { yPercent: k ? -100 : 0, autoAlpha: k ? 1 : 0, duration: k ? 0.7 : 0.15, ease: "power3.inOut" },
        k ? 0.1 : 0
      );
      setScrollLocked(false);
      tl.current = t;
    }
  }, [open, anchorRef]);

  useEffect(() => {
    root.current?.setAttribute("inert", "");
    return () => {
      tl.current?.kill();
      setScrollLocked(false);
    };
  }, []);

  // Esc cierra.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Si se pasa a escritorio con el menú abierto, se cierra.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && onClose();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [onClose]);

  // Submenús: uno abierto a la vez.
  useEffect(() => {
    const k = prefersReducedMotion() ? 0 : 1;
    (Object.keys(subRefs.current) as SubId[]).forEach((id) => {
      const el = subRefs.current[id];
      if (!el) return;
      if (id === sub) {
        gsap.to(el, { height: "auto", duration: 0.5 * k, ease: "expo.out", overwrite: "auto" });
        gsap.fromTo(
          el.querySelectorAll(".mm-sub-item"),
          { autoAlpha: 0, y: 10 * k },
          { autoAlpha: 1, y: 0, duration: 0.5 * k, ease: "expo.out", stagger: 0.04 * k, delay: 0.05 * k, overwrite: "auto" }
        );
      } else {
        gsap.to(el, { height: 0, duration: 0.4 * k, ease: "power3.inOut", overwrite: "auto" });
      }
    });
  }, [sub]);

  return (
    <div
      ref={root}
      id="menu-movil"
      className="invisible fixed inset-x-0 bottom-0 top-16 z-[45] overflow-hidden opacity-0 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      <div ref={curtain} className="h-full bg-ink-900 text-neutral-0">
        <div ref={inner} className="flex h-full flex-col">
          <nav className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 sm:px-10" aria-label="Navegación principal">
            <ul>
              {ROWS.map((row, i) => {
                const active = isActive(row.href);
                const subOpen = row.sub && sub === row.sub;
                return (
                  <li key={row.href} className="mm-row relative">
                    <div className="flex items-center justify-between gap-4">
                      <Link
                        href={row.href}
                        onClick={onClose}
                        className="group flex min-h-[56px] flex-1 items-center gap-3 py-2 outline-none"
                        aria-current={active ? "page" : undefined}
                      >
                        <span
                          aria-hidden
                          className={`mm-aside h-[2px] bg-brand-500 transition-[width] duration-500 ${active ? "w-5" : "w-0 group-hover:w-3"}`}
                        />
                        <Word text={row.label} />
                      </Link>
                      {row.sub ? (
                        <button
                          type="button"
                          onClick={() => setSub((s) => (s === row.sub ? null : row.sub!))}
                          aria-expanded={!!subOpen}
                          aria-controls={`mm-sub-${row.sub}`}
                          aria-label={`${subOpen ? "Cerrar" : "Ver"} opciones de ${row.label}`}
                          className="mm-aside grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-0/15 text-neutral-0 transition-colors hover:border-brand-500"
                        >
                          <span aria-hidden className="relative block h-3 w-3">
                            <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
                            <span
                              className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                subOpen ? "scale-y-0" : ""
                              }`}
                            />
                          </span>
                        </button>
                      ) : (
                        <span aria-hidden className="mm-aside text-[11px] tabular-nums tracking-widest text-neutral-500">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {row.sub && (
                      <div
                        id={`mm-sub-${row.sub}`}
                        ref={(el) => {
                          subRefs.current[row.sub!] = el;
                        }}
                        className="h-0 overflow-hidden"
                      >
                        <SubList id={row.sub} onPick={onClose} />
                      </div>
                    )}

                    <span aria-hidden className="mm-rule block h-px origin-left bg-neutral-0/10" />
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mm-foot flex flex-col gap-3 border-t border-neutral-0/10 px-6 py-5 sm:flex-row sm:px-10">
            <CommunityButton tone="dark" label="Comunidad WhatsApp" className="w-full sm:w-auto sm:flex-1" />
            <a
              href={PLATAFORMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 bg-brand-500 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600 sm:w-auto sm:flex-1"
            >
              Plataforma Elevar <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Palabra grande partida en letras, cada una dentro de una máscara para subir. */
function Word({ text }: { text: string }) {
  return (
    <span
      aria-label={text}
      className="-my-[0.12em] block overflow-hidden py-[0.12em] font-display text-[2.35rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl"
    >
      {Array.from(text).map((c, i) => (
        <span key={i} aria-hidden className="mm-char inline-block">
          {c}
        </span>
      ))}
    </span>
  );
}

function SubList({ id, onPick }: { id: SubId; onPick: () => void }) {
  const { cards, links } = SUBS[id];
  return (
    <div className="pb-5 pt-1">
      <ul className="grid gap-1 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href} className="mm-sub-item">
            <Link
              href={c.href}
              onClick={onPick}
              className="flex min-h-[48px] items-center gap-3 py-1.5 pr-2 text-[15px] text-neutral-300 transition-colors hover:text-neutral-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.pictogram} alt="" className="h-8 w-8 shrink-0 object-contain" />
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onPick}
            className="mm-sub-item group/l inline-flex min-h-[44px] items-center gap-3 text-sm font-medium text-neutral-0"
          >
            <span className="h-px w-4 bg-brand-500 transition-all duration-500 group-hover/l:w-7" />
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
