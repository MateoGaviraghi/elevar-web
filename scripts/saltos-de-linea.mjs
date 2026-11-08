// Control de saltos de línea (regla de Mateo, 2026-10-26). Recorre las páginas del sitio en
// 6 anchos y marca:
//   1. un texto que entraría en su columna pero lo corta su propio max-width;
//   2. una sola palabra en la última línea (textos de 3 palabras o más; los truncados con
//      line-clamp no cuentan);
//   3. una línea (no la última) que termina en una palabra de enlace sin puntuación detrás.
// Tiene que dar 0 antes de pasar un link o una captura. No detecta la regla "una oración por
// línea" de los textos grandes de varias oraciones: eso se mira en la captura del celular.
//
// Uso: node scripts/saltos-de-linea.mjs [base] — base por defecto http://localhost:3000.
// Necesita Playwright y Chrome. Si el proyecto no lo tiene instalado, se toma de
// PLAYWRIGHT_PATH (por defecto el de Sanalys: C:/Dev/clientes/sanalys/sanalys-web/node_modules/playwright).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    return require(process.env.PLAYWRIGHT_PATH ?? "C:/Dev/clientes/sanalys/sanalys-web/node_modules/playwright");
  }
}
const { chromium } = loadPlaywright();

const base = process.argv[2] ?? "http://localhost:3000";
const PAGES = [
  "/",
  "/formacion",
  "/formacion/cursos-asincronicos",
  "/cursos/metrologia-legal-e-iso-iec-17025-conceptos-esenciales-para-laboratorios-de-ensayo-cv52",
  "/servicios",
  "/servicios/auditorias-internas",
  "/nosotros",
  "/contacto",
  "/promociones",
  "/carrito",
  "/blog",
];
const WIDTHS = [360, 375, 390, 768, 1440, 1920];

/** Corre en la página: devuelve las marcas encontradas. */
function revisar() {
  const LINK = new Set("lo la el los las de del y o con para más a en al por que se un una su sus tu sin e ni u".split(" "));
  const out = [];
  const els = [...document.querySelectorAll("p, h1, h2, h3, h4, li, a, button, dd, dt, blockquote, figcaption, label")].filter(
    (el) => el.offsetParent && ![...el.children].some((c) => /block|flex|grid/.test(getComputedStyle(c).display))
  );
  for (const el of els) {
    const text = el.innerText.trim();
    if (!text || text.split(/\s+/).length < 2) continue;
    if (getComputedStyle(el).webkitLineClamp !== "none") continue;
    // Palabras con su posición, agrupadas en líneas por su altura.
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const words = [];
    while (tw.nextNode()) {
      const n = tw.currentNode;
      const re = /\S+/g;
      let m;
      while ((m = re.exec(n.data))) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        const rc = r.getClientRects()[0];
        if (rc && rc.width) words.push({ w: m[0], top: Math.round(rc.top) });
      }
    }
    if (words.length < 2) continue;
    const lines = [];
    for (const x of words) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - x.top) < 4) last.ws.push(x.w);
      else lines.push({ top: x.top, ws: [x.w] });
    }
    if (lines.length < 2) continue;
    const id = `${el.tagName} "${text.replace(/\s+/g, " ").slice(0, 50)}"`;
    const lastLine = lines[lines.length - 1].ws;
    if (words.length > 2 && lastLine.length === 1 && lastLine[0].replace(/[^\p{L}\p{N}]/gu, "").length > 1) out.push(`2 palabra sola: ${id}`);
    for (const L of lines.slice(0, -1)) {
      const raw = L.ws[L.ws.length - 1];
      if (/[,.;:!?)»]$/.test(raw)) continue;
      const end = raw.toLowerCase().replace(/[^\p{L}]/gu, "");
      if (LINK.has(end)) {
        out.push(`3 termina en «${end}»: ${id}`);
        break;
      }
    }
    const cs = getComputedStyle(el);
    if (cs.maxWidth !== "none") {
      const prevMax = el.style.maxWidth;
      const prevWs = el.style.whiteSpace;
      el.style.whiteSpace = "nowrap";
      const natural = el.scrollWidth;
      el.style.whiteSpace = prevWs;
      el.style.maxWidth = "none";
      const free = el.getBoundingClientRect().width;
      el.style.maxWidth = prevMax;
      if (natural <= free + 0.5) out.push(`1 lo corta su max-width (${cs.maxWidth}): ${id}`);
    }
  }
  return [...new Set(out)];
}

const browser = await chromium.launch({ channel: "chrome" });
const found = {};
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 }, reducedMotion: "reduce" });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(700);
    for (const f of await page.evaluate(revisar)) (found[f] ??= []).push(`${w} ${path}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();

const keys = Object.keys(found).sort();
for (const k of keys) console.log(`${k}\n    en ${found[k].join(", ")}`);
console.log(`\n${keys.length} marcas en ${PAGES.length} páginas × ${WIDTHS.length} anchos (${base}).`);
process.exit(keys.length ? 1 : 0);
