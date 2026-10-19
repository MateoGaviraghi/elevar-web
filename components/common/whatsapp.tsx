"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { COMUNIDAD_WHATSAPP_URL } from "@/lib/nav";
import { CONTACT } from "@/lib/contact";
import { joinCommunity } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Logo oficial de WhatsApp (glifo de la marca). */
export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/** Ícono de grupo (comunidad). */
export function GroupIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Botón de suscripción a la comunidad de Elevar en WhatsApp. */
export function CommunityButton({
  className = "",
  tone = "light",
  label = "Sumarme a la comunidad",
}: {
  className?: string;
  /** `bare` no aplica caja propia: sirve para la barra superior del header. */
  tone?: "light" | "dark" | "solid" | "bare";
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const tones: Record<string, string> = {
    light:
      "gap-2.5 px-5 py-3 text-sm font-semibold border border-neutral-300 bg-neutral-0 text-ink-900 hover:border-[#25D366] hover:text-[#128C4A]",
    dark: "gap-2.5 px-5 py-3 text-sm font-semibold border border-neutral-0/20 bg-transparent text-neutral-0 hover:border-[#25D366] hover:text-[#25D366]",
    solid: "gap-2.5 px-5 py-3 text-sm font-semibold bg-[#25D366] text-ink-900 hover:bg-[#1FBE5A]",
    bare: "gap-2",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center transition-colors ${tones[tone]} ${className}`}
      >
        <WhatsAppIcon className="h-[18px] w-[18px]" />
        {label}
      </button>
      <CommunityModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

interface FabOption {
  id: "chat" | "comunidad";
  title: string;
  sub: string;
  href?: string;
}

const FAB_OPTIONS: FabOption[] = [
  { id: "chat", title: "Escribir a Elevar", sub: "Respondemos en minutos", href: CONTACT.whatsappUrl },
  { id: "comunidad", title: "Sumarme a la comunidad", sub: "Cursos, novedades y promos" },
];

/**
 * Burbuja fija de WhatsApp (referencia: Motion · Floating Action Button; variante
 * "Píldoras", elegida por Mateo el 2026-10-17). Cerrada es la burbuja verde con el
 * logo oficial. Al tocarla: el fondo se oscurece (0,4 s), el logo gira 135° y se
 * achica mientras entra la cruz (0,45 s), la burbuja rebota (90 % → 100 %), y las
 * dos opciones salen como tarjetas que se despliegan de derecha a izquierda
 * mientras suben (0,75 s, expo.out, de a 0,1 s); su texto entra 0,2 s después.
 * Cierra en orden inverso y más rápido (×1,7) con la cruz, Esc o tocando el fondo.
 * Con movimiento reducido, solo fundidos.
 */
export function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const t = gsap.timeline({ paused: true });
      const items = gsap.utils.toArray<HTMLElement>(".wa-opt");
      t.to(".wa-veil", { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0);
      if (prefersReducedMotion()) {
        t.to(".wa-logo", { autoAlpha: 0, duration: 0.2 }, 0)
          .to(".wa-x", { autoAlpha: 1, duration: 0.2 }, 0)
          .to(items, { autoAlpha: 1, duration: 0.2 }, 0);
        items.forEach((el, i) => gsap.set(el, { y: -(76 + 74 * i) }));
      } else {
        t.fromTo(".wa-logo", { rotate: 0, scale: 1, autoAlpha: 1 }, { rotate: 135, scale: 0.4, autoAlpha: 0, duration: 0.45, ease: "power3.inOut" }, 0)
          .fromTo(".wa-x", { rotate: -135, scale: 0.4, autoAlpha: 0 }, { rotate: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: "power3.inOut" }, 0.05);
        items.forEach((el, i) => {
          t.fromTo(
            el,
            { y: -40, autoAlpha: 0, clipPath: "inset(0% 0% 0% 100%)" },
            { y: -(76 + 74 * i), autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "expo.out" },
            0.08 + i * 0.1
          );
          t.fromTo(el.querySelectorAll(".wa-txt"), { x: 14, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", stagger: 0.05 }, 0.28 + i * 0.1);
        });
      }
      tl.current = t;
    },
    { scope: root }
  );

  useEffect(() => {
    const t = tl.current;
    if (t) {
      if (open) t.timeScale(1).play();
      else t.timeScale(1.7).reverse();
    }
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    setOpen((v) => !v);
    if (!prefersReducedMotion()) {
      gsap.fromTo(e.currentTarget, { scale: 0.9 }, { scale: 1, duration: 0.6, ease: "back.out(3)", clearProps: "transform" });
    }
  }

  function pick(o: FabOption) {
    setOpen(false);
    if (o.id === "comunidad") setModal(true);
  }

  return (
    <>
      <div ref={root}>
        {/* Fondo: oscurece apenas la página para que las opciones resalten; tocarlo cierra. */}
        <div aria-hidden onClick={() => setOpen(false)} className="wa-veil invisible fixed inset-0 z-[39] bg-ink-900/30 opacity-0 print:hidden" />

        <div className="fixed bottom-5 right-5 z-40 print:hidden">
          <ul id="wa-menu" aria-label="Opciones de WhatsApp">
            {FAB_OPTIONS.map((o) => {
              const card = (
                <span className="flex w-[min(300px,calc(100vw-40px))] items-center gap-3.5 border border-neutral-200 bg-neutral-0 py-3 pl-3 pr-4 text-left shadow-[0_18px_40px_-18px_rgba(11,30,51,0.45)] transition-colors duration-300 group-hover:border-neutral-300">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-neutral-0 ${o.id === "chat" ? "bg-[#25D366]" : "bg-ink-900"}`}
                  >
                    {o.id === "chat" ? <WhatsAppIcon className="h-[22px] w-[22px]" /> : <GroupIcon className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="wa-txt block text-[15px] font-semibold leading-tight text-ink-900">{o.title}</span>
                    <span className="wa-txt mt-0.5 block text-xs text-neutral-500">{o.sub}</span>
                  </span>
                  <svg className="wa-txt h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              );
              const cls = "group block outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500";
              return (
                <li key={o.id} className="wa-opt invisible absolute bottom-0 right-0 opacity-0">
                  {o.href ? (
                    <a href={o.href} target="_blank" rel="noopener noreferrer" onClick={() => pick(o)} className={cls}>
                      {card}
                    </a>
                  ) : (
                    <button type="button" onClick={() => pick(o)} className={cls}>
                      {card}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="wa-menu"
            aria-label={open ? "Cerrar opciones de WhatsApp" : "Abrir opciones de WhatsApp"}
            className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-neutral-0 shadow-[0_14px_32px_-10px_rgba(37,211,102,0.9)] transition-transform duration-300 hover:scale-105"
          >
            <span className="wa-logo absolute inset-0 grid place-items-center">
              <WhatsAppIcon className="h-7 w-7" />
            </span>
            <span className="wa-x invisible absolute inset-0 grid place-items-center opacity-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <CommunityModal open={modal} onClose={() => setModal(false)} anchor="fab" />
    </>
  );
}

const BENEFITS = ["Cursos y webinars nuevos, antes que nadie", "Promociones exclusivas para la comunidad", "Contenido técnico sobre ISO/IEC 17025"];

/**
 * Alta a la comunidad: registra el contacto (queda en el panel) y entrega el
 * enlace de invitación al grupo. En el teléfono es una hoja que sube desde abajo;
 * en escritorio, una tarjeta (sobre la burbuja si `anchor="fab"`, al centro si no).
 * Entra con GSAP: fondo a 0,5, la tarjeta sube 32 px (0,7 s, expo.out) y su
 * contenido entra escalonado (0,06 s). Al registrarse, el formulario se va y se
 * dibuja un tilde (0,6 s) antes del botón para entrar al grupo.
 */
export function CommunityModal({
  open,
  onClose,
  anchor = "center",
}: {
  open: boolean;
  onClose: () => void;
  anchor?: "center" | "fab";
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  // Montado mientras está abierto o mientras corre la salida.
  const [mounted, setMounted] = useState(open);
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setState("idle");
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!mounted || !backdrop.current || !panel.current) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      if (open) {
        gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 0.5, duration: 0.35, ease: "power2.out" });
        gsap.fromTo(panel.current, { y: reduced ? 0 : 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reduced ? 0.2 : 0.7, ease: "expo.out" });
        if (!reduced) gsap.fromTo(".cm-in", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out", stagger: 0.06, delay: 0.12 });
      } else {
        gsap.to(backdrop.current, { opacity: 0, duration: 0.25, ease: "power2.in" });
        gsap.to(panel.current, { y: reduced ? 0 : 24, autoAlpha: 0, duration: 0.25, ease: "power2.in", onComplete: () => setMounted(false) });
      }
    }, panel);
    return () => ctx.kill();
  }, [open, mounted]);

  // Éxito: el tilde se dibuja y el texto y el botón entran escalonados.
  useLayoutEffect(() => {
    if (state !== "done" || !done.current) return;
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(".cm-ring", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
      gsap.fromTo(".cm-check", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out", delay: 0.35 });
      gsap.fromTo(".cm-ok", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out", stagger: 0.08, delay: 0.4 });
    }, done);
    return () => ctx.kill();
  }, [state]);

  async function submit(ev?: React.FormEvent) {
    ev?.preventDefault();
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Ingresá tu nombre.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Ingresá un email válido.";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Ingresá tu WhatsApp.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setState("sending");
    await joinCommunity({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setState("done");
  }

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center ${
        anchor === "fab" ? "sm:items-end sm:justify-end sm:p-5 sm:pb-24" : "sm:items-center sm:p-6"
      }`}
    >
      <div ref={backdrop} onClick={onClose} className="absolute inset-0 bg-ink-900 opacity-0" aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Comunidad de WhatsApp"
        className="invisible relative max-h-[92svh] w-full overflow-y-auto bg-neutral-0 shadow-[0_40px_80px_-30px_rgba(11,30,51,0.6)] sm:w-[400px]"
      >
        {/* Encabezado azul con el logo oficial y los beneficios. */}
        <div className="relative overflow-hidden bg-ink-900 px-6 pb-6 pt-6 text-neutral-0">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#25D366]/15 blur-2xl" />
          <div className="cm-in flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-neutral-0 shadow-[0_10px_24px_-10px_rgba(37,211,102,0.9)]">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#25D366]">Grupo de WhatsApp</p>
                <h2 className="font-display text-xl font-semibold tracking-tight">Comunidad ELEVAR</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="-mr-1 -mt-1 grid h-9 w-9 place-items-center text-neutral-400 transition-colors hover:text-neutral-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {state !== "done" && (
            <ul className="mt-5 space-y-2">
              {BENEFITS.map((b) => (
                <li key={b} className="cm-in flex items-start gap-2.5 text-sm text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        {state === "done" ? (
          <div ref={done} className="flex flex-col items-center px-6 pb-7 pt-8 text-center">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
              <circle className="cm-ring" cx="32" cy="32" r="29" stroke="#25D366" strokeWidth="3" pathLength={1} strokeDasharray="1 1" />
              <path className="cm-check" d="M20 33l8 8 16-17" stroke="#25D366" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" />
            </svg>
            <p className="cm-ok mt-5 font-display text-xl font-semibold tracking-tight text-ink-900">¡Listo, ya sos parte!</p>
            <p className="cm-ok mt-2 text-sm leading-relaxed text-neutral-500">Tocá el botón para entrar al grupo de WhatsApp.</p>
            <a
              href={COMUNIDAD_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cm-ok mt-6 inline-flex w-full items-center justify-center gap-2.5 bg-[#25D366] px-5 py-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-[#1FBE5A]"
            >
              <WhatsAppIcon className="h-5 w-5" /> Entrar al grupo
            </a>
            <button type="button" onClick={onClose} className="cm-ok mt-3 text-xs font-medium text-neutral-400 underline-offset-4 hover:text-neutral-600 hover:underline">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5 px-6 pb-6 pt-6">
            <Field label="Nombre y apellido" autoComplete="name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} error={errors.name} />
            <Field label="Correo electrónico" type="email" autoComplete="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} error={errors.email} />
            <Field label="WhatsApp" type="tel" autoComplete="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} error={errors.phone} />
            <button
              type="submit"
              disabled={state === "sending"}
              className="cm-in group mt-1 inline-flex w-full items-center justify-center gap-2.5 bg-[#25D366] px-5 py-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-[#1FBE5A] disabled:opacity-70"
            >
              {state === "sending" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900" aria-hidden />
                  Registrando…
                </>
              ) : (
                <>
                  Quiero sumarme
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
            <p className="cm-in text-center text-[11px] leading-relaxed text-neutral-400">
              Usamos tus datos solo para enviarte novedades de ELEVAR. Podés salir del grupo cuando quieras.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/** Campo con etiqueta que sube al escribir y una línea naranja que se dibuja en foco. */
function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="cm-in relative block">
      <input
        type={type}
        value={value}
        placeholder=" "
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={`peer block w-full rounded-none border-0 border-b bg-transparent px-0 pb-2 pt-5 text-[15px] text-ink-900 outline-none ${error ? "border-red-500" : "border-neutral-300"}`}
      />
      <span className="pointer-events-none absolute left-0 top-5 origin-left text-[15px] text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:top-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-brand-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider">
        {label}
      </span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brand-500 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:scale-x-100" />
      {error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
