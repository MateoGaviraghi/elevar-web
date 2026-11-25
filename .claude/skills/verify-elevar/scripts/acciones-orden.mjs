// Prueba la pantalla de la orden (/orden/<id>) y su comprobante en los cuatro estados: pagada, devuelta,
// fallida y pendiente. Ficha: features/orden.md. Cada paso escribe ok/FALLA y guarda capturas. Sale con 1 si algo falla.
//
//   node acciones-orden.mjs --salida <carpeta> --ordenes <carpeta>/ordenes.json [--base http://localhost:3100]
//
// Las órdenes las arma ordenes-prueba.mjs (y la devuelta, ordenes_prueba.py con MODO=devolver).
// Se corre parado en una carpeta que tenga playwright instalado (ver SKILL.md, «Launch» paso 6).
import { chromium } from "playwright"
import { readFileSync, writeFileSync, statSync } from "node:fs"
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const salida = arg("salida"), B = arg("base", "http://localhost:3100"), ids = JSON.parse(readFileSync(arg("ordenes"), "utf8"))
const res = []; let fallas = 0
const ok = (c, t, x = "") => { res.push({ ok: !!c, t, x }); if (!c) fallas++; console.log(`${c ? "ok   " : "FALLA"} ${t}${x ? ` (${x})` : ""}`) }
const b = await chromium.launch()
const texto = (p) => p.evaluate(() => document.querySelector("main").innerText.replace(/[\s\u00A0]+/g, " ")) // pegar() deja espacios duros y las etiquetas en mayúsculas vienen así en innerText
for (const [w, h, nombre] of [[1440, 900, "escritorio"], [375, 812, "celular"]]) {
  const cel = w < 768
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: cel, hasTouch: cel, deviceScaleFactor: cel ? 2 : 1, acceptDownloads: true })
  const p = await ctx.newPage(); const err = []
  p.on("console", (m) => m.type() === "error" && err.push(m.text().slice(0, 140))); p.on("pageerror", (e) => err.push(String(e).slice(0, 140)))
  console.log(`— ${nombre}`)
  const espera = { pagada: ["PAGADO", "Pago aprobado", "Tu comprobante"], devuelta: ["DEVUELTO", "Pago devuelto", "te devolvimos el pago", "La inscripción se anuló", "por Mercado Pago"], fallida: ["SIN COBRAR", "Pago no aprobado", "Pagar con Mercado Pago"], pendiente: ["PENDIENTE", "Pago pendiente"] }
  for (const [k, id] of Object.entries(ids)) {
    await p.goto(`${B}/orden/${id}`, { waitUntil: "networkidle" }); await p.waitForTimeout(4500)
    const t = (await texto(p)).toUpperCase()
    const faltan = espera[k].filter((s) => !t.includes(s.toUpperCase()))
    ok(faltan.length === 0, `orden ${k}: muestra su estado`, faltan.join(", "))
    if (k === "devuelta") ok(!t.includes("TU LUGAR ESTÁ RESERVADO") && !t.includes("AGENDÁ") && !t.includes("PAGO APROBADO"), "orden devuelta: no dice reservado, aprobado ni agenda")
    if (k === "pagada") ok(!t.includes("DEVUELTO"), "orden pagada: sin rastro de devolución")
    await p.screenshot({ path: `${salida}/orden-${k}-${nombre}.png`, fullPage: true, caret: "initial" })
  }
  // Devuelta: el paso «Tu comprobante» abre el comprobante, que dice DEVUELTO y descarga el PDF.
  await p.goto(`${B}/orden/${ids.devuelta}`, { waitUntil: "networkidle" }); await p.waitForTimeout(4500)
  await Promise.all([p.waitForURL(/\/comprobante$/), p.getByRole("link", { name: /Tu comprobante/ }).click()])
  await p.waitForTimeout(1500)
  const c = await texto(p)
  ok(/DEVUELTO/.test(c) && /Devolución/i.test(c) && /inscripción no está vigente/i.test(c), "comprobante devuelto: etiqueta, fecha de devolución y aviso al pie")
  ok(!/Te damos acceso en 24 horas/.test(c) && !/acredita tu inscripción/.test(c), "comprobante devuelto: sin pasos de acceso ni «acredita tu inscripción»")
  await p.screenshot({ path: `${salida}/comprobante-devuelta-${nombre}.png`, fullPage: true, caret: "initial" })
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 30000 }), p.getByRole("button", { name: /Descargar PDF/ }).click()])
  const f = `${salida}/comprobante-devuelta-${nombre}.pdf`; await dl.saveAs(f)
  ok(statSync(f).size > 5000, "el PDF del comprobante devuelto se descarga", `${statSync(f).size} bytes`)
  // Pagada: el comprobante sigue igual.
  await p.goto(`${B}/orden/${ids.pagada}/comprobante`, { waitUntil: "networkidle" }); await p.waitForTimeout(1500)
  const cp = await texto(p)
  ok(/PAGADO/.test(cp) && /acredita tu inscripción/.test(cp) && /Te damos acceso en 24 horas/.test(cp) && !/DEVUELTO/.test(cp), "comprobante pagado: igual que antes")
  ok(err.length === 0, "consola sin errores", err.join(" | "))
  await ctx.close()
}
{ // Menos movimiento: el sello de la devuelta se ve sin animar.
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await ctx.newPage()
  await p.goto(`${B}/orden/${ids.devuelta}`, { waitUntil: "networkidle" }); await p.waitForTimeout(800)
  const op = await p.evaluate(() => [...document.querySelectorAll(".im-sello")].map((e) => getComputedStyle(e).opacity).filter((o) => o !== "0").length)
  console.log("— menos movimiento"); ok(op > 0, "el sello «Devuelto» se ve sin animación")
  await ctx.close()
}
writeFileSync(`${salida}/acciones-orden.json`, JSON.stringify(res, null, 1)); await b.close()
console.log(fallas ? `\n${fallas} fallas` : "\ntodo ok"); process.exit(fallas ? 1 : 0)
