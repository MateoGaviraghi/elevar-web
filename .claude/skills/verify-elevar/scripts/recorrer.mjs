// Entra al panel local con la cuenta inventada y recorre rutas a varios anchos: captura, saltos de línea,
// desborde horizontal y errores de consola. Sale con 1 si algo falla. Deja informe.json en --salida.
//
//   node recorrer.mjs --visor <visor.json> --salida <carpeta> --rutas /admin,/admin/consultas
//                     [--anchos 360,375,412,1440,1920] [--base http://localhost:3100] [--espera 3000]
//
// Se corre parado en una carpeta que tenga playwright instalado (ver SKILL.md, «Launch» paso 6).
import { chromium } from "playwright"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { createHmac } from "node:crypto"
import { ENLACE, revisar } from "./saltos.mjs"

const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : def }
// Git Bash convierte "/admin" en "C:/Program Files/Git/admin": se deshace.
const ruta = (r) => r.replace(/^[A-Za-z]:\/Program Files\/Git/, "")
const visor = JSON.parse(readFileSync(arg("visor"), "utf8"))
const salida = arg("salida")
const rutas = arg("rutas", "/admin").split(",").map(ruta)
const anchos = arg("anchos", "360,375,412,1440,1920").split(",").map(Number)
const B = arg("base", "http://localhost:3100")
const espera = Number(arg("espera", "3000"))
mkdirSync(salida, { recursive: true })

// Código de 6 dígitos del segundo factor, calculado con la clave del dispositivo de la cuenta inventada.
const totp = (hex) => {
  const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)))
  const h = createHmac("sha1", Buffer.from(hex, "hex")).update(c).digest(); const o = h[h.length - 1] & 0xf
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, "0")
}

const b = await chromium.launch()
const c0 = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p0 = await c0.newPage()
await p0.goto(`${B}/admin/ingresar`, { waitUntil: "networkidle" })
await p0.getByLabel("Correo").fill(visor.email)
await p0.getByLabel("Contraseña", { exact: true }).fill(visor.clave)
await p0.keyboard.press("Enter")
await p0.waitForURL(/codigo/, { timeout: 30000 })
await p0.getByLabel("Código").fill(totp(visor.key))
await p0.waitForURL((u) => !/ingresar/.test(u.pathname), { timeout: 30000 })
const sesion = await c0.storageState(); await c0.close()

const informe = []; let fallas = 0
for (const r of rutas) for (const w of anchos) {
  const cel = w < 768
  const ctx = await b.newContext({ viewport: { width: w, height: cel ? 812 : w >= 1920 ? 1080 : 900 }, isMobile: cel, hasTouch: cel, storageState: sesion })
  const p = await ctx.newPage(); const errores = []
  p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)))
  p.on("pageerror", (e) => errores.push(String(e).slice(0, 200)))
  await p.goto(`${B}${r}`, { waitUntil: "networkidle" }); await p.waitForTimeout(espera)
  const saltos = await p.evaluate(revisar, [ENLACE, "main"]).catch((e) => [`no se pudo medir: ${e.message}`])
  const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const nombre = `${r.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "raiz"}-${w}.png`
  await p.screenshot({ path: `${salida}/${nombre}`, fullPage: true })
  const mal = saltos.length + (desborde > 0 ? 1 : 0) + errores.length
  fallas += mal
  informe.push({ ruta: r, ancho: w, saltos, desborde, errores, captura: nombre })
  console.log(`${mal ? "FALLA" : "ok   "} ${r} @${w}: saltos ${saltos.length} · desborde ${desborde} · consola ${errores.length}`)
  for (const s of saltos) console.log(`      salto: ${typeof s === "string" ? s : JSON.stringify(s).slice(0, 160)}`)
  for (const e of errores) console.log(`      consola: ${e}`)
  await ctx.close()
}
writeFileSync(`${salida}/informe.json`, JSON.stringify(informe, null, 1))
await b.close()
process.exit(fallas ? 1 : 0)
