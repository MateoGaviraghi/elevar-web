// Recorre páginas del SITIO PÚBLICO (sin sesión) a varios anchos, como una persona que entra y baja leyendo.
// Por cada ruta y ancho:
//   - cuadros de la entrada (0,4 · 1,2 · 2,8 s) a 375 y 1440, para ver que nada asome antes de tiempo;
//   - baja la página de a 60 % de pantalla cada 0,7 s (así disparan las animaciones con scroll) y vuelve arriba;
//   - chequeo de saltos de línea sobre `main` (saltos.mjs), desborde horizontal, errores de consola,
//     imágenes rotas, textos que se salen de su caja y lo que quedó invisible después de bajar
//     (una entrada que no se disparó deja una franja vacía);
//   - captura de la página entera.
// Una vez por ruta: los links internos de la página responden 200, y una pasada con «menos movimiento»
// a 1440 donde todo tiene que verse.
// Sale con 1 si algo falla. Deja informe.json en --salida.
//
//   node recorrer-sitio.mjs --salida <carpeta> --rutas /,/blog
//                           [--anchos 360,375,412,1440,1920] [--base http://localhost:3100] [--espera 1500]
//                           [--sin-links]
//
// Se corre parado en una carpeta que tenga playwright instalado (ver SKILL.md, «Launch» paso 6).
import { chromium } from "playwright"
import { mkdirSync, writeFileSync } from "node:fs"
import { ENLACE, revisar } from "./saltos.mjs"

const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : def }
const flag = (n) => process.argv.includes(`--${n}`)
// Git Bash convierte "/blog" en "C:/Program Files/Git/blog": se deshace.
const ruta = (r) => r.replace(/^[A-Za-z]:\/Program Files\/Git/, "") || "/"
const salida = arg("salida")
const rutas = arg("rutas", "/").split(",").map(ruta)
const anchos = arg("anchos", "360,375,412,1440,1920").split(",").map(Number)
const B = arg("base", "http://localhost:3100")
const espera = Number(arg("espera", "1500"))
mkdirSync(salida, { recursive: true })

const slug = (r) => r.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "inicio"
const alto = (w) => (w < 768 ? (w >= 412 ? 915 : 812) : w >= 1920 ? 1080 : 900)

// Corre en la página: imágenes rotas, textos que se salen de su caja y lo que quedó oculto.
function medir() {
  const main = document.querySelector("main") ?? document.body
  const rotas = [...main.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map((i) => i.currentSrc || i.src)
  const corta = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (/hidden|clip|auto|scroll/.test(getComputedStyle(a).overflowX)) return a; return null }
  const seSale = [...main.querySelectorAll("h1,h2,h3,p,li,a,button")].filter((el) => {
    if (el.closest("[aria-hidden='true'],[hidden]")) return false
    const s = getComputedStyle(el)
    if (s.whiteSpace === "nowrap" || s.overflowX !== "visible") return false
    return el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && !corta(el)
  }).map((el) => `${el.tagName.toLowerCase()} «${el.textContent.trim().slice(0, 50)}» (${el.scrollWidth - el.clientWidth} px)`)
  const ocultos = [...main.querySelectorAll("h1,h2,h3,p,img,a")].filter((el) => {
    if (el.closest("[aria-hidden='true'],[hidden],[role=dialog],[inert]")) return false
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return false
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a)
      if (s.display === "none") return false
      if (s.visibility === "hidden" || Number(s.opacity) < 0.05) return true
    }
    return false
  }).map((el) => `${el.tagName.toLowerCase()} «${(el.textContent || el.getAttribute("alt") || el.getAttribute("src") || "").trim().slice(0, 50)}»`)
  return { rotas, seSale, ocultos }
}

async function bajarLeyendo(p, h) {
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += Math.round(h * 0.6)) {
    await p.evaluate((v) => window.scrollTo(0, v), y)
    await p.waitForTimeout(700)
  }
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await p.waitForTimeout(1500)
}

const b = await chromium.launch()
const informe = []
let fallas = 0
const anotar = (item, mal) => { informe.push(item); fallas += mal }

