// Arma cuatro órdenes inventadas en la base local por el checkout real del backend, con el pago simulado
// de Mercado Pago (el backend local lo prende solo si no tiene MP_ACCESS_TOKEN; si no, MP_FAKE_MODE=1).
// Correos prueba.<estado>@ejemplo.com. Deja <salida>/ordenes.json con { pagada, devuelta, fallida, pendiente }.
// La «devuelta» sale pagada: la devolución la aplica ordenes_prueba.py con MODO=devolver.
//
//   node ordenes-prueba.mjs --salida <carpeta> [--api http://localhost:8001]
import { mkdirSync, writeFileSync } from "node:fs"
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const salida = arg("salida"), API = `${arg("api", "http://localhost:8001")}/api/v1`
mkdirSync(salida, { recursive: true })
const post = async (u, body) => {
  const r = await fetch(API + u, { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3100" }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${u} → ${r.status} ${JSON.stringify(j)}`)
  return j
}
const cursos = await (await fetch(`${API}/courses/?modality=ASYNC&page_size=3`)).json()
const ids = (cursos.results ?? cursos).map((c) => c.id)
if (ids.length < 3) throw new Error("hacen falta 3 cursos asincrónicos en la base local")
const out = {}
for (const [k, curso, pago] of [["pagada", ids[0], "approved"], ["devuelta", ids[1], "approved"], ["fallida", ids[2], "rejected"], ["pendiente", ids[0], null]]) {
  const o = await post("/checkout/", { buyer: { email: `prueba.${k}@ejemplo.com`, name: `Prueba ${k[0].toUpperCase()}${k.slice(1)}`, dni: "30111222" }, items: [{ course_id: curso }], payment_method: "MERCADOPAGO" })
  if (pago) await post("/checkout/simulate/", { order_public_id: o.order_public_id, outcome: pago })
  out[k] = o.order_public_id
}
writeFileSync(`${salida}/ordenes.json`, JSON.stringify(out, null, 1))
console.log(JSON.stringify(out))
