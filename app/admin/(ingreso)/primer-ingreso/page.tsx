"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AvisoError,
  BotonEnvio,
  BotonSecundario,
  CampoCodigo,
  CampoIngreso,
  IndicadorPasos,
  IngresoMarco,
  Oraciones,
  esperar,
  useIngreso,
} from "@/components/admin/ingreso";
import { ApiError, confirmarPrimerIngreso, datosPrimerIngreso } from "@/lib/admin/api";
import { textoDeError } from "@/lib/admin/formato";
import { pegar } from "@/lib/texto";
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
  const { salir } = useIngreso();

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
      <IngresoMarco
        titulo="Guardá tus códigos de respaldo"
        ancho="ancho"
        encabezado={<IndicadorPasos actual={2} total={2} nombre="Códigos de respaldo" />}
      >
        <CodigosRespaldo
          codigos={estado.codigos}
          onListo={async () => {
            await salir();
            router.replace("/admin");
          }}
        />
      </IngresoMarco>
    );
  }

  return (
    <IngresoMarco
      titulo="Configurá el segundo factor"
      bajada="Vas a necesitar una app autenticadora en el celular: Google Authenticator, Microsoft Authenticator, 1Password u otra."
      ancho="ancho"
      encabezado={<IndicadorPasos actual={1} total={2} nombre="App autenticadora" />}
    >
      {estado.tipo === "cargando" && (
        <div aria-busy="true" className="flex animate-pulse gap-5">
          <div className="h-40 w-40 shrink-0 bg-[color:var(--c-borde)]" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-4 w-3/4 bg-[color:var(--c-borde)]" />
            <div className="h-10 w-full bg-[color:var(--c-borde)]" />
          </div>
          <span className="sr-only">Cargando…</span>
        </div>
      )}
      {estado.tipo === "error" && (
        <div className="flex flex-col gap-4">
          <AvisoError mensaje={estado.mensaje} />
          <BotonSecundario onClick={() => void cargar()}>Reintentar</BotonSecundario>
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
  const [sacudir, setSacudir] = useState(0);
  const [correcto, setCorrecto] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setErrorClave(undefined);
    try {
      const { codigos_respaldo } = await confirmarPrimerIngreso(codigo, datos.cambiar_clave ? claveNueva : undefined);
      setEnviando(false);
      setCorrecto(true);
      await esperar(1050);
      onListo(codigos_respaldo);
    } catch (e) {
      if (e instanceof ApiError && e.sinSesion) return router.replace("/admin/ingresar");
      if (e instanceof ApiError && e.fieldErrors.clave_nueva) {
        setErrorClave(e.fieldErrors.clave_nueva.join(" "));
      } else {
        const code = e instanceof ApiError ? e.code : undefined;
        setError(code === "VALIDATION_ERROR" ? textoDeError("CODIGO_INCORRECTO") : textoDeError(code));
        setCodigo("");
        setSacudir((n) => n + 1);
      }
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-8" noValidate>
      <section>
        <h2 className="font-display text-lg font-semibold text-[color:var(--t-titulo)]">{pegar("1. Escaneá el código con la app")}</h2>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen data: generada por el backend */}
          <img
            src={datos.qr}
            alt="Código QR para la app autenticadora"
            width={160}
            height={160}
            className="h-40 w-40 shrink-0 self-center rounded-[14px] border border-[color:var(--c-borde)] bg-neutral-0 p-2 sm:self-start"
          />
          <p className="text-sm text-[color:var(--t-texto)] sm:pt-2">
            <Oraciones texto="Abrí la app, tocá «Agregar» o «+» y elegí escanear un código QR. Apuntá la cámara a este código." />
          </p>
        </div>
        <p className="mt-5 text-sm text-[color:var(--t-texto)]"><Oraciones texto="¿No podés escanearlo? Cargá esta clave a mano en la app:" /></p>
        <code className="mt-2 block break-all rounded-[12px] border border-[color:var(--c-borde)] bg-[color:var(--c-fondo)] px-3 py-2.5 font-mono text-[13px] tracking-wide text-[color:var(--c-texto)]">
          {datos.clave}
        </code>
      </section>
      <section className="flex flex-col gap-5 border-t border-[color:var(--pie-borde)] pt-8">
        <h2 className="font-display text-lg font-semibold text-[color:var(--t-titulo)]">{pegar("2. Confirmá con el primer código")}</h2>
        <AvisoError mensaje={error} />
        <CampoCodigo etiqueta="Código de la app" id="codigo" valor={codigo} alCambiar={setCodigo} deshabilitado={enviando || correcto} sacudir={sacudir} correcto={correcto} />
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
        <BotonEnvio enviando={enviando} texto="Confirmar" textoEnviando="Confirmando…" exito={correcto} textoExito="Código correcto" />
      </section>
    </form>
  );
}

interface ConfigurarProps {
  datos: PrimerIngresoDatos;
  onListo: (codigos: string[]) => void;
}

function CodigosRespaldo({ codigos, onListo }: CodigosRespaldoProps) {
  const [saliendo, setSaliendo] = useState(false);
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
      <p className="text-base text-[color:var(--t-texto)]">
        <Oraciones texto="Si perdés el celular, cada uno de estos códigos te deja entrar una vez. Guardalos en un lugar seguro: no se vuelven a mostrar." />
      </p>
      <ol className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-[16px] border border-[color:var(--c-borde)] bg-[color:var(--c-fondo)] p-5 font-mono text-base text-[color:var(--c-texto)] sm:grid-cols-2 sm:text-sm">
        {codigos.map((c, i) => (
          <li key={c} className="flex gap-3 whitespace-nowrap">
            <span aria-hidden className="w-5 select-none text-right text-[color:var(--t-etiqueta)] tabular-nums">{i + 1}</span>
            {c}
          </li>
        ))}
      </ol>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSaliendo(true);
          onListo();
        }}
      >
        <BotonSecundario onClick={descargar}>Descargar</BotonSecundario>
        <BotonEnvio enviando={saliendo} texto="Ya los guardé" textoEnviando="Entrando…" />
      </form>
    </div>
  );
}

interface CodigosRespaldoProps {
  codigos: string[];
  onListo: () => void;
}
