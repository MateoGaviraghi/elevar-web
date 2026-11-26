// Cómo se ve y se mueve cada control al usarlo (Mateo, 2026-11-26: «la función de verificar no la estás usando
// como corresponde»). Por cada botón, link y tarjeta de `main` (y del diálogo abierto, si hay): captura en reposo,
// con el mouse a 80/250/600 ms, al sacarlo a 100/300/800 ms, con foco y apretado. Marca como FALLA:
//   - cortado: el control no entra entero en su caja (una tabla que lo empuja fuera, p. ej.);
//   - ilegible: con el mouse encima, casi no hay píxeles que se distingan del fondo (texto del color del relleno);
//   - restos: 800 ms después de sacar el mouse no volvió a como estaba en reposo (una línea que queda);
//   - quieto: tiene un ícono del panel (`[data-icono]`) y no se mueve al entrar el mouse, o no se mueve la segunda vez.
// Con --tiempos mide cuánto tarda pasar de una pantalla a otra por el menú (dos vueltas; con el mouse 300 ms antes).
// Deja estados.json y una hoja de contacto por ruta (hoja-<ruta>.png) en --salida. Sale con 1 si algo falla.
//
//   node estados.mjs --visor <visor.json> --salida <carpeta> --rutas /admin,/admin/cursos
//                    [--base http://localhost:3100] [--max 40] [--abrir-fila] [--tiempos]
//
// Se corre parado en la carpeta con playwright (SKILL.md, «Launch» paso 6). Mirar las hojas, no solo los números.
import { chromium } from "playwright"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { createHmac } from "node:crypto"

const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : def }
const bandera = (n) => process.argv.includes(`--${n}`)
const ruta = (r) => r.replace(/^[A-Za-z]:\/Program Files\/Git/, "")
const visor = JSON.parse(readFileSync(arg("visor"), "utf8"))
const salida = arg("salida")
const rutas = arg("rutas", "/admin").split(",").map(ruta)
const B = arg("base", "http://localhost:3100")
const MAX = Number(arg("max", "40"))
mkdirSync(salida, { recursive: true })

const totp = (hex) => {
  const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)))
  const h = createHmac("sha1", Buffer.from(hex, "hex")).update(c).digest(); const o = h[h.length - 1] & 0xf
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, "0")
}

const b = await chromium.launch()
const c0 = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p0 = await c0.newPage()
await p0.goto(`${B}/admin/ingresar`, { waitUntil: "networkidle" })
await p0.getByLabel("Correo").fill(visor.email); await p0.getByLabel("Contraseña", { exact: true }).fill(visor.clave); await p0.keyboard.press("Enter")
await p0.waitForURL(/codigo/, { timeout: 30000 }); await p0.getByLabel("Código").fill(totp(visor.key))
await p0.waitForURL((u) => !/ingresar/.test(u.pathname), { timeout: 30000 })
const sesion = await c0.storageState(); await c0.close()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: sesion }); const p = await ctx.newPage()
const errores = []; p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200))); p.on("pageerror", (e) => errores.push(String(e).slice(0, 200)))

// Mide una captura dentro de la página (canvas): cuántos píxeles se apartan del color que más se repite.
const pixeles = async (buf) => p.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode()
  const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height
  const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0); const d = cx.getImageData(0, 0, cv.width, cv.height).data
  const cuenta = new Map(); const lum = []
  for (let i = 0; i < d.length; i += 4) { const l = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]); lum.push(l); const k = l >> 3; cuenta.set(k, (cuenta.get(k) ?? 0) + 1) }
  const fondo = ((([...cuenta.entries()].sort((a, z) => z[1] - a[1])[0]) ?? [0])[0] << 3) + 4
  return { distintos: lum.filter((l) => Math.abs(l - fondo) > 70).length / lum.length, lum }
}, `data:image/png;base64,${buf.toString("base64")}`)
const diferencia = (a, z) => { if (a.length !== z.length) return 1; let n = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - z[i]) > 40) n++; return n / a.length }
const offset = (loc) => loc.evaluate((el) => { const q = el.querySelector("[data-icono] path"); return q ? Number(getComputedStyle(q).strokeDashoffset.replace("px", "")) || 0 : null })
const lejos = () => p.mouse.move(2, 898)