for (const r of rutas) {
  for (const w of anchos) {
    const h = alto(w)
    const cel = w < 768
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: cel, hasTouch: cel, deviceScaleFactor: cel ? 2 : 1 })
    const p = await ctx.newPage()
    const errores = []
    p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)))
    p.on("pageerror", (e) => errores.push(String(e).slice(0, 200)))
    const base = `${slug(r)}-${w}`

    await p.goto(`${B}${r}`, { waitUntil: "commit" })
    if (w === 375 || w === 1440) {
      // caret "initial": por defecto Playwright esconde el cursor con un style en cada campo, y si la
      // captura cae antes de que React hidrate, React avisa que los atributos no coinciden (2026-11-25).
      let t0 = 0
      for (const t of [400, 1200, 2800]) { await p.waitForTimeout(t - t0); t0 = t; await p.screenshot({ path: `${salida}/${base}-entrada-${t}.png`, caret: "initial" }) }
    }
    await p.waitForLoadState("networkidle").catch(() => {})
    await p.waitForTimeout(espera)
    await bajarLeyendo(p, h)
    const m = await p.evaluate(medir)
    // Los saltos se miden sin giros ni escalas de las animaciones: un bloque girado (las tarjetas
    // apiladas de la nota del blog) hace que cada palabra parezca otra línea (2026-11-26: 30 de 32
    // marcas eran eso). Se sacan un momento y se vuelven a poner.
    await p.addStyleTag({ content: "main *{transform:none!important;rotate:none!important;scale:none!important;translate:none!important}" }).then((t) => t.evaluate((n) => n.setAttribute("data-medir", ""))).catch(() => {})
    await p.waitForTimeout(150)
    const saltos = await p.evaluate(revisar, [ENLACE, "main"]).catch((e) => [`no se pudo medir: ${e.message}`])
    await p.evaluate(() => document.querySelector("style[data-medir]")?.remove()).catch(() => {})
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600)
    await p.screenshot({ path: `${salida}/${base}.png`, fullPage: true })

    const mal = saltos.length + (desborde > 0 ? 1 : 0) + errores.length + m.rotas.length + m.seSale.length + m.ocultos.length
    anotar({ ruta: r, ancho: w, saltos, desborde, errores, ...m, captura: `${base}.png` }, mal)
    console.log(`${mal ? "FALLA" : "ok   "} ${r} @${w}: saltos ${saltos.length} · desborde ${desborde} · consola ${errores.length} · imágenes rotas ${m.rotas.length} · se sale ${m.seSale.length} · ocultos ${m.ocultos.length}`)
    for (const s of saltos) console.log(`      salto: ${typeof s === "string" ? s : JSON.stringify(s).slice(0, 160)}`)
    for (const e of errores) console.log(`      consola: ${e}`)
    for (const x of m.rotas) console.log(`      imagen rota: ${x}`)
    for (const x of m.seSale) console.log(`      se sale de su caja: ${x}`)
    for (const x of m.ocultos) console.log(`      quedó oculto: ${x}`)
    await ctx.close()
  }

  // «Menos movimiento»: sin bajar, todo tiene que estar a la vista.
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
    const p = await ctx.newPage()
    await p.goto(`${B}${r}`, { waitUntil: "networkidle" }); await p.waitForTimeout(espera)
    const total = await p.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < total; y += 900) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(150) }
    const { ocultos } = await p.evaluate(medir)
    anotar({ ruta: r, menosMovimiento: true, ocultos }, ocultos.length)
    console.log(`${ocultos.length ? "FALLA" : "ok   "} ${r} con menos movimiento: ocultos ${ocultos.length}`)
    for (const x of ocultos) console.log(`      quedó oculto: ${x}`)
    await ctx.close()
  }

  // Links internos de la página.
  if (!flag("sin-links")) {
    const ctx = await b.newContext()
    const p = await ctx.newPage()
    await p.goto(`${B}${r}`, { waitUntil: "networkidle" })
    const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("main a[href^='/']")].map((a) => a.getAttribute("href").split("#")[0]).filter(Boolean))])
    const rotos = []
    for (const href of hrefs) {
      const res = await ctx.request.get(`${B}${href}`, { maxRedirects: 3 }).catch(() => null)
      if (!res || res.status() >= 400) rotos.push(`${href} → ${res ? res.status() : "sin respuesta"}`)
    }
    anotar({ ruta: r, links: hrefs.length, linksRotos: rotos }, rotos.length)
    console.log(`${rotos.length ? "FALLA" : "ok   "} ${r}: ${hrefs.length} links internos, rotos ${rotos.length}`)
    for (const x of rotos) console.log(`      link roto: ${x}`)
    await ctx.close()
  }
}

writeFileSync(`${salida}/informe.json`, JSON.stringify(informe, null, 1))
await b.close()
process.exit(fallas ? 1 : 0)
