"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SERVICIOS, FORMACION, PLATAFORMA_URL } from "@/lib/nav";
import { CommunityButton } from "@/components/common/whatsapp";

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const shouldReduce = useReducedMotion();
  const [serviciosOpen, setServiciosOpen] = useState(false);
  const [formacionOpen, setFormacionOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setServiciosOpen(false);
      setFormacionOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const panelVariants = shouldReduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { x: -280 },
        visible: { x: 0, transition: { type: "tween", duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
        exit: { x: -280, transition: { type: "tween", duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
      };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 0.5, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  };

  const linkClass =
    "block w-full text-left py-3 px-6 text-sm font-medium text-ink-800 hover:text-brand-500 hover:bg-neutral-50 transition-colors";
  const subLinkClass =
    "block w-full text-left py-2.5 px-10 text-sm text-neutral-700 hover:text-brand-500 hover:bg-neutral-50 transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-ink-900"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-neutral-0 flex flex-col shadow-lg"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200">
              <Link href="/" onClick={onClose} className="flex-shrink-0">
                <img src="/assets/logo.png" alt="Elevar" className="h-8 w-auto" />
              </Link>
              <button
                onClick={onClose}
                aria-label="Cerrar menú"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-700 hover:text-brand-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-2">
              <Link href="/" className={linkClass} onClick={onClose}>Inicio</Link>

              {/* Servicios accordion */}
              <button
                className={`${linkClass} flex items-center justify-between`}
                onClick={() => setServiciosOpen((v) => !v)}
                aria-expanded={serviciosOpen}
              >
                <span>Servicios</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform ${serviciosOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {serviciosOpen && (
                <div>
                  <Link href="/servicios" className={subLinkClass} onClick={onClose}>
                    Ver todos
                  </Link>
                  {SERVICIOS.map((item) => (
                    <Link key={item.href} href={item.href} className={subLinkClass} onClick={onClose}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Formación accordion */}
              <button
                className={`${linkClass} flex items-center justify-between`}
                onClick={() => setFormacionOpen((v) => !v)}
                aria-expanded={formacionOpen}
              >
                <span>Formación</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform ${formacionOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {formacionOpen && (
                <div>
                  {FORMACION.map((item) => (
                    <Link key={item.href} href={item.href} className={subLinkClass} onClick={onClose}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <Link href="/nosotros" className={linkClass} onClick={onClose}>Nosotros</Link>
              <Link href="/blog" className={linkClass} onClick={onClose}>Blog</Link>
              <Link href="/contacto" className={linkClass} onClick={onClose}>Contacto</Link>
            </nav>

            {/* CTA fijo abajo */}
            <div className="space-y-3 px-6 py-4 border-t border-neutral-200">
              <CommunityButton tone="solid" className="w-full" />
              <a
                href={PLATAFORMA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block w-full text-center bg-brand-500 text-neutral-0 font-semibold text-sm py-3 rounded transition-colors hover:bg-brand-600 active:bg-brand-700 min-h-[44px] flex items-center justify-center"
              >
                PLATAFORMA ELEVAR
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
