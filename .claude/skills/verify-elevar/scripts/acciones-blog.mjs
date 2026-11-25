// Prueba lo que hace la lista del blog (/blog), además del recorrido de recorrer-sitio.mjs.
// Ficha: features/blog.md. Cada paso guarda una captura y escribe ok/FALLA. Sale con 1 si algo falla.
//
//   node acciones-blog.mjs --salida <carpeta> [--base http://localhost:3100]
//
// Se corre parado en una carpeta que tenga playwright instalado (ver SKILL.md, «Launch» paso 6).
import { chromium } from "playwright"
import { mkdirSync, writeFileSync } from "node:fs"

const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : def }
const salida = arg("salida")
const B = arg("base", "http://localhost:3100")
mkdirSync(salida, { recursive: true })

const resultado = []
let fallas = 0
const ok = (cond, texto, extra = "") => {
  resultado.push({ ok: !!cond, texto, extra })
  if (!cond) fallas++
  console.log(`${cond ? "ok   " : "FALLA"} ${texto}${extra ? ` (${extra})` : ""}`)
}
// "inset(18% 26% 18% 26%)" → [18, 26, 18, 26]; "none" → [0,0,0,0]
const inset = (s) => (s && s.startsWith("inset") ? s.match(/-?[\d.]+/g).slice(0, 4).map(Number) : [0, 0, 0, 0])

const b = await chromium.launch()

