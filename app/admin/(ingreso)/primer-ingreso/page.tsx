"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AvisoError, BotonEnvio, CampoIngreso, IngresoMarco } from "@/components/admin/ingreso";
import { ApiError, confirmarPrimerIngreso, datosPrimerIngreso } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";
import type { PrimerIngresoDatos } from "@/lib/admin/tipos";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "configurar"; datos: PrimerIngresoDatos }
  | { tipo: "codigos"; codigos: string[] };

/** Primer ingreso (05-PANTALLAS): 1) QR y clave, 2) primer código (y contraseña nueva si
 * entró con la temporal), 3) los 10 códigos de respaldo, una sola vez. */
export default function PrimerIngresoPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  const cargar = useCallback(async () => {
    setEstado({ tipo: "cargando" });
    try {
      setEstado({ tipo: "configurar", datos: await datosPrimerIngreso() });
    } catch (e) {
      if (e instanceof ApiError && e.sinSesion) return router.replace("/admin/ingresar");
      if (e instanceof ApiError && e.code === "FACTOR_YA_CONFIGURADO") return router.replace("/admin");
      setEstado({ tipo: "error", mensaje: textoDeError(e instanceof ApiError ? e.code : undefined) });
    }
  }, [router]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (estado.tipo === "codigos") {
    return (
      <IngresoMarco titulo="Guardá tus códigos de respaldo">
        <CodigosRespaldo codigos={estado.codigos} onListo={() => router.replace("/admin")} />
      </IngresoMarco>
    );
  }

  return (
    <IngresoMarco
      titulo="Configurá el segundo factor"
      bajada="Vas a necesitar una app autenticadora en el celular: Google Authenticator, Microsoft Authenticator, 1Password u otra."
    >
      {estado.tipo === "cargando" && (
        <div aria-busy="true" className="space-y-3">
          <div className="mx-auto h-48 w-48 bg-neutral-200" />
          <div className="h-4 w-full bg-neutral-200" />
          <span className="sr-only">Cargando…</span>
        </div>
      )}
      {estado.tipo === "error" && (
        <div className="flex flex-col gap-4">
          <AvisoError mensaje={estado.mensaje} />
          <button
            type="button"
            onClick={() => void cargar()}
            className="inline-flex min-h-[44px] items-center justify-center border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}
      {estado.tipo === "configurar" && (
        <Configurar datos={estado.datos} onListo={(codigos) => setEstado({ tipo: "codigos", codigos })} />
      )}
    </IngresoMarco>
  );
}

function Configurar({ datos, onListo }: ConfigurarProps) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorClave, setErrorClave] = useState<string | undefined>();

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setErrorClave(undefined);
    try {
      const { codigos_respaldo } = await confirmarPrimerIngreso(codigo, datos.cambiar_clave ? claveNueva : undefined);
      onListo(codigos_respaldo);
    } catch (e) {
      if (e instanceof ApiError && e.sinSesion) return router.replace("/admin/ingresar");
      if (e instanceof ApiError && e.fieldErrors.clave_nueva) {
        setErrorClave(e.fieldErrors.clave_nueva.join(" "));
      } else {
        const code = e instanceof ApiError ? e.code : undefined;
        setError(code === "VALIDATION_ERROR" ? textoDeError("CODIGO_INCORRECTO") : textoDeError(code));
      }
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6" noValidate>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">1. Escaneá el código</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagen data: generada por el backend */}
        <img src={datos.qr} alt="Código QR para la app autenticadora" width={192} height={192} className="mx-auto mt-3 h-48 w-48" />
        <p className="mt-3 text-sm text-neutral-700">¿No podés escanearlo? Cargá esta clave a mano:</p>
        <code className="mt-1 block break-all bg-neutral-50 px-3 py-2 font-mono text-sm text-ink-900">{datos.clave}</code>
      </section>
      <section className="flex flex-col gap-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">2. Confirmá con el primer código</h2>
        <AvisoError mensaje={error} />
        <CampoIngreso
          etiqueta="Código de la app"
          id="codigo"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
        />
        {datos.cambiar_clave && (
          <CampoIngreso
            etiqueta="Contraseña nueva"
            id="clave_nueva"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            error={errorClave}
          />
        )}
        <BotonEnvio enviando={enviando} texto="Confirmar" textoEnviando="Confirmando…" />
      </section>
    </form>
  );
}

interface ConfigurarProps {
  datos: PrimerIngresoDatos;
  onListo: (codigos: string[]) => void;
}

function CodigosRespaldo({ codigos, onListo }: CodigosRespaldoProps) {
  function descargar() {
    const texto = `Códigos de respaldo del panel de ELEVAR\nCada uno sirve una sola vez.\n\n${codigos.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "elevar-codigos-de-respaldo.txt";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-neutral-700">
        Si perdés el celular, cada uno de estos códigos te deja entrar una vez. Guardalos en un lugar seguro: no se
        vuelven a mostrar.
      </p>
      <ul className="grid grid-cols-1 gap-2 bg-neutral-50 p-4 font-mono text-sm text-ink-900 sm:grid-cols-2">
        {codigos.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={descargar}
        className="inline-flex min-h-[44px] items-center justify-center border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        Descargar
      </button>
      <button
        type="button"
        onClick={onListo}
        className="inline-flex min-h-[44px] items-center justify-center bg-ink-900 px-4 py-2.5 text-sm font-semibold text-neutral-0 hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        Ya los guardé
      </button>
    </div>
  );
}

interface CodigosRespaldoProps {
  codigos: string[];
  onListo: () => void;
}
