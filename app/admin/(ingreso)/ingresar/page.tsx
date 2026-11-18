"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AYUDA_ACCESO, AvisoError, BotonEnvio, BotonOjo, CampoIngreso, IngresoMarco, esperar } from "@/components/admin/ingreso";
import { ApiError, ingresar, rutaDeVuelta } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";

function FormularioIngreso() {
  const router = useRouter();
  const volver = rutaDeVuelta(useSearchParams().get("volver"));
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const { paso } = await ingresar(correo, clave);
      // Contraseña correcta: el botón se pone verde con el tilde y recién después se sigue.
      setEnviando(false);
      setExito(true);
      await esperar(950);
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
        alEnter={() => document.getElementById("clave")?.focus()}
        type="email"
        autoComplete="username"
        required
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        ok={/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)}
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
        accesorio={<BotonOjo visible={verClave} alCambiar={() => setVerClave((v) => !v)} />}
      />
      <BotonEnvio enviando={enviando} texto="Continuar" textoEnviando="Verificando…" exito={exito} textoExito="Contraseña correcta" />
    </form>
  );
}

export default function IngresarPage() {
  return (
    <IngresoMarco
      titulo="Ingresar al panel"
      bajada="Entrá con tu correo y tu contraseña. Después te pedimos el código de la app."
      pie={AYUDA_ACCESO}
    >
      <Suspense>
        <FormularioIngreso />
      </Suspense>
    </IngresoMarco>
  );
}
