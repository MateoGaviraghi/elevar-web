"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AvisoError, BotonEnvio, CampoIngreso, IngresoMarco } from "@/components/admin/ingreso";
import { ApiError, ingresar, rutaDeVuelta } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";

function FormularioIngreso() {
  const router = useRouter();
  const volver = rutaDeVuelta(useSearchParams().get("volver"));
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const { paso } = await ingresar(correo, clave);
      if (paso === "primer-ingreso") {
        router.replace("/admin/primer-ingreso");
      } else {
        router.replace(volver === "/admin" ? "/admin/ingresar/codigo" : `/admin/ingresar/codigo?volver=${encodeURIComponent(volver)}`);
      }
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      // Error de validación (campo vacío o raro): el mismo texto que una clave mala.
      setError(code === "VALIDATION_ERROR" ? textoDeError("CREDENCIALES_INVALIDAS") : textoDeError(code));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <AvisoError mensaje={error} />
      <CampoIngreso
        etiqueta="Correo"
        id="correo"
        type="email"
        autoComplete="username"
        required
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />
      <CampoIngreso
        etiqueta="Contraseña"
        id="clave"
        type={verClave ? "text" : "password"}
        autoComplete="current-password"
        required
        maxLength={128}
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        accesorio={
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-pressed={verClave}
            className="min-h-[44px] px-4 text-sm font-semibold text-neutral-700 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {verClave ? "Ocultar" : "Mostrar"}
          </button>
        }
      />
      <BotonEnvio enviando={enviando} texto="Continuar" textoEnviando="Verificando…" />
    </form>
  );
}

export default function IngresarPage() {
  return (
    <IngresoMarco titulo="Ingresar al panel">
      <Suspense>
        <FormularioIngreso />
      </Suspense>
    </IngresoMarco>
  );
}
