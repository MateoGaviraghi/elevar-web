/**
 * Tipos del panel: copian campo por campo las respuestas de Django (elevar-backend/panel).
 * Si cambia un serializer o una vista, cambia este archivo en el mismo PR (08-CODIGO).
 */

export type Rol = "admin";

/** POST ingreso/ → paso siguiente. */
export interface IngresoRespuesta {
  paso: "codigo" | "primer-ingreso";
}

/** GET yo/ (YoSerializer). */
export interface Yo {
  nombre: string;
  correo: string;
  rol: Rol;
  segundo_factor_listo: boolean;
  cambiar_clave: boolean;
}

/** GET primer-ingreso/ (panel.ingreso.datos_primer_ingreso). */
export interface PrimerIngresoDatos {
  otpauth_url: string;
  /** Imagen SVG en una dirección data:, para un <img>. */
  qr: string;
  /** La clave en base32, para cargarla a mano. */
  clave: string;
  cambiar_clave: boolean;
}

/** POST primer-ingreso/ → los 10 códigos de respaldo, una sola vez. */
export interface PrimerIngresoRespuesta {
  codigos_respaldo: string[];
}

/** Formato común de error del backend (core/exceptions.py). */
export interface ErrorApi {
  error: {
    code: string;
    message: string;
    field_errors?: Record<string, string[]>;
  };
}
