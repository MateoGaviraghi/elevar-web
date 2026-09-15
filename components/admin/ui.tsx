"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ── Botones ─────────────────────────────────────────────────────────────── */

type Tone = "primary" | "secondary" | "ghost" | "danger";

const TONES: Record<Tone, string> = {
  primary: "bg-ink-900 text-neutral-0 hover:bg-ink-800",
  secondary: "border border-neutral-300 bg-neutral-0 text-ink-900 hover:border-ink-900",
  ghost: "text-neutral-500 hover:text-ink-900",
  danger: "border border-red-300 bg-neutral-0 text-red-700 hover:bg-red-50",
};

export function adminButtonClasses(tone: Tone = "primary", className = "") {
  return `inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${TONES[tone]} ${className}`.trim();
}

export function AdminButton({
  tone = "primary",
  className = "",
  children,
  onClick,
  type = "button",
  disabled,
  href,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={adminButtonClasses(tone, className)}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={adminButtonClasses(tone, className)}>
      {children}
    </button>
  );
}

/* ── Contenedores ────────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-ink-900"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-neutral-200 bg-neutral-0 ${className}`}>{children}</div>
  );
}

export function CardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-neutral-200 bg-neutral-0">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          {title}
        </h2>
        {description && <p className="mt-1 text-xs text-neutral-400">{description}</p>}
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="border border-neutral-200 bg-neutral-0 p-5 transition-colors hover:border-ink-900">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
      <p className="font-display text-base font-semibold text-ink-900">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* ── Formularios ─────────────────────────────────────────────────────────── */

export function Field({
  label,
  children,
  error,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputClasses = (error?: string) =>
  `w-full rounded-none border bg-neutral-0 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-neutral-400 ${
    error ? "border-red-500" : "border-neutral-300 focus:border-ink-900"
  }`;

export function Input({
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  min,
  max,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClasses(error)}
    />
  );
}

export function Textarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  error?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClasses(error)} resize-y leading-relaxed`}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  error,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  error?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${inputClasses(error)} appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-300"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
            {description}
          </span>
        )}
      </span>
      <span
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-brand-500" : "bg-neutral-200"
        }`}
        aria-hidden
      >
        <span
          className={`h-5 w-5 rounded-full bg-neutral-0 shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-none border border-neutral-300 bg-neutral-0 py-2.5 pl-9 pr-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-ink-900"
      />
    </div>
  );
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`border px-3.5 py-2 text-xs font-semibold transition-colors ${
            value === o.value
              ? "border-ink-900 bg-ink-900 text-neutral-0"
              : "border-neutral-300 bg-neutral-0 text-neutral-600 hover:border-ink-900 hover:text-ink-900"
          }`}
        >
          {o.label}
          {o.count != null && (
            <span className={value === o.value ? "ml-1.5 text-neutral-400" : "ml-1.5 text-neutral-400"}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Tabla ───────────────────────────────────────────────────────────────── */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-neutral-200 bg-neutral-0">
      <table className="w-full min-w-[720px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-neutral-200 px-4 py-3.5 align-middle text-sm text-ink-800 ${className}`}>
      {children}
    </td>
  );
}

/* ── Chips de estado ─────────────────────────────────────────────────────── */

const CHIP_TONES: Record<string, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  brand: "bg-brand-50 text-brand-700",
  ink: "bg-ink-900 text-neutral-0",
};

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof CHIP_TONES | string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
        CHIP_TONES[tone] ?? CHIP_TONES.neutral
      }`}
    >
      {children}
    </span>
  );
}

/* ── Diálogo de confirmación ─────────────────────────────────────────────── */

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-ink-900"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm border border-neutral-200 bg-neutral-0 p-6 shadow-lg"
          >
            <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <AdminButton tone="secondary" onClick={onCancel}>
                Cancelar
              </AdminButton>
              <AdminButton tone="danger" onClick={onConfirm}>
                {confirmLabel}
              </AdminButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Aviso efímero ───────────────────────────────────────────────────────── */

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(t);
  }, [message]);

  const toast = (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 bg-ink-900 px-5 py-3 text-sm font-medium text-neutral-0 shadow-lg"
          role="status"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { toast, showToast: setMessage };
}