const informe = []; let fallas = 0
async function controlar(rutaActual, loc, nombre, hoja) {
  await loc.scrollIntoViewIfNeeded(); await lejos(); await p.waitForTimeout(700)
  const bx = await loc.boundingBox(); if (!bx || bx.width < 4) return
  const cortado = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect(); let c = el.parentElement
    while (c && c !== document.body) { const s = getComputedStyle(c); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { const q = c.getBoundingClientRect(); if (r.right > q.right + 1 || r.left < q.left - 1) return true } c = c.parentElement }
    return r.right > innerWidth + 1
  })
  const clip = { x: Math.max(0, bx.x - 8), y: Math.max(0, bx.y - 8), width: Math.min(bx.width + 16, 1440 - Math.max(0, bx.x - 8)), height: bx.height + 16 }
  const foto = async (et) => { const f = `${hoja.prefijo}-${hoja.n++}.png`; const buf = await p.screenshot({ path: `${salida}/${f}`, clip }); hoja.fotos.push([nombre, et, f]); return buf }
  const reposo = await pixeles(await foto("reposo"))
  const mov = []; let encima = null; let salida800 = null
  for (const vuelta of [1, 2]) {
    await loc.hover({ force: true }).catch(() => {}); await p.waitForTimeout(110); mov.push(await offset(loc).catch(() => null))
    if (vuelta === 1) { await foto("mouse 80"); await p.waitForTimeout(140); await foto("mouse 250"); await p.waitForTimeout(350); encima = await pixeles(await foto("mouse 600")) } else await p.waitForTimeout(700)
    await lejos()
    if (vuelta === 1) { await p.waitForTimeout(100); await foto("sale 100"); await p.waitForTimeout(200); await foto("sale 300"); await p.waitForTimeout(500); salida800 = await pixeles(await foto("sale 800")) } else await p.waitForTimeout(900)
  }
  await loc.focus().catch(() => {}); await p.waitForTimeout(600); await foto("foco"); await p.evaluate(() => document.activeElement?.blur())
  await loc.hover({ force: true }).catch(() => {}); await p.waitForTimeout(600); await p.mouse.down(); await p.waitForTimeout(90); await foto("apretado"); await lejos(); await p.mouse.up()
  // Apretar y salir arrastra una selección de texto: se borra para que no ensucie el control siguiente.
  await p.evaluate(() => getSelection()?.removeAllRanges()); await p.waitForTimeout(300)
  const tieneIcono = mov[0] !== null
  const hallazgos = []
  if (cortado) hallazgos.push("cortado")
  // Un control con texto tiene que tener texto a la vista; uno de solo ícono («Siguiente», «?») tiene pocos píxeles de por sí.
  const conTexto = ((await loc.innerText().catch(() => "")) || "").replace(/\s+/g, "").length >= 3
  if (encima && encima.distintos < (conTexto ? 0.015 : 0.003)) hallazgos.push(`ilegible con el mouse (${(encima.distintos * 100).toFixed(1)} % de píxeles distintos)`)
  if (salida800) { const dif = diferencia(reposo.lum, salida800.lum); if (dif > 0.01) hallazgos.push(`restos al salir (${(dif * 100).toFixed(1)} % distinto del reposo)`) }
  if (tieneIcono && !(mov[0] > 0.05)) hallazgos.push("ícono quieto al entrar")
  if (tieneIcono && !(mov[1] > 0.05)) hallazgos.push("ícono quieto la segunda vez")
  fallas += hallazgos.length
  informe.push({ ruta: rutaActual, control: nombre, icono: tieneIcono ? mov : null, hallazgos })
  console.log(`${hallazgos.length ? "FALLA" : "ok   "} ${rutaActual} · ${nombre}${hallazgos.length ? ": " + hallazgos.join("; ") : ""}`)
}

