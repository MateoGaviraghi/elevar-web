// Chequeo de solo lectura de la instancia local: backend en 8001, sitio en 3100 y que la cuenta inventada exista.
//   node doctor.mjs <visor.json> [http://localhost:3100] [http://localhost:8001]
import { readFileSync, existsSync } from "node:fs"
const [visorFile, B = "http://localhost:3100", API = "http://localhost:8001"] = process.argv.slice(2)
let mal = 0
const ok = (cond, texto) => { console.log(`${cond ? "ok   " : "FALLA"} ${texto}`); if (!cond) mal++ }
const estado = async (url) => { try { return (await fetch(url, { redirect: "manual" })).status } catch { return 0 } }

const api = await estado(`${API}/api/v1/panel/csrf/`)
ok(api === 200, `backend responde en ${API} (csrf → ${api})`)
const web = await estado(`${B}/admin/ingresar`)
ok(web === 200, `sitio responde en ${B}/admin/ingresar (→ ${web})`)
ok(visorFile && existsSync(visorFile), `existe la cuenta inventada (${visorFile ?? "sin archivo"})`)
if (visorFile && existsSync(visorFile)) {
  const v = JSON.parse(readFileSync(visorFile, "utf8"))
  ok(/@ejemplo\.com$/.test(v.email), "la cuenta es inventada (@ejemplo.com)")
}
process.exit(mal ? 1 : 0)
