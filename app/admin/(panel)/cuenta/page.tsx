"use client";

import { useState, type FormEvent } from "react";
import { Bloque, Dato, EstadoNoListo, Titulo, useDatos, useErrorDeAccion } from "@/components/admin/datos";
import { useUsuario } from "@/components/admin/shell";
import { ConfirmDialog, adminButtonClasses, useToast } from "@/components/admin/ui";
import { ApiError, panel } from "@/lib/admin/api";
import { ROLES, fechaHora } from "@/lib/admin/formato";

/** Un nombre corto del navegador a partir del user agent. */
function dispositivo(ua: string): string {
  if (!ua) return "Navegador desconocido";
  const navegador = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const sistema = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return sistema ? `${navegador} en ${sistema}` : navegador;
}

export default function CuentaPage() {
  const usuario = useUsuario();
  const { toast, showToast } = useToast();
  const errorDeAccion = useErrorDeAccion();
  const sesiones = useDatos(() => panel.sesiones(), []);

  // Contraseña
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [cerrarOtras, setCerrarOtras] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  // Códigos de respaldo
  const [confirmarCodigos, setConfirmarCodigos] = useState(false);
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiarClave(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (nueva !== repetida) return setErrores({ repetida: "Las dos contraseñas nuevas no coinciden." });
    setGuardando(true);
    setErrores({});
    try {
      const { otras_sesiones_cerradas } = await panel.cambiarClave(actual, nueva, cerrarOtras);
      setActual("");
      setNueva("");
      setRepetida("");
      showToast(otras_sesiones_cerradas ? `Contraseña cambiada. Se cerraron ${otras_sesiones_cerradas} sesiones.` : "Contraseña cambiada");
      void sesiones.recargar();
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) {
        const campos = e.fieldErrors;
        setErrores({
          actual: campos.actual?.join(" ") ?? "",
          nueva: (campos.clave_nueva ?? campos.nueva)?.join(" ") ?? "",
        });
        if (!campos.actual && !campos.clave_nueva && !campos.nueva) setErrores({ general: errorDeAccion(e) ?? "" });
      } else {
        setErrores({ general: errorDeAccion(e) ?? "" });
      }
    } finally {
      setGuardando(false);
    }
  }

  async function generarCodigos() {
    setConfirmarCodigos(false);
    setError(null);
    try {
      setCodigos((await panel.codigosNuevos()).codigos_respaldo);
    } catch (e) {
      setError(errorDeAccion(e));
    }
  }

  async function cerrarLasOtras() {
    setError(null);
    try {
      const { cerradas } = await panel.cerrarOtrasSesiones();
      showToast(cerradas ? `Se cerraron ${cerradas} sesiones` : "No había otras sesiones");
      void sesiones.recargar();
    } catch (e) {
      setError(errorDeAccion(e));
    }
  }

  const campo = "min-h-[44px] w-full border bg-neutral-50 px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Titulo>Mi cuenta</Titulo>
      {error && <p role="alert" className="border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">{error}</p>}

      <Bloque titulo="Datos">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Dato etiqueta="Nombre">{usuario.nombre}</Dato>
          <Dato etiqueta="Correo">{usuario.correo}</Dato>
          <Dato etiqueta="Rol">{ROLES[usuario.rol] ?? usuario.rol}</Dato>
        </dl>
        <p className="mt-3 text-xs text-neutral-500">El nombre y el correo se cambian por soporte.</p>
      </Bloque>

      <Bloque titulo="Cambiar contraseña">
        <form onSubmit={cambiarClave} className="flex flex-col gap-4" noValidate>
          {errores.general && <p role="alert" className="text-sm text-status-error">{errores.general}</p>}
          {[
            { id: "actual", etiqueta: "Contraseña actual", valor: actual, set: setActual, auto: "current-password" },
            { id: "nueva", etiqueta: "Contraseña nueva", valor: nueva, set: setNueva, auto: "new-password" },
            { id: "repetida", etiqueta: "Repetí la contraseña nueva", valor: repetida, set: setRepetida, auto: "new-password" },
          ].map((c) => (
            <div key={c.id} className="flex flex-col gap-1">
              <label htmlFor={c.id} className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{c.etiqueta}</label>
              <input
                id={c.id}
                type="password"
                autoComplete={c.auto}
                maxLength={128}
                value={c.valor}
                onChange={(e) => c.set(e.target.value)}
                aria-invalid={Boolean(errores[c.id])}
                className={`${campo} ${errores[c.id] ? "border-status-error" : "border-neutral-200"}`}
              />
              {errores[c.id] && <p role="alert" className="text-sm text-status-error">{errores[c.id]}</p>}
            </div>
          ))}
          <p className="text-xs text-neutral-500">Mínimo 8 caracteres. No hace falta usar mayúsculas, números ni símbolos: una frase larga es mejor.</p>
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-ink-900">
            <input type="checkbox" checked={cerrarOtras} onChange={(e) => setCerrarOtras(e.target.checked)} className="h-5 w-5 accent-brand-500" />
            Cerrar las otras sesiones
          </label>
          <div>
            <button type="submit" disabled={guardando || !actual || !nueva} className={adminButtonClasses("primary")}>
              {guardando ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </Bloque>

      <Bloque titulo="Segundo factor">
        {codigos ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-700">Tus códigos nuevos. Los anteriores ya no sirven. Guardalos: no se vuelven a mostrar.</p>
            <ul className="grid grid-cols-1 gap-2 bg-neutral-50 p-4 font-mono text-sm text-ink-900 sm:grid-cols-2">
              {codigos.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <div>
              <button type="button" onClick={() => setCodigos(null)} className={adminButtonClasses("secondary")}>Ya los guardé</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-700">Si usaste o perdiste tus códigos de respaldo, generá otros. Los anteriores dejan de servir.</p>
            <div>
              <button type="button" onClick={() => setConfirmarCodigos(true)} className={adminButtonClasses("secondary")}>
                Generar códigos de respaldo nuevos
              </button>
            </div>
          </div>
        )}
      </Bloque>

      <Bloque
        titulo="Sesiones abiertas"
        acciones={
          sesiones.estado.tipo === "listo" && sesiones.estado.datos.length > 1 ? (
            <button type="button" onClick={() => void cerrarLasOtras()} className={adminButtonClasses("danger")}>
              Cerrar todas las otras
            </button>
          ) : undefined
        }
      >
        {sesiones.estado.tipo !== "listo" ? (
          <EstadoNoListo estado={sesiones.estado} recargar={sesiones.recargar} />
        ) : (
          <ul className="divide-y divide-neutral-200">
            {sesiones.estado.datos.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {dispositivo(s.dispositivo)}
                    {s.actual && <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-status-success">Esta sesión</span>}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Ingresó {fechaHora(s.ingreso_en)} · Último uso {fechaHora(s.ultimo_uso_en)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      <ConfirmDialog
        open={confirmarCodigos}
        title="¿Generar códigos de respaldo nuevos?"
        description="Los 10 códigos anteriores dejan de servir en este momento."
        confirmLabel="Generar códigos nuevos"
        confirmTone="primary"
        onConfirm={() => void generarCodigos()}
        onCancel={() => setConfirmarCodigos(false)}
      />
      {toast}
    </div>
  );
}
