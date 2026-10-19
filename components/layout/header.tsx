"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FORMACION,
  NAV_FORMACION_CARDS,
  NAV_SERVICIOS_CARDS,
  PLATAFORMA_URL,
  WHATSAPP_URL,
  type NavCard,
} from "@/lib/nav";
import { CommunityButton } from "@/components/common/whatsapp";
import { CONTACT } from "@/lib/contact";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { CartIcon } from "./cart-icon";
import { MobileMenu } from "./mobile-menu";
import { Logo } from "@/components/brand/logo";
import { LOGO_GRAY } from "@/components/brand/logo-geometry";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Al cambiar de página, el menú del celular se cierra solo.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top utility bar */}
      <div className="hidden bg-ink-900 text-neutral-400 md:block">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-8">
          <div className="flex h-9 items-center justify-between text-[11px] tracking-wider">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-neutral-0"
            >
              <span className="h-1 w-1 rounded-full bg-brand-500" />
              WhatsApp {CONTACT.phoneShort.replace(/ /g, " ")}
            </a>
            <div className="flex items-center gap-6">
              <CommunityButton
                tone="bare"
                label="Comunidad WhatsApp"
                className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 hover:text-[#25D366]"
              />
              <a
                href={PLATAFORMA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 uppercase transition-colors hover:text-neutral-0"
              >
                Plataforma Elevar
                <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 border-b border-neutral-200 bg-neutral-0 transition-shadow duration-300 ${
          scrolled && !menuOpen ? "shadow-sm" : ""
        }`}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex-shrink-0" aria-label="Elevar — Inicio">
              <Logo wordColor={LOGO_GRAY} className="h-7" />
            </Link>

            <DesktopNav isActive={isActive} />

            <div className="flex items-center gap-1">
              <CartIcon />
              <button
                className="relative inline-flex h-11 w-11 items-center justify-center text-ink-900 lg:hidden"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
                aria-controls="menu-movil"
              >
                {/* Tres rayas que se cruzan en una ✕ (0,5 s, la misma curva del sitio). */}
                <span aria-hidden className="relative block h-[14px] w-[22px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        top: `${i * 6}px`,
                        transform: menuOpen
                          ? i === 0
                            ? "translateY(6px) rotate(45deg)"
                            : i === 2
                              ? "translateY(-6px) rotate(-45deg)"
                              : "scaleX(0)"
                          : "none",
                        opacity: menuOpen && i === 1 ? 0 : 1,
                      }}
                    />
                  ))}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} anchorRef={headerRef} isActive={isActive} />
    </>
  );
}

function NavLink({
  href,
  label,
  active,
  onEnter,
}: {
  href: string;
  label: string;
  active: boolean;
  onEnter: () => void;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      className="group relative py-1 text-sm font-medium text-ink-800 transition-colors hover:text-ink-900"
    >
      {label}
      <span
        className={`pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left bg-brand-500 transition-transform duration-300 ease-out ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

/* ─────────────────────────── Menú de escritorio ───────────────────────────
 * Referencia: Aceternity · Navbar Menu (elegida por Mateo, 2026-10-19), hecha en GSAP.
 * Un solo panel para "Formación" y "Servicios": al pasar de uno al otro no se
 * cierra, se desliza y cambia de tamaño (0,45 s expo.out) mientras el contenido
 * se cruza en la dirección del movimiento. Abre bajando 8 px (0,5 s) con las
 * tarjetas escalonadas cada 0,05 s; cierra 150 ms después de salir con el mouse.
 */

type PanelId = "formacion" | "servicios";
const PANEL_ORDER: PanelId[] = ["formacion", "servicios"];

function DesktopNav({ isActive }: { isActive: (href: string) => boolean }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const triggers = useRef<Record<PanelId, HTMLAnchorElement | null>>({ formacion: null, servicios: null });
  const contents = useRef<Record<PanelId, HTMLDivElement | null>>({ formacion: null, servicios: null });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prev = useRef<PanelId | null>(null);
  const [active, setActive] = useState<PanelId | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const open = (id: PanelId) => {
    clear();
    setActive(id);
  };
  const closeNow = () => {
    clear();
    setActive(null);
  };
  const closeSoon = () => {
    clear();
    timer.current = setTimeout(() => setActive(null), 150);
  };

  // Al cambiar de página, el panel se cierra.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setActive(null);
  }, [pathname]);
  useEffect(() => clear, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const box = boxRef.current;
    const nav = navRef.current;
    if (!wrap || !box || !nav) return;
    const from = prev.current;
    prev.current = active;
    const k = prefersReducedMotion() ? 0 : 1;

    if (!active) {
      if (from) gsap.to(wrap, { autoAlpha: 0, y: -6, duration: 0.25 * k, ease: "power2.in", overwrite: "auto" });
      return;
    }

    // Centrado bajo el disparador, sin salirse de la pantalla (16 px de margen).
    const content = contents.current[active]!;
    const trigger = triggers.current[active]!;
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    const nr = nav.getBoundingClientRect();
    const tr = trigger.getBoundingClientRect();
    const left = Math.max(16, Math.min(tr.left + tr.width / 2 - w / 2, window.innerWidth - 16 - w));
    const x = left - nr.left;

    if (!from) {
      gsap.set(wrap, { x });
      gsap.set(box, { width: w, height: h });
      PANEL_ORDER.forEach((id) => gsap.set(contents.current[id], { autoAlpha: id === active ? 1 : 0, x: 0 }));
      gsap.fromTo(wrap, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.5 * k, ease: "expo.out", overwrite: "auto" });
      gsap.fromTo(
        content.querySelectorAll(".nav-item"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.5 * k, ease: "expo.out", stagger: 0.05 * k, delay: 0.06 * k, overwrite: "auto" }
      );
      return;
    }

    if (from === active) return;
    const dir = PANEL_ORDER.indexOf(active) > PANEL_ORDER.indexOf(from) ? 1 : -1;
    gsap.to(wrap, { x, autoAlpha: 1, y: 0, duration: 0.45 * k, ease: "expo.out", overwrite: "auto" });
    gsap.to(box, { width: w, height: h, duration: 0.45 * k, ease: "expo.out", overwrite: "auto" });
    gsap.to(contents.current[from], { autoAlpha: 0, x: -24 * dir, duration: 0.25 * k, ease: "power2.out", overwrite: "auto" });
    gsap.fromTo(
      content,
      { autoAlpha: 0, x: 24 * dir },
      { autoAlpha: 1, x: 0, duration: 0.45 * k, delay: 0.08 * k, ease: "expo.out", overwrite: "auto" }
    );
    gsap.set(content.querySelectorAll(".nav-item"), { autoAlpha: 1, y: 0 });
  }, [active]);

  const trigger = (id: PanelId, href: string, label: string) => (
    <Link
      ref={(el) => {
        triggers.current[id] = el;
      }}
      href={href}
      onMouseEnter={() => open(id)}
      onFocus={() => open(id)}
      aria-expanded={active === id}
      aria-haspopup="true"
      aria-controls={`panel-${id}`}
      className="group relative inline-flex items-center gap-1 py-1 text-sm font-medium text-ink-800 outline-none transition-colors hover:text-ink-900"
    >
      {label}
      <svg
        className={`transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${active === id ? "rotate-180" : ""}`}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <span
        className={`pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left bg-brand-500 transition-transform duration-300 ease-out ${
          isActive(href) || active === id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );

  const todos = FORMACION.find((f) => f.href === "/formacion")!;
  const promos = FORMACION.find((f) => f.href === "/promociones")!;

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center gap-9 lg:flex"
      aria-label="Navegación principal"
      onMouseLeave={closeSoon}
      onMouseEnter={clear}
      onKeyDown={(e) => {
        if (e.key === "Escape" && active) {
          triggers.current[active]?.focus();
          closeNow();
        }
      }}
      onBlur={(e) => {
        if (!navRef.current?.contains(e.relatedTarget as Node | null)) closeNow();
      }}
    >
      <NavLink href="/" label="Inicio" active={isActive("/")} onEnter={closeNow} />
      {trigger("formacion", "/formacion", "Formación")}
      {trigger("servicios", "/servicios", "Servicios")}
      <NavLink href="/nosotros" label="Nosotros" active={isActive("/nosotros")} onEnter={closeNow} />
      <NavLink href="/blog" label="Blog" active={isActive("/blog")} onEnter={closeNow} />
      <NavLink href="/contacto" label="Contacto" active={isActive("/contacto")} onEnter={closeNow} />

      {/* El panel: `pt-3` es el puente invisible entre el menú y la caja. */}
      <div ref={wrapRef} className="invisible absolute left-0 top-full z-50 pt-3 opacity-0" onMouseEnter={clear}>
        <div
          ref={boxRef}
          className="relative overflow-hidden border border-neutral-200 bg-neutral-0 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.32)]"
        >
          <PanelContent
            id="formacion"
            refCb={(el) => (contents.current.formacion = el)}
            cards={NAV_FORMACION_CARDS}
            kicker="Formación"
            links={[todos, promos]}
            onPick={closeNow}
          />
          <PanelContent
            id="servicios"
            refCb={(el) => (contents.current.servicios = el)}
            cards={NAV_SERVICIOS_CARDS}
            kicker="Servicios"
            links={[{ label: "Todos los servicios", href: "/servicios" }]}
            onPick={closeNow}
          />
        </div>
      </div>
    </nav>
  );
}

function PanelContent({
  id,
  refCb,
  cards,
  kicker,
  links,
  onPick,
}: {
  id: PanelId;
  refCb: (el: HTMLDivElement | null) => void;
  cards: NavCard[];
  kicker: string;
  links: { label: string; href: string }[];
  onPick: () => void;
}) {
  return (
    <div ref={refCb} id={`panel-${id}`} className="invisible absolute left-0 top-0 flex w-max opacity-0">
      <div className="grid w-[608px] grid-cols-2 content-start gap-1 p-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            onClick={onPick}
            className="nav-item group flex items-start gap-4 p-3 outline-none transition-colors duration-300 hover:bg-neutral-50 focus-visible:bg-neutral-50"
          >
            {/* Mismo pictograma y anillo naranja al pasar el mouse que en el resto del sitio. */}
            <span className="pictogram relative mt-0.5 inline-block h-11 w-11 shrink-0" aria-hidden>
              <span className="pictogram-scale block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.pictogram} alt="" className="block h-full w-full object-contain" />
              </span>
              <svg className="pictogram-ring" viewBox="0 0 100 100" focusable="false">
                <circle cx="50" cy="50" r="49.2" pathLength={1} />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
                {c.label}
                <span className="-translate-x-1 text-brand-500 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  →
                </span>
              </span>
              <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">{c.desc}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="flex w-[208px] flex-col border-l border-neutral-200 bg-neutral-50 p-6">
        <span className="nav-item text-[11px] font-semibold uppercase tracking-widest text-neutral-500">{kicker}</span>
        <div className="mt-4 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onPick}
              className="nav-item group/l flex items-center gap-3 py-2 text-sm font-medium text-ink-900 outline-none"
            >
              <span className="h-px w-4 bg-neutral-300 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/l:w-7 group-hover/l:bg-brand-500 group-focus-visible/l:w-7 group-focus-visible/l:bg-brand-500" />
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
