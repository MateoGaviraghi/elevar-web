"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COMUNIDAD_WHATSAPP_URL } from "@/lib/nav";
import { joinCommunity } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.21-8.23 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
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

/** Burbuja fija: contacto directo + acceso a la comunidad. */
export function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-[270px] border border-neutral-200 bg-neutral-0 shadow-[0_24px_60px_-24px_rgba(11,30,51,0.4)]"
            >
              <div className="bg-ink-900 px-5 py-4">
                <p className="font-display text-sm font-semibold text-neutral-0">
                  ¿Hablamos por WhatsApp?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                  Consultas sobre cursos, acreditación o asistencia técnica.
                </p>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <a
                  href="https://wa.me/5493446507779"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-[#1FBE5A]"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Escribir a Elevar
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setModal(true);
                    setOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-900"
                >
                  Sumarme a la comunidad
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir opciones de WhatsApp"
          className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-ink-900 shadow-[0_12px_30px_-8px_rgba(37,211,102,0.8)] transition-transform hover:scale-105 active:scale-95"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <WhatsAppIcon className="h-7 w-7" />
          )}
        </button>
      </div>

      <CommunityModal open={modal} onClose={() => setModal(false)} />
    </>
  );
}

/**
 * Alta a la comunidad: registra el contacto (queda en el panel) y entrega el
 * enlace de invitación al grupo.
 */
export function CommunityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setState("idle");
      setErrors({});
    }
  }, [open]);

  async function submit() {
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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Comunidad de WhatsApp"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md border border-neutral-200 bg-neutral-0 shadow-lg sm:mx-4"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[#128C4A]">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                    Comunidad Elevar
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                    Novedades de cursos, promociones y contenido técnico sobre ISO/IEC 17025.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="text-neutral-400 transition-colors hover:text-ink-900"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {state === "done" ? (
              <div className="p-6">
                <p className="text-sm leading-relaxed text-ink-700">
                  ¡Listo! Ya estás en la lista. Tocá el botón para entrar al grupo de WhatsApp.
                </p>
                <a
                  href={COMUNIDAD_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-[#1FBE5A]"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Abrir la comunidad
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full text-center text-xs font-medium text-neutral-400 underline-offset-4 hover:text-neutral-600 hover:underline"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                <ModalField
                  label="Nombre y apellido"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  error={errors.name}
                />
                <ModalField
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  error={errors.email}
                />
                <ModalField
                  label="WhatsApp"
                  type="tel"
                  placeholder="+54 9 11 …"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  error={errors.phone}
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={state === "sending"}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-[#1FBE5A] disabled:opacity-60"
                >
                  {state === "sending" ? "Registrando…" : "Quiero sumarme"}
                </button>
                <p className="text-center text-[11px] leading-relaxed text-neutral-400">
                  Usamos tus datos sólo para enviarte novedades de Elevar. Podés salir del grupo
                  cuando quieras.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ModalField({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-none border bg-neutral-0 px-4 py-3 text-[15px] text-ink-900 outline-none transition-all placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-500/25 ${
          error ? "border-red-500" : "border-neutral-300 focus:border-brand-500"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
