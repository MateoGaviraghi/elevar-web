"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Course, CourseSession } from "@/types";
import { registerWebinar } from "@/lib/api";
import { formatDate } from "@/lib/formatters";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  course: Course;
  open: boolean;
  onClose: () => void;
  /** Sesión preseleccionada desde el panel del curso. */
  sessionId?: number | null;
}

/**
 * Inscripción a webinars gratuitos: no pasa por el carrito ni por la pasarela.
 * Registra al participante (queda en el panel) y confirma por pantalla + correo.
 */
export function WebinarSignupModal({ course, open, onClose, sessionId }: Props) {
  const sessions = useMemo(
    () =>
      (course.sessions ?? []).filter(
        (s) => s.status === "SCHEDULED" && (s.seats_available == null || s.seats_available > 0)
      ),
    [course.sessions]
  );

  const [selected, setSelected] = useState<number | null>(sessionId ?? sessions[0]?.id ?? null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  useEffect(() => {
    if (!open) return;
    setState("idle");
    setErrors({});
    setSelected(sessionId ?? sessions[0]?.id ?? null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, sessionId, sessions]);

  const chosen: CourseSession | undefined = sessions.find((s) => s.id === selected);

  async function submit() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Ingresá tu nombre y apellido.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Ingresá un email válido.";
    if (sessions.length > 0 && selected == null) e.session = "Elegí un encuentro.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setState("sending");
    await registerWebinar({
      course_id: course.id,
      course_title: course.title,
      session_id: selected,
      session_label: chosen ? formatDate(chosen.starts_at) : null,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
    });
    setState("done");
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto sm:items-center">
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
            aria-label={`Inscripción a ${course.title}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative my-auto w-full max-w-lg border border-neutral-200 bg-neutral-0 shadow-lg sm:mx-4"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                  Webinar gratuito
                </p>
                <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight text-ink-900">
                  {course.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 text-neutral-400 transition-colors hover:text-ink-900"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {state === "done" ? (
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Inscripción confirmada
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  Te enviamos el enlace de acceso a <strong>{form.email}</strong>
                  {chosen ? ` para el encuentro del ${formatDate(chosen.starts_at)}` : ""}. Revisá
                  también la carpeta de correo no deseado.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/formacion/webinars-gratuitos"
                    className="inline-flex items-center justify-center bg-brand-500 px-6 py-3 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600"
                  >
                    Ver más webinars
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center border border-ink-900 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-neutral-0"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {sessions.length > 0 && (
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Encuentro
                    </span>
                    <div className="flex flex-col gap-2">
                      {sessions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelected(s.id)}
                          className={`flex items-center justify-between gap-3 border px-4 py-3 text-left transition-colors ${
                            selected === s.id
                              ? "border-ink-900 bg-ink-900/[0.03]"
                              : "border-neutral-200 hover:border-ink-400"
                          }`}
                        >
                          <span className="text-sm font-medium text-ink-900">
                            {formatDate(s.starts_at)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {s.seats_available == null
                              ? "Cupos disponibles"
                              : `${s.seats_available} cupos`}
                          </span>
                        </button>
                      ))}
                    </div>
                    {errors.session && (
                      <span className="mt-1 block text-xs text-red-600">{errors.session}</span>
                    )}
                  </div>
                )}

                <Field
                  label="Nombre y apellido"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  error={errors.name}
                />
                <Field
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  error={errors.email}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Teléfono (opcional)"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  />
                  <Field
                    label="Laboratorio / empresa (opcional)"
                    value={form.company}
                    onChange={(v) => setForm((f) => ({ ...f, company: v }))}
                  />
                </div>

                <button
                  type="button"
                  onClick={submit}
                  disabled={state === "sending"}
                  className="mt-2 inline-flex w-full items-center justify-center bg-brand-500 px-5 py-3.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {state === "sending" ? "Registrando…" : "Confirmar inscripción"}
                </button>
                <p className="text-center text-[11px] leading-relaxed text-neutral-400">
                  La inscripción es gratuita. Te llega el enlace de acceso por correo.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-none border bg-neutral-0 px-4 py-3 text-[15px] text-ink-900 outline-none transition-all placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-500/25 ${
          error ? "border-red-500" : "border-neutral-300 focus:border-brand-500"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