for (const [w, h, nombre] of [[1440, 900, "escritorio"], [375, 812, "celular"]]) {
  const cel = w < 768
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: cel, hasTouch: cel, deviceScaleFactor: cel ? 2 : 1 })
  const p = await ctx.newPage()
  const errores = []
  p.on("pageerror", (e) => errores.push(String(e).slice(0, 160)))
  p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 160)))
  console.log(`— ${nombre} (${w}×${h})`)

  // 1. Encabezado: la cantidad cuenta desde 0 hasta la cantidad de cápsulas.
  await p.goto(`${B}/blog`, { waitUntil: "commit" })
  await p.waitForSelector("[data-contador]")
  await p.waitForTimeout(450)
  const temprano = Number(await p.textContent("[data-contador]"))
  await p.waitForTimeout(2600)
  const final = Number(await p.textContent("[data-contador]"))
  const notas = await p.evaluate(() => document.querySelectorAll(".re-item").length + 1)
  ok(temprano < final, "la cantidad cuenta al cargar", `${temprano} → ${final}`)
  ok(final === notas, "la cantidad es la de cápsulas publicadas", `${final} y ${notas} en la página`)
  const h1 = await p.evaluate(() => { const e = document.querySelector("h1"); return { label: e.getAttribute("aria-label"), sale: e.scrollWidth - e.clientWidth } })
  ok(h1.label === "Cápsulas informativas", "el título tiene su nombre para lectores de pantalla", h1.label)
  ok(h1.sale <= 1, "la palabra gigante entra en su columna", `${h1.sale} px de más`)
  await p.screenshot({ path: `${salida}/blog-${nombre}-1-encabezado.png` })

  // 2. La destacada: arranca como ventana chica y termina abierta, con su recuadro a la vista.
  await p.waitForLoadState("networkidle").catch(() => {})
  const top = await p.evaluate(() => document.querySelector(".ds-ventana").closest("section").getBoundingClientRect().top + scrollY - 64)
  await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(1400)
  const ini = await p.evaluate(() => ({ clip: getComputedStyle(document.querySelector(".ds-ventana")).clipPath, caja: Number(getComputedStyle(document.querySelector(".ds-caja")).opacity) }))
  await p.screenshot({ path: `${salida}/blog-${nombre}-2-ventana-cerrada.png` })
  const recorrido = Math.round(h * (cel ? 0.7 : 1.1))
  for (let i = 1; i <= 6; i++) { await p.evaluate((y) => window.scrollTo(0, y), top + Math.round((recorrido * i) / 6)); await p.waitForTimeout(500) }
  await p.waitForTimeout(1600)
  const fin = await p.evaluate(() => ({ clip: getComputedStyle(document.querySelector(".ds-ventana")).clipPath, caja: Number(getComputedStyle(document.querySelector(".ds-caja")).opacity) }))
  await p.screenshot({ path: `${salida}/blog-${nombre}-3-ventana-abierta.png` })
  const a = inset(ini.clip), z = inset(fin.clip)
  ok(Math.max(...a) >= 8, "la foto arranca como ventana chica", ini.clip)
  ok(Math.max(...z) <= 1, "al bajar, la ventana se abre al ancho completo", fin.clip)
  ok(ini.caja < 0.2 && fin.caja > 0.95, "el recuadro del título aparece al abrirse", `${ini.caja} → ${fin.caja}`)

  // 3. Todas las cápsulas: grilla → lista → grilla, y cada una abre su nota.
  await p.evaluate(() => document.getElementById("capsulas").scrollIntoView()); await p.waitForTimeout(2200)
  const enGrilla = await p.locator(".re-item").count()
  ok(enGrilla === notas - 1, "la grilla muestra todas menos la destacada", `${enGrilla}`)
  const imgs = await p.evaluate(() => [...document.querySelectorAll("#capsulas img")].filter((i) => i.complete && i.naturalWidth > 0).length)
  ok(imgs === enGrilla, "cada tarjeta tiene su foto cargada", `${imgs} de ${enGrilla}`)
  await p.getByRole("tab", { name: /Lista/ }).click()
  await p.waitForTimeout(350)
  await p.screenshot({ path: `${salida}/blog-${nombre}-4-cambio-a-lista.png` })
  await p.waitForTimeout(1500)
  const filas = await p.locator("li.re-fila").count()
  const sel = await p.getByRole("tab", { name: /Lista/ }).getAttribute("aria-selected")
  ok(filas === enGrilla && sel === "true", "Lista muestra una fila por cápsula y queda marcada", `${filas} filas`)
  await p.screenshot({ path: `${salida}/blog-${nombre}-5-lista.png` })
  await p.getByRole("tab", { name: /Grilla/ }).click(); await p.waitForTimeout(1600)
  ok((await p.locator("li.re-fila").count()) === 0 && (await p.locator(".re-item").count()) === enGrilla, "Grilla vuelve a las tarjetas")
  const hrefs = await p.evaluate(() => [...document.querySelectorAll("#capsulas a.re-item, .ds-ventana")].map((e) => (e.closest("a") ?? e).getAttribute("href")))
  const malos = []
  for (const href of new Set(hrefs)) { const r = await ctx.request.get(`${B}${href}`); if (r.status() !== 200 || !/^\/blog\/[a-z0-9-]+$/.test(href)) malos.push(`${href} → ${r.status()}`) }
  ok(malos.length === 0, "cada tarjeta y la destacada abren su nota", malos.join(", "))
  await Promise.all([p.waitForURL(/\/blog\/[a-z0-9-]+$/), p.locator("#capsulas a.re-item").first().click()])
  ok(/\/blog\/[a-z0-9-]+$/.test(p.url()), "un click en la primera tarjeta lleva a la nota", p.url().replace(B, ""))

  // 4. Cierre: la comunidad.
  await p.goto(`${B}/blog`, { waitUntil: "networkidle" })
  // Se llega al cierre bajando, como una persona: su título entra con el scroll.
  await p.evaluate(() => [...document.querySelectorAll("main section")].pop()?.scrollIntoView({ block: "center" })); await p.waitForTimeout(2400)
  const cierre = await p.evaluate(() => [...document.querySelectorAll("main section")].pop()?.innerText ?? "")
  ok(/COMUNIDAD\s+ELEVAR/i.test(cierre) && /Sumarme a la comunidad/.test(cierre), "el cierre naranja invita a la comunidad")
  await p.screenshot({ path: `${salida}/blog-${nombre}-6-cierre.png` })

  ok(errores.length === 0, "consola sin errores", errores.join(" | "))
  await ctx.close()
}

// 5. Menos movimiento: la foto entera desde el principio, sin ventana, y la cantidad final.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  const p = await ctx.newPage()
  await p.goto(`${B}/blog`, { waitUntil: "networkidle" }); await p.waitForTimeout(800)
  const n = await p.textContent("[data-contador]")
  const top = await p.evaluate(() => document.querySelector(".ds-ventana").closest("section").getBoundingClientRect().top + scrollY - 64)
  await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(600)
  const clip = await p.evaluate(() => getComputedStyle(document.querySelector(".ds-ventana")).clipPath)
  const caja = await p.evaluate(() => Number(getComputedStyle(document.querySelector(".ds-caja")).opacity))
  console.log("— menos movimiento")
  ok(Number(n) > 0, "la cantidad se ve sin contar", n)
  ok(Math.max(...inset(clip)) <= 1 && caja > 0.95, "la foto y su recuadro se ven enteros, sin abrirse", `${clip} · ${caja}`)
  await p.screenshot({ path: `${salida}/blog-menos-movimiento.png` })
  await ctx.close()
}

writeFileSync(`${salida}/acciones-blog.json`, JSON.stringify(resultado, null, 1))
await b.close()
console.log(fallas ? `\n${fallas} fallas` : "\ntodo ok")
process.exit(fallas ? 1 : 0)
