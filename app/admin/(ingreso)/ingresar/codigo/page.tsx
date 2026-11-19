"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type FormEvent } from "react";
import {
  AYUDA_ACCESO,
  AvisoError,
  BotonEnvio,
  BotonTexto,
  CampoCodigo,
  CampoIngreso,
  IngresoMarco,
  esperar,
  useIngreso,
} from "@/components/admin/ingreso";
import { ApiError, enviarCodigo, rutaDeIngreso, rutaDeVuelta } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";

function FormularioCodigo() {
  const router = useRouter();
  const volver = rutaDeVuelta(useSearchParams().get("volver"));
  const [respaldo, setRespaldo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sacudir, setSacudir] = useState(0);
  const [correcto, setCorrecto] = useState(false);
  const { salir } = useIngreso();
  // Guardia sin esperar a React: el envío automático y el botón no pueden mandar dos veces.
  const enviandoAhora = useRef(false);

  async function enviarCon(valor: string) {
    if (enviandoAhora.current) return;
    enviandoAhora.current = true;
    setEnviando(true);
    setError(null);
    try {
      await enviarCodigo(valor);
      // Código aceptado: las casillas se ponen verdes, el botón también, y después la salida.
      setEnviando(false);
      setCorrecto(true);
      await esperar(1050);
      await salir();
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
      // Con el código de la app se borra para escribir el próximo; el de respaldo se deja para corregirlo.
      if (!respaldo) setCodigo("");
      setSacudir((n) => n + 1);
      setEnviando(false);
      enviandoAhora.current = false;
    }
  }

  /** Con el código de la app, al completar los 6 dígitos se envía solo (pedido de Mateo,
   * 2026-11-18): sin apretar Enter ni «Ingresar». El de respaldo se confirma con el botón. */
  function cambiarCodigoApp(valor: string) {
    setCodigo(valor);
    if (valor.length === 6) void enviarCon(valor);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void enviarCon(codigo);
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
        <CampoCodigo
          key="app"
          etiqueta="Código"
          id="codigo"
          valor={codigo}
          alCambiar={cambiarCodigoApp}
          deshabilitado={enviando || correcto}
          sacudir={sacudir}
          correcto={correcto}
        />
      )}
      <BotonEnvio enviando={enviando} texto="Ingresar" textoEnviando="Verificando…" exito={correcto} textoExito="Código correcto" />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <BotonTexto
          onClick={() => {
            setRespaldo((v) => !v);
            setCodigo("");
            setError(null);
          }}
        >
          {respaldo ? "Usar el código de la app" : "Usar un código de respaldo"}
        </BotonTexto>
        <BotonTexto onClick={() => router.replace(rutaDeIngreso(volver))}>Volver a empezar</BotonTexto>
      </div>
    </form>
  );
}

export default function CodigoPage() {
  return (
    <IngresoMarco
      titulo="Segundo paso"
      bajada="Escribí el código de 6 dígitos que muestra tu app autenticadora. Cambia cada 30 segundos."
      pie={AYUDA_ACCESO}
    >
      <Suspense>
        <FormularioCodigo />
      </Suspense>
    </IngresoMarco>
  );
}
