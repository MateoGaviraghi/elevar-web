// Prueba lo que hace la página de una nota del blog (/blog/<slug>, «Cartas»), además del recorrido
// de recorrer-sitio.mjs. Ficha: features/nota.md. Cada paso guarda una captura y escribe ok/FALLA.
// Sale con 1 si algo falla.
//
//   node acciones-nota.mjs --salida <carpeta> [--base http://localhost:3100]
//
// Se corre parado en una carpeta que tenga playwright instalado (ver SKILL.md, «Launch» paso 6).
import { chromium } from "playwright"
import { mkdirSync, writeFileSync } from "node:fs"

const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : def }
const salida = arg("salida")
const B = arg("base", "http://localhost:3100")
mkdirSync(salida, { recursive: true })

// Una con tres partes, una con siete y una sin subtítulos.
const TRES = "componentes-incertidumbre-microbiologia-iso-19036"
const SIETE = "informacion-documentada-que-mantener-y-conservar"
const NINGUNA = "priorizacion-de-tareas-en-el-laboratorio"

const resultado = []
let fallas = 0
const ok = (cond, texto, extra = "") => {
  resultado.push({ ok: !!cond, texto, extra })
  if (!cond) fallas++
  console.log(`${cond ? "ok   " : "FALLA"} ${texto}${extra ? ` (${extra})` : ""}`)
}
const bajar = async (p, px, paso = 160, pausa = 120) => { for (let y = 0; y < px; y += paso) { await p.mouse.wheel(0, paso); await p.waitForTimeout(pausa) } }

const b = await chromium.launch()

for (const [w, h, nombre] of [[1440, 900, "escritorio"], [375, 812, "celular"]]) {
  const cel = w < 768
  console.log(`— ${nombre} (${w}×${h})`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: cel, hasTouch: cel, deviceScaleFactor: cel ? 2 : 1 })
  const p = await ctx.newPage()
  const errores = []
  p.on("pageerror", (e) => errores.push(String(e).slice(0, 160)))
  p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 160)))

  // 1. Cabecera: título con punto naranja, isotipo armado, datos de la nota.
  await p.goto(`${B}/blog/${TRES}`, { waitUntil: "networkidle" })
  await p.waitForTimeout(2600)
  const cab = await p.evaluate(() => {
    const h1 = document.querySelector("h1"), caja = h1.parentElement.getBoundingClientRect()
    const r = document.createRange(); r.selectNodeContents(h1)
    const punto = [...h1.querySelectorAll("span")].find((e) => e.textContent === ".")
    const barras = [...document.querySelectorAll(".cb-barra")].map((e) => e.getBoundingClientRect().height)
    return {
      punto: !!punto && getComputedStyle(punto).color !== getComputedStyle(h1).color,
      sale: Math.round(Math.max(...[...r.getClientRects()].map((x) => x.right)) - caja.right),
      barras: barras.length === 3 && barras.every((x) => x > 20),
      datos: [...document.querySelectorAll("section[data-tone=dark] ul li")].map((l) => l.textContent.trim()).join(" · "),
    }
  })
  ok(cab.punto, "el título termina en el punto naranja")
  ok(cab.sale <= 0, "el título entra en su columna", `${cab.sale} px`)
  ok(cab.barras, "el isotipo de la cabecera está armado")
  ok(/\d{4}/.test(cab.datos) && /minutos de lectura/.test(cab.datos) && /3 partes/.test(cab.datos), "la cabecera muestra fecha, lectura y partes", cab.datos)
  await p.screenshot({ path: `${salida}/nota-${nombre}-1-cabecera.png` })

  // 2. «En esta cápsula»: tres tarjetitas; la tercera lleva a su tarjeta.
  const mini = await p.$$("li.in-carta button")
  ok(mini.length === 3, "«En esta cápsula» muestra las tres partes", String(mini.length))
  await p.evaluate(() => document.querySelector(".in-rot").scrollIntoView({ block: "center" }))
  await p.waitForTimeout(1800)
  await p.screenshot({ path: `${salida}/nota-${nombre}-2-partes.png` })
  await mini[2].click()
  await p.waitForTimeout(2400)
  const tope3 = await p.evaluate(() => Math.round(document.getElementById("carta-3").getBoundingClientRect().top))
  ok(tope3 >= 40 && tope3 <= 140, "tocar la parte 3 lleva a su tarjeta", `${tope3} px desde arriba`)

  // 3. Llegada y apilado: volver arriba y bajar con la rueda hasta la tarjeta 2.
  await p.evaluate(() => window.scrollTo(0, document.querySelector(".ca-mazo").getBoundingClientRect().top + scrollY - window.innerHeight))
  await p.waitForTimeout(800)
  const entrando = await p.evaluate(() => getComputedStyle(document.querySelector("#carta-1 .ca-entra")).transform)
  ok(entrando !== "none" && entrando !== "matrix(1, 0, 0, 1, 0, 0)", "la tarjeta llega girada", entrando.slice(0, 32))
  const anchos = []
  const alto2 = await p.evaluate(() => document.getElementById("carta-2").getBoundingClientRect().top + scrollY - window.innerHeight * 0.4)
  let y = await p.evaluate(() => scrollY)
  while (y < alto2) { await p.mouse.wheel(0, 160); y += 160; await p.waitForTimeout(140); anchos.push(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) }
  await p.waitForTimeout(1200)
  const ap = await p.evaluate(() => {
    const c1 = document.querySelector("#carta-1 .ca-cuerpo"), c2 = document.getElementById("carta-2")
    const r2 = c2.getBoundingClientRect()
    const x = r2.left + r2.width / 2, yy = Math.max(r2.top + 30, 90)
    const arriba = document.elementFromPoint(x, Math.min(yy, innerHeight - 10))?.closest(".ca-carta")?.id
    return { t1: getComputedStyle(c1).transform, arriba, pin: !!document.querySelector(".pin-spacer #carta-1") }
  })
  ok(ap.pin, "la tarjeta 1 queda fija cuando se leyó")
  ok(ap.t1 !== "none" && ap.t1 !== "matrix(1, 0, 0, 1, 0, 0)", "la de abajo se achica y gira", ap.t1.slice(0, 32))
  ok(ap.arriba === "carta-2", "la tarjeta que llega queda por encima de la fijada", String(ap.arriba))
  ok(Math.max(...anchos) <= 0, "la llegada girada no ensancha la página", `${Math.max(...anchos)} px de más`)
  await p.screenshot({ path: `${salida}/nota-${nombre}-3-apilado.png` })

  // 4. «Sigue» de la tarjeta 1 lleva a la 2; sin regla de lectura.
  await p.evaluate(() => document.getElementById("carta-1").scrollIntoView())
  await p.waitForTimeout(600)
  await p.evaluate(() => document.querySelector("#carta-1 .ca-pie button").click())
  await p.waitForTimeout(2400)
  const tope2 = await p.evaluate(() => Math.round(document.getElementById("carta-2").getBoundingClientRect().top))
  ok(tope2 >= 40 && tope2 <= 140, "«Sigue» lleva a la próxima parte", `${tope2} px`)
  ok(!(await p.$(".ca-avance")), "no hay regla de lectura abajo")

  // 5. Final: anterior y siguiente, y «Ver todas las cápsulas».
  await p.evaluate(() => document.querySelector(".vc-tarjeta").scrollIntoView({ block: "center" }))
  await p.waitForTimeout(1600)
  const fin = await p.evaluate(() => ({
    tarjetas: [...document.querySelectorAll(".vc-tarjeta")].map((a) => [a.textContent.match(/Cápsula anterior|Cápsula siguiente|Otra cápsula/)?.[0], a.getAttribute("href")]),
    todas: !!document.querySelector('a[href="/blog"]'),
    volver: [...document.querySelectorAll("a")].some((a) => a.textContent.trim() === "Volver al blog"),
  }))
  ok(fin.tarjetas.length === 2 && fin.tarjetas.every(([r, h]) => r && h?.startsWith("/blog/")), "al final, anterior y siguiente", fin.tarjetas.map((t) => t[0]).join(" + "))
  ok(fin.todas && !fin.volver, "«Ver todas las cápsulas» y sin «Volver al blog»")
  await p.screenshot({ path: `${salida}/nota-${nombre}-4-final.png` })

  ok(errores.length === 0, "consola sin errores", errores.slice(0, 2).join(" | "))
  await ctx.close()
}

