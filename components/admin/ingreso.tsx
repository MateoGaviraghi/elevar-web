"use client";

import Image from "next/image";
import type { ReactNode } from "react";

/** Marco de las pantallas de ingreso: logo, título y una columna angosta (05-PANTALLAS). */
export function IngresoMarco({ titulo, bajada, children }: IngresoMarcoProps) {
  return (
    <main className="flex min-h-screen items-start justify-center bg-neutral-50 px-4 py-16 sm:items-center sm:px-6">
      <div className="w-full max-w-sm">
        <Image
          src="/assets/logo.png"
          alt="ELEVAR"
          width={151}
          height={48}
          priority
        />
        <div className="mt-8 border border-neutral-200 bg-neutral-0 p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{titulo}</h1>
          {bajada && <p className="mt-2 text-sm text-neutral-700">{bajada}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

export interface IngresoMarcoProps {
  titulo: string;
  bajada?: ReactNode;
  children: ReactNode;
}

/** Mensaje de error del formulario, anunciado por los lectores de pantalla. */
export function AvisoError({ mensaje }: AvisoErrorProps) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">
      {mensaje}
    </p>
  );
}

export interface AvisoErrorProps {
  mensaje: string | null;
}

/** Campo del panel: etiqueta arriba, 48 px de alto, foco brand-500 (06-DISENO). */
export function CampoIngreso({ etiqueta, id, error, accesorio, ...props }: CampoIngresoProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`min-h-[48px] w-full rounded-sm border bg-neutral-50 px-4 py-3 text-base text-ink-900 transition-colors focus:bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-brand-500/25 ${
            error ? "border-status-error" : "border-neutral-200 focus:border-brand-500"
          } ${accesorio ? "pr-24" : ""}`}
          {...props}
        />
        {accesorio && <div className="absolute inset-y-0 right-0 flex items-center">{accesorio}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-status-error">
          {error}
        </p>
      )}
    </div>
  );
}

export interface CampoIngresoProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name"> {
  etiqueta: string;
  id: string;
  error?: string;
  accesorio?: ReactNode;
}

/** Botón principal de envío: deshabilitado y con otro texto mientras envía. */
export function BotonEnvio({ enviando, texto, textoEnviando }: BotonEnvioProps) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="inline-flex min-h-[44px] w-full items-center justify-center bg-ink-900 px-4 py-2.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50"
    >
      {enviando ? textoEnviando : texto}
    </button>
  );
}

export interface BotonEnvioProps {
  enviando: boolean;
  texto: string;
  textoEnviando: string;
}
