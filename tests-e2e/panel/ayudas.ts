/** Ayudas de las pruebas del panel: alta por comando y códigos TOTP (RFC 6238) sin librerías. */
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const DATOS = path.resolve(__dirname, "../../playwright/.auth/panel.json");

export interface UsuariaDePrueba {
  correo: string;
  clave: string;
  secreto: string;
  nombre: string;
}

const BACKEND_DIR = process.env.ELEVAR_BACKEND_DIR ?? path.resolve(__dirname, "../../../elevar-backend");

/** Crea un usuario del panel con el comando de la etapa 1 y devuelve su contraseña temporal. */
export function crearUsuaria(correo: string, nombre: string): string {
  const salida = execFileSync(
    path.join(BACKEND_DIR, ".venv/bin/python"),
    ["manage.py", "crear_usuario_panel", "--correo", correo, "--rol", "admin", "--nombre", nombre],
    {
      cwd: BACKEND_DIR,
      env: { ...process.env, DB_PORT: process.env.DB_PORT ?? "5434", DB_NAME: "elevar_e2e" },
      encoding: "utf8",
    },
  );
  const clave = /vence en 72 horas\): (\S+)/.exec(salida)?.[1];
  if (!clave) throw new Error("El comando no mostró la contraseña temporal");
  return clave;
}

function base32(texto: string): Buffer {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of texto.replace(/=+$/, "").toUpperCase()) bits += alfabeto.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secreto: string, paso: number): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(paso));
  const hmac = createHmac("sha1", base32(secreto)).update(contador).digest();
  const desde = hmac[hmac.length - 1] & 0xf;
  const valor = (hmac.readUInt32BE(desde) & 0x7fffffff) % 1_000_000;
  return String(valor).padStart(6, "0");
}

// En un archivo y no en memoria: Playwright reinicia el proceso después de una falla, y Django
// (con razón) rechaza un código ya usado.
const ULTIMO_PASO = path.resolve(__dirname, "../../playwright/.auth/ultimo-paso");

function ultimoPaso(): number {
  try {
    return Number(fs.readFileSync(ULTIMO_PASO, "utf8"));
  } catch {
    return -1;
  }
}

/** Un código nuevo: si el de esta ventana de 30 s ya se usó, espera a la siguiente. */
export async function codigoNuevo(secreto: string): Promise<string> {
  let paso = Math.floor(Date.now() / 30_000);
  while (paso <= ultimoPaso()) {
    await new Promise((r) => setTimeout(r, 1_000));
    paso = Math.floor(Date.now() / 30_000);
  }
  fs.mkdirSync(path.dirname(ULTIMO_PASO), { recursive: true });
  fs.writeFileSync(ULTIMO_PASO, String(paso));
  return totp(secreto, paso);
}

export function guardar(datos: UsuariaDePrueba) {
  fs.mkdirSync(path.dirname(DATOS), { recursive: true });
  fs.writeFileSync(DATOS, JSON.stringify(datos));
}

export function leer(): UsuariaDePrueba {
  return JSON.parse(fs.readFileSync(DATOS, "utf8")) as UsuariaDePrueba;
}