// Siete partes y ninguna parte.
{
  const p = await b.newPage({ viewport: { width: 1366, height: 650 } })
  await p.goto(`${B}/blog/${SIETE}`, { waitUntil: "networkidle" })
  ok((await p.$$(".ca-carta")).length === 7 && (await p.$$("li.in-carta")).length === 7, "la nota de siete partes tiene siete tarjetas")
  await bajar(p, 6000, 200, 80)
  await p.waitForTimeout(1200)
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "siete partes, sin scroll horizontal")
  await p.goto(`${B}/blog/${NINGUNA}`, { waitUntil: "networkidle" })
  ok((await p.$$(".ca-carta")).length === 0 && !(await p.$(".in-rot")), "una nota sin subtítulos no lleva tarjetas ni «En esta cápsula»")
  await p.close()
}

// Menos movimiento.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  const p = await ctx.newPage()
  await p.goto(`${B}/blog/${TRES}`, { waitUntil: "networkidle" })
  await p.waitForTimeout(500)
  const ocultos = await p.evaluate(() => [...document.querySelectorAll("article h1, article h2, article h3, article p, article li, article img")].filter((e) => { const cs = getComputedStyle(e); return cs.visibility === "hidden" || +cs.opacity < 0.99 }).length)
  ok(ocultos === 0, "con menos movimiento todo se ve al cargar", `${ocultos} ocultos`)
  await p.screenshot({ path: `${salida}/nota-menos-movimiento.png`, fullPage: true })
  await ctx.close()
}

await b.close()
writeFileSync(`${salida}/acciones-nota.json`, JSON.stringify(resultado, null, 1))
console.log(`\n${resultado.length - fallas} ok, ${fallas} fallas`)
process.exit(fallas ? 1 : 0)
