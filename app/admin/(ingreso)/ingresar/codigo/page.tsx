"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AvisoError, BotonEnvio, CampoIngreso, IngresoMarco } from "@/components/admin/ingreso";
import { ApiError, enviarCodigo, rutaDeIngreso, rutaDeVuelta } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";

function FormularioCodigo() {
  const router = useRouter();
  const volver = rutaDeVuelta(useSearchParams().get("volver"));
  const [respaldo, setRespaldo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await enviarCodigo(codigo);
      router.replace(volver);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.sinSesion) {
        // Pasaron más de 5 minutos desde la contraseña: se empieza de nuevo.
        router.replace(rutaDeIngreso(volver));
        return;
      }
      const code = e instanceof ApiError ? e.code : undefined;
      setError(code === "VALIDATION_ERROR" ? textoDeError("CODIGO_INCORRECTO") : textoDeError(code));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <AvisoError mensaje={error} />
      {respaldo ? (
        <CampoIngreso
          key="respaldo"
          etiqueta="Código de respaldo"
          id="codigo"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
      ) : (
        <CampoIngreso
          key="app"
          etiqueta="Código"
          id="codigo"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
        />
      )}
      <button
        type="button"
        onClick={() => {
          setRespaldo((v) => !v);
          setCodigo("");
          setError(null);
        }}
        className="self-start text-sm font-semibold text-brand-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {respaldo ? "Usar el código de la app" : "Usar un código de respaldo"}
      </button>
      <BotonEnvio enviando={enviando} texto="Ingresar" textoEnviando="Verificando…" />
    </form>
  );
}

export default function CodigoPage() {
  return (
    <IngresoMarco titulo="Segundo paso" bajada="Escribí el código de 6 dígitos de tu app autenticadora.">
      <Suspense>
        <FormularioCodigo />
      </Suspense>
    </IngresoMarco>
  );
}
