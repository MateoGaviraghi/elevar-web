"use client";

/**
 * Teléfono con país (KAN-32/KAN-33, 2026-11-04): selector con bandera y código a la
 * izquierda (lista propia con buscador) y el número a la derecha. Lo usan la comunidad
 * de WhatsApp (estilo "line") y el carrito (estilo "box"). La lista se dibuja en un
 * portal con posición fija para que no la recorte el panel que la contiene.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { PAISES, type Pais } from "@/lib/paises";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Flag({ iso }: { iso: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/assets/flags/${iso}.png`} alt="" width={20} height={13} className="h-[13px] w-5 shrink-0 object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />;
}

export function PhoneInput({
  label,
  pais,
  local,
  onPais,
  onLocal,
  error,
  variant,
}: {
  label: string;
  pais: Pais;
  local: string;
  onPais: (p: Pais) => void;
  onLocal: (v: string) => void;
  error?: string;
  variant: "line" | "box";
}) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const box = variant === "box";
  return (
    <div className={box ? "block" : "cm-in relative block"}>
      <label
        htmlFor={id}
        className={
          box
            ? "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
            : "block text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
        }
      >
        {label}
      </label>
      <div
        ref={row}
        className={
          box
            ? `group flex w-full items-stretch border bg-neutral-0 transition-all focus-within:ring-2 focus-within:ring-brand-500/25 ${
                error ? "border-red-500" : "border-neutral-300 focus-within:border-brand-500"
              }`
            : `group relative flex w-full items-stretch border-b ${error ? "border-red-500" : "border-neutral-300"}`
        }
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`País: ${pais.nombre} (+${pais.codigo}). Cambiar país`}
          onClick={() => setOpen((o) => !o)}
          className={`flex shrink-0 items-center gap-2 text-[15px] text-ink-900 outline-none transition-colors hover:text-brand-600 focus-visible:text-brand-600 ${
            box ? "border-r border-neutral-200 px-3" : "pr-3 pt-2 pb-2"
          }`}
        >
          <Flag iso={pais.iso} />
          <span className="tabular-nums">+{pais.codigo}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`text-neutral-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <input
          ref={input}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={local}
          placeholder={pais.ejemplo}
          onChange={(e) => onLocal(e.target.value)}
          className={`min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-neutral-300 ${box ? "px-4 py-3" : "pb-2 pt-2"}`}
        />
        {!box && (
          <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-brand-500 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:scale-x-100" />
        )}
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : (
        <span className="mt-1.5 block text-xs text-neutral-400">{pais.ayuda}</span>
      )}
      {open && (
        <PaisList
          anchor={row}
          current={pais}
          onPick={(p) => {
            onPais(p);
            setOpen(false);
            input.current?.focus();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function PaisList({
  anchor,
  current,
  onPick,
  onClose,
}: {
  anchor: React.RefObject<HTMLDivElement | null>;
  current: Pais;
  onPick: (p: Pais) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const items = useMemo(() => {
    const t = norm(q.trim().replace(/^\+/, ""));
    return t ? PAISES.filter((p) => norm(p.nombre).includes(t) || p.codigo.startsWith(t)) : PAISES;
  }, [q]);
  const [hi, setHi] = useState(() => Math.max(0, PAISES.indexOf(current)));

  useLayoutEffect(() => {
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 280);
    const left = Math.min(Math.max(16, r.left), window.innerWidth - width - 16);
    const below = window.innerHeight - r.bottom;
    const up = below < 320 && r.top > below;
    setPos({ left, top: up ? r.top - 6 : r.bottom + 6, width, up });
  }, [anchor]);

  useEffect(() => {
    if (!pos || !panel.current) return;
    search.current?.focus({ preventScroll: true });
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    // Opacidad (no visibility): el buscador tiene que poder recibir el foco desde el primer cuadro.
    if (prefersReducedMotion()) {
      gsap.set(panel.current, { opacity: 1 });
      return;
    }
    gsap.fromTo(panel.current, { opacity: 0, y: pos.up ? 8 : -8 }, { opacity: 1, y: 0, duration: 0.35, ease: "expo.out" });
  }, [pos]);

  useEffect(() => {
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const scroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && (e.stopPropagation(), onClose());
    document.addEventListener("pointerdown", away, true);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", onClose);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", onClose);
      document.removeEventListener("keydown", key, true);
    };
  }, [anchor, onClose]);

  useEffect(() => setHi(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(items.length - 1, Math.max(0, hi + (e.key === "ArrowDown" ? 1 : -1)));
      setHi(n);
      list.current?.children[n]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[hi]) onPick(items[hi]);
    }
  };

  if (!pos) return null;
  return createPortal(
    <div
      ref={panel}
      data-lenis-prevent
      style={{ position: "fixed", left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
      className="z-[80] border opacity-0 border-neutral-200 bg-neutral-0 shadow-[0_8px_8px_-4px_rgba(10,22,40,0.12)]"
    >
      <div className="border-b border-neutral-200 px-3 py-2.5">
        <input
          ref={search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Buscar país o código"
          aria-label="Buscar país o código"
          className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-neutral-400"
        />
      </div>
      <ul ref={list} role="listbox" aria-label="Países" className="max-h-64 overflow-y-auto overscroll-contain py-1">
        {items.length === 0 && <li className="px-4 py-3 text-sm text-neutral-400">Sin resultados.</li>}
        {items.map((p, i) => (
          <li
            key={p.iso}
            role="option"
            aria-selected={p.iso === current.iso}
            onMouseEnter={() => setHi(i)}
            onClick={() => onPick(p)}
            className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${i === hi ? "bg-neutral-50" : ""} ${
              p.iso === current.iso ? "font-semibold text-brand-600" : "text-ink-900"
            }`}
          >
            <Flag iso={p.iso} />
            <span className="flex-1">{p.nombre}</span>
            <span className="tabular-nums text-neutral-400">+{p.codigo}</span>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}
