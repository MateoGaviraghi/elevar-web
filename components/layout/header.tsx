"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SERVICIOS, FORMACION, PLATAFORMA_URL } from "@/lib/nav";
import { CartIcon } from "./cart-icon";
import { MobileDrawer } from "./mobile-drawer";

const WHATSAPP_URL = "https://wa.me/5493446507779";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
              WhatsApp +54&nbsp;9&nbsp;3446&nbsp;507779
            </a>
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

      {/* Main nav */}
      <header
        className={`sticky top-0 z-40 border-b border-neutral-200 bg-neutral-0 transition-shadow duration-300 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex-shrink-0" aria-label="Elevar — Inicio">
              <img src="/assets/logo.png" alt="Elevar" className="h-7 w-auto" />
            </Link>

            <nav className="hidden items-center gap-9 lg:flex" aria-label="Navegación principal">
              <NavLink href="/" label="Inicio" active={isActive("/")} />
              <NavDropdown href="/formacion" label="Formación" active={isActive("/formacion")} items={FORMACION} />
              <NavDropdown
                href="/servicios"
                label="Servicios"
                active={isActive("/servicios")}
                items={[{ label: "Todos los servicios", href: "/servicios" }, ...SERVICIOS]}
              />
              <NavLink href="/nosotros" label="Nosotros" active={isActive("/nosotros")} />
              <NavLink href="/blog" label="Blog" active={isActive("/blog")} />
              <NavLink href="/contacto" label="Contacto" active={isActive("/contacto")} />
            </nav>

            <div className="flex items-center gap-1">
              <CartIcon />
              <button
                className="inline-flex h-11 w-11 items-center justify-center text-ink-900 lg:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menú"
                aria-expanded={drawerOpen}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
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

function NavDropdown({
  href,
  label,
  active,
  items,
}: {
  href: string;
  label: string;
  active: boolean;
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 110);
  };

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      {/* El trigger navega a la sección (click) y abre el menú al pasar por encima
          (hover/focus). Sin toggle en click → no queda “pegado”. */}
      <Link
        href={href}
        aria-expanded={open}
        aria-haspopup="true"
        onFocus={openNow}
        onBlur={closeSoon}
        className="group relative inline-flex items-center gap-1 py-1 text-sm font-medium text-ink-800 outline-none transition-colors hover:text-ink-900"
      >
        {label}
        <svg
          className={`transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
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
            active || open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 pt-3"
          >
            <div className="min-w-[260px] border border-neutral-200 bg-neutral-0 py-2 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)]">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group/item flex items-center gap-3 px-5 py-2.5 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-50 hover:text-ink-900 focus:bg-neutral-50 focus:text-ink-900"
                >
                  <span className="h-px w-4 bg-neutral-200 transition-all duration-300 ease-out group-hover/item:w-7 group-hover/item:bg-brand-500" />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
