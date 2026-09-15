"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminSession } from "@/types";
import { getSession, onSessionChange, signOut } from "@/lib/admin/auth";

interface NavItem {
  href: string;
  label: string;
  icon: JSX.Element;
}

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Panel",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </>
    ),
  },
  {
    href: "/admin/cursos",
    label: "Cursos",
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
  },
  {
    href: "/admin/promociones",
    label: "Promociones",
    icon: (
      <>
        <path d="M20.6 12.6 12 21.2 3.4 12.6A5 5 0 0 1 12 6a5 5 0 0 1 8.6 6.6Z" />
      </>
    ),
  },
  {
    href: "/admin/blog",
    label: "Blog",
    icon: (
      <>
        <path d="M4 4h16v16H4z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
      </>
    ),
  },
  {
    href: "/admin/ordenes",
    label: "Órdenes",
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    href: "/admin/webinars",
    label: "Webinars",
    icon: (
      <>
        <rect x="2" y="4" width="14" height="14" rx="2" />
        <polygon points="16 10 22 6 22 18 16 14" />
      </>
    ),
  },
  {
    href: "/admin/contactos",
    label: "Contactos",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </>
    ),
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    const read = () => {
      setSession(getSession());
      setChecked(true);
    };
    read();
    return onSessionChange(read);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!session && !isLogin) router.replace("/admin/login");
    if (session && isLogin) router.replace("/admin");
  }, [checked, session, isLogin, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (isLogin) return <>{children}</>;

  if (!checked || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Verificando sesión…</p>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-ink-900">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              className="grid h-9 w-9 place-items-center text-neutral-0 lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="font-display text-base font-bold tracking-tight text-neutral-0">
                ELEVAR
              </span>
              <span className="border-l border-neutral-0/20 pl-2.5 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-0 sm:inline"
            >
              Ver sitio ↗
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-neutral-400 sm:inline">{session.name}</span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.replace("/admin/login");
                }}
                className="border border-neutral-0/20 px-3 py-1.5 text-xs font-semibold text-neutral-0 transition-colors hover:border-brand-500 hover:text-brand-500"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Navegación lateral */}
        <aside
          className={`fixed inset-y-14 left-0 z-20 w-60 shrink-0 border-r border-neutral-200 bg-neutral-0 transition-transform lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col gap-1 p-3" aria-label="Secciones del panel">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-ink-900 text-neutral-0"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-ink-900"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mx-3 mt-4 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-400">
            Mockup de Fase 0: los datos se guardan en este navegador. Al conectar el backend, las
            mismas pantallas operan sobre la API.
          </p>
        </aside>

        {menuOpen && (
          <div
            className="fixed inset-0 z-10 bg-ink-900/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
        )}

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
