"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, rutaDeIngreso, salir, yo } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";
import type { Yo } from "@/lib/admin/tipos";

/**
 * Estructura del panel: barra superior (logo, nombre, «Salir») y menú lateral por tarea.
 * Pide yo/ para saber quién es. El control de acceso lo hace Django en cada pedido: esto solo
 * decide qué mostrar y adónde llevar cuando la API dice 401 o 403.
 */

interface ItemMenu {
  href: string;
  texto: string;
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

// Cada etapa suma acá su pantalla cuando existe (06-DISENO, «Menú»).
const MENU: GrupoMenu[] = [{ titulo: "Atender", items: [{ href: "/admin", texto: "Inicio" }] }];

const UsuarioContexto = createContext<Yo | null>(null);

export function useUsuario(): Yo {
  const usuario = useContext(UsuarioContexto);
  if (!usuario) throw new Error("useUsuario va dentro de PanelShell");
  return usuario;
}

type Estado = { tipo: "cargando" } | { tipo: "listo"; usuario: Yo } | { tipo: "error"; mensaje: string };

export function PanelShell({ children }: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const cargar = useCallback(async () => {
    setEstado({ tipo: "cargando" });
    try {
      const usuario = await yo();
      if (!usuario.segundo_factor_listo) {
        router.replace("/admin/primer-ingreso");
        return;
      }
      setEstado({ tipo: "listo", usuario });
    } catch (error) {
      if (error instanceof ApiError && error.sinSesion) {
        router.replace(rutaDeIngreso(pathname));
        return;
      }
      if (error instanceof ApiError && error.code === "FALTA_SEGUNDO_FACTOR") {
        router.replace("/admin/primer-ingreso");
        return;
      }
      setEstado({ tipo: "error", mensaje: textoDeError(error instanceof ApiError ? error.code : undefined) });
    }
  }, [pathname, router]);

  useEffect(() => {
    void cargar();
    // Solo al montar: cada pantalla maneja sus propios 401.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setMenuAbierto(false), [pathname]);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await salir();
    } catch {
      // Aunque falle (p. ej. la sesión ya venció), se vuelve al ingreso.
    }
    // push y no replace: «atrás» vuelve a una página del panel, que le pregunta a Django y,
    // sin sesión, lleva de nuevo al ingreso (09-ETAPAS, etapa 2).
    router.push("/admin/ingresar");
  }

  if (estado.tipo === "cargando") {
    return (
      <div className="min-h-screen bg-neutral-50" aria-busy="true">
        <div className="h-14 bg-ink-900" />
        <div className="space-y-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-neutral-200" />
          <div className="h-4 w-64 bg-neutral-200" />
        </div>
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  if (estado.tipo === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm border border-neutral-200 bg-neutral-0 p-6 text-center">
          <p role="alert" className="text-sm text-neutral-900">{estado.mensaje}</p>
          <button
            type="button"
            onClick={() => void cargar()}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const { usuario } = estado;

  return (
    <UsuarioContexto.Provider value={usuario}>
      <div className="min-h-screen bg-neutral-50">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 bg-ink-900 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center text-neutral-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
              aria-expanded={menuAbierto}
              aria-controls="menu-panel"
              onClick={() => setMenuAbierto((v) => !v)}
            >
              <span className="sr-only">{menuAbierto ? "Cerrar el menú" : "Abrir el menú"}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              <Image src="/assets/logotipo-elevar.png" alt="ELEVAR" width={100} height={20} className="h-5 w-auto" />
              <span className="border-l border-ink-600 pl-2 font-display text-sm font-semibold text-neutral-0">Panel</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-0 sm:inline">{usuario.nombre}</span>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              disabled={saliendo}
              className="inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-neutral-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
            >
              {saliendo ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </header>

        <div className="lg:flex">
          <nav
            id="menu-panel"
            aria-label="Menú del panel"
            className={`${menuAbierto ? "block" : "hidden"} border-b border-neutral-200 bg-neutral-0 lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r`}
          >
            {MENU.map((grupo) => (
              <div key={grupo.titulo} className="py-4">
                <p className="px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">{grupo.titulo}</p>
                <ul className="mt-2">
                  {grupo.items.map((item) => {
                    const activo = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={activo ? "page" : undefined}
                          className={`flex min-h-[44px] items-center border-l-2 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 ${
                            activo
                              ? "border-brand-500 font-semibold text-ink-900"
                              : "border-transparent text-neutral-700 hover:text-ink-900"
                          }`}
                        >
                          {item.texto}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </UsuarioContexto.Provider>
  );
}

export interface PanelShellProps {
  children: ReactNode;
}