async function recorrerControles(rutaActual, raiz, hoja) {
  const todos = raiz.locator("button:visible, a:visible, [data-tarjeta]:visible")
  const n = Math.min(await todos.count(), MAX)
  const vistos = new Set()
  for (let i = 0; i < n; i++) {
    const loc = todos.nth(i)
    const nombre = ((await loc.getAttribute("aria-label").catch(() => null)) || (await loc.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim().slice(0, 40) || `control ${i}`
    // Una sola vez cada tipo de control repetido (la fila 2 de «Editar» es igual a la 1).
    const tipo = nombre.replace(/\d+/g, "#")
    if (vistos.has(tipo)) continue; vistos.add(tipo)
    try { await controlar(rutaActual, loc, nombre, hoja) } catch (e) { console.log(`aviso ${rutaActual} · ${nombre}: ${String(e).split(/\r?\n/)[0]}`) }
  }
}

for (const r of rutas) {
  await p.goto(`${B}${r}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1500)
  const hoja = { prefijo: (r.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "raiz"), n: 0, fotos: [] }
  await recorrerControles(r, p.locator("main"), hoja)
  if (bandera("abrir-fila") && await p.locator("tbody tr").count()) {
    await p.goto(`${B}${r}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1200)
    await p.locator("tbody tr").first().click(); await p.waitForTimeout(1600)
    if (await p.getByRole("dialog").count()) await recorrerControles(`${r} (tarjeta)`, p.getByRole("dialog"), hoja)
    await p.keyboard.press("Escape").catch(() => {})
  }
  // La hoja de contacto: una fila por control con todos sus cuadros.
  const filas = new Map(); for (const [c, et, f] of hoja.fotos) { if (!filas.has(c)) filas.set(c, []); filas.get(c).push([et, f]) }
  writeFileSync(`${salida}/_${hoja.prefijo}.html`, `<body style="margin:0;font:12px sans-serif;background:#e5e7eb">${[...filas].map(([c, fs]) => `<div style="padding:6px 8px;border-bottom:1px solid #ccc"><b>${c.replace(/</g, "")}</b><div style="display:flex;gap:6px;flex-wrap:wrap">${fs.map(([et, f]) => `<figure style="margin:0"><img src="${f}" style="max-height:90px;max-width:380px;display:block;background:#fff"><figcaption>${et}</figcaption></figure>`).join("")}</div></div>`).join("")}</body>`)
  const ph = await b.newPage({ viewport: { width: 1600, height: 900 } }); await ph.goto(`file:///${salida.replace(/\\/g, "/")}/_${hoja.prefijo}.html`); await ph.waitForTimeout(300)
  await ph.screenshot({ path: `${salida}/hoja-${hoja.prefijo}.png`, fullPage: true }); await ph.close()
}

let tiempos = null
if (bandera("tiempos")) {
  tiempos = []
  await p.goto(`${B}/admin`, { waitUntil: "networkidle" }); await p.waitForTimeout(1000)
  for (const [modo, espera] of [["clic directo", 0], ["mouse 300 ms antes", 300]]) for (const vuelta of [1, 2]) for (const nombre of ["Consultas", "Órdenes", "Inscripciones", "Cursos"]) {
    const link = p.getByRole("navigation").getByRole("link", { name: new RegExp(`^${nombre}`) }).first()
    if (espera) { await link.hover(); await p.waitForTimeout(espera) }
    const t0 = Date.now(); await link.click()
    await p.waitForFunction((t) => document.querySelector("#titulo-lista")?.textContent?.includes(t) && document.querySelectorAll("tbody tr").length > 0 && !document.querySelector("main [aria-busy=true]"), nombre, { timeout: 60000 })
    tiempos.push({ modo, vuelta, pantalla: nombre, ms: Date.now() - t0 }); await p.waitForTimeout(400)
  }
  console.log("tiempos: " + tiempos.map((t) => `${t.modo} ${t.vuelta}ª ${t.pantalla} ${t.ms} ms`).join(" | "))
}

if (errores.length) { fallas += errores.length; console.log(`FALLA consola: ${errores.slice(0, 5).join(" | ")}`) }
writeFileSync(`${salida}/estados.json`, JSON.stringify({ informe, tiempos, errores }, null, 1))
console.log(`${informe.length} controles, ${fallas} fallas`)
await b.close()
process.exit(fallas ? 1 : 0)
