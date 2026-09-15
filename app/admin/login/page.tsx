"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DEMO_CREDENTIALS, signIn } from "@/lib/admin/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(form.username, form.password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold tracking-tight text-neutral-0">
            ELEVAR
          </span>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Panel de administración
          </p>
        </div>

        <form onSubmit={submit} className="border border-neutral-0/10 bg-neutral-0 p-6 sm:p-8">
          <h1 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Ingresá con el usuario y la contraseña que te compartimos.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Usuario
              </span>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                className="w-full rounded-none border border-neutral-300 bg-neutral-0 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-ink-900"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Contraseña
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                className="w-full rounded-none border border-neutral-300 bg-neutral-0 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-ink-900"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-ink-900 px-5 py-3 text-sm font-semibold text-neutral-0 transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>

          <p className="mt-5 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-400">
            Demo de Fase 0 — usuario <span className="font-mono text-neutral-600">{DEMO_CREDENTIALS.username}</span>,
            contraseña <span className="font-mono text-neutral-600">{DEMO_CREDENTIALS.password}</span>.
          </p>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-0"
        >
          ← Volver al sitio
        </Link>
      </motion.div>
    </div>
  );
}
