"use client";

/* Formulario del Botón de arrepentimiento (KAN-41, Res. 424/2020): sin cuenta ni otro trámite.
 * Al enviarlo la persona ve su código en pantalla y el servidor se lo manda por mail. */

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { AvisoDatos } from "@/components/legal/aviso-datos";
import { ApiError, pedirArrepentimiento } from "@/lib/api";
import { CONTACT } from "@/lib/contact";
import { pegar } from "@/lib/texto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Campos = { name: string; email: string; orden: string; motivo: string };
const VACIO: Campos = { name: "", email: "", orden: "", motivo: "" };

export function ArrepentimientoForm() {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Partial<Campos>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ codigo: string | null; email: string } | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  function set(k: keyof Campos) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCampos((c) => ({ ...c, [k]: e.target.value }));
      setErrores((x) => ({ ...x, [k]: undefined }));
    };
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const err: Partial<Campos> = {};
    if (!campos.name.trim()) err.name = "Ingresá tu nombre y apellido.";
    if (!EMAIL_RE.test(campos.email.trim())) err.email = "Ingresá un correo válido.";
    setErrores(err);
    if (Object.keys(err).length) return;

    setEnviando(true);
    setError(null);
    try {
      const { codigo } = await pedirArrepentimiento({
        name: campos.name.trim(),
        email: campos.email.trim(),
        orden: campos.orden,
        motivo: campos.motivo,
      });
      setHecho({ codigo, email: campos.email.trim() });
      requestAnimationFrame(() => {
        // Sin el salto del foco: el título quedaría debajo del header fijo.
        titulo.current?.focus({ preventScroll: true });
        titulo.current?.closest("[role=status]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    } catch (x) {
      setError(x instanceof ApiError ? x.message : "No pudimos enviar tu pedido. Probá de nuevo en unos minutos.");
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <div className="border border-neutral-200 bg-neutral-0 p-6 sm:p-10" role="status">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Pedido recibido</p>
        <h2 ref={titulo} tabIndex={-1} className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-900 outline-none sm:text-3xl">
          Tu código es
        </h2>
        <p className="mt-3 select-all font-display text-4xl font-semibold tabular-nums tracking-wide text-ink-900 sm:text-5xl">
          {hecho.codigo ?? "—"}
        </p>
        <p className="mt-6 text-base leading-relaxed text-neutral-700">
          {pegar(`Te lo mandamos también a ${hecho.email}. Guardalo: con ese código seguís tu pedido. Buscamos tu inscripción y te escribimos con cómo y cuándo se hace la devolución, por el mismo medio con el que pagaste.`)}
        </p>
        <p className="mt-4 text-sm text-neutral-700">
          ¿No te llegó el mail? Escribinos a{" "}
          <a href={CONTACT.emailUrl} className="font-semibold text-ink-900 underline decoration-brand-500 underline-offset-4">
            {CONTACT.email}
          </a>{" "}
          con tu código.
        </p>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-brand-600">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-neutral-0 p-6 sm:p-10">
      {error && (
        <AlertBanner variant="error" className="mb-6">
          {error}
        </AlertBanner>
      )}
      <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Nombre y apellido" name="name" type="text" required autoComplete="name" value={campos.name} onChange={set("name")} error={errores.name} />
          <FormField label="Correo de la compra" name="email" type="email" required autoComplete="email" value={campos.email} onChange={set("email")} error={errores.email} />
        </div>
        <FormField
          label="Número de orden (opcional)"
          name="orden"
          type="text"
          placeholder="Por ejemplo, #5197F074"
          autoComplete="off"
          value={campos.orden}
          onChange={set("orden")}
          error={errores.orden}
        />
        <FormField as="textarea" label="Motivo (opcional)" name="motivo" rows={3} value={campos.motivo} onChange={set("motivo")} error={errores.motivo} />
        <Button type="submit" variant="primary" size="lg" disabled={enviando} className="w-full">
          {enviando ? "Enviando…" : "Enviar pedido"}
        </Button>
        <AvisoDatos para="tramitar tu pedido" />
      </form>
    </div>
  );
}
