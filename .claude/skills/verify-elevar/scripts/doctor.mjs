// Chequeo de solo lectura de la instancia local.
//   Panel:          node doctor.mjs <visor.json> [http://localhost:3100] [http://localhost:8001]
//                   backend en 8001, sitio en 3100 y que la cuenta inventada exista.
//   Sitio público:  node doctor.mjs --sitio [http://localhost:3100] [http://localhost:8001]
//                   sitio y /blog en 3100; el catálogo del backend (solo avisa: el blog no lo necesita,
//                   Inicio, Formación, cursos y checkout sí).
import { readFileSync, existsSync } from "node:fs"
const args = process.argv.slice(2)
let mal = 0
const ok = (cond, texto) => { console.log(`${cond ? "ok   " : "FALLA"} ${texto}`); if (!cond) mal++ }
const aviso = (cond, texto) => console.log(`${cond ? "ok   " : "AVISO"} ${texto}`)
const estado = async (url) => { try { return (await fetch(url, { redirect: "manual" })).status } catch { return 0 } }

if (args[0] === "--sitio") {
  const [, B = "http://localhost:3100", API = "http://localhost:8001"] = args
  const inicio = await estado(`${B}/`)
  ok(inicio === 200, `sitio responde en ${B}/ (→ ${inicio})`)
  const blog = await estado(`${B}/blog`)
  ok(blog === 200, `el blog responde en ${B}/blog (→ ${blog})`)
  let cursos = -1
  try { const r = await fetch(`${API}/api/v1/courses/`); const j = await r.json(); cursos = Array.isArray(j) ? j.length : (j.count ?? j.results?.length ?? -1) } catch { /* sin backend */ }
  aviso(cursos > 0, `catálogo del backend en ${API}: ${cursos < 0 ? "no responde" : `${cursos} cursos`} (hace falta para Inicio, Formación, cursos y checkout)`)
  process.exit(mal ? 1 : 0)
}

const [visorFile, B = "http://localhost:3100", API = "http://localhost:8001"] = args
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
