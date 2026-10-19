// Catálogo ESTÁTICO (mockup): los 78 cursos reales publicados en elevar.com.ar,
// relevados el 2026-10-19 (lib/data/cursos-elevar.json). Reemplaza a los 20 cursos
// de muestra. Cuando exista el admin con backend, estos datos son su carga inicial.
// Los bloques iguales por modalidad (incluye, certificado, pagos…) viven en
// lib/formacion-templates.ts.
import type { Category, Course, CourseSession, Modality } from "@/types";
import data from "@/lib/data/cursos-elevar.json";

export const CATEGORIES: Category[] = [
  { id: 8, name: "Laboratorio de Microbiología", slug: "microbiologia" },
  { id: 9, name: "Calidad y Metrología", slug: "calidad-metrologia" },
  { id: 10, name: "Laboratorio de Fisicoquímica", slug: "fisicoquimica" },
];

interface RawCourse {
  id: number;
  modality: string;
  category: string | null;
  code: string;
  codeSuffix: string | null;
  title: string;
  objetivos: string;
  temario: string[];
  disertante: string[];
  duracion: string | null;
  fecha: string | null;
  hora: string | null;
  ars: number | null;
  usd: number | null;
  gratuito: boolean;
}

/** Día del relevamiento: las fechas sin año se ubican respecto de este día. */
const SURVEY = new Date("2026-10-19T00:00:00-03:00");

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6,
  agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function categoryFor(raw: RawCourse): Category {
  const byName = CATEGORIES.find((c) => c.name.toLowerCase() === raw.category?.toLowerCase());
  if (byName) return byName;
  // En vivo y webinars no tienen categoría en el sitio actual: se deduce del título.
  const t = raw.title.toLowerCase();
  if (/microbiol/.test(t)) return CATEGORIES[0];
  if (/químic|quimic|fisicoqu|cromatogr|espectro/.test(t)) return CATEGORIES[2];
  return CATEGORIES[1];
}

/** "26 de Noviembre" + "13:00 a 17:00" + año → inicio y fin (hora de Argentina). */
function sessionDates(fecha: string, hora: string | null, year: number) {
  const m = fecha.toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóú]+)/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2]];
  if (month == null) return null;
  const [from, to] = (hora ?? "10:00 a 12:00").split(/\s+a\s+/);
  const iso = (hm: string) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hm.trim().padStart(5, "0")}:00-03:00`;
  return { starts: iso(from), ends: iso(to ?? from), month, day };
}

/** Próxima vez que cae ese día y mes desde el relevamiento. */
function nextYear(month: number, day: number): number {
  const y = SURVEY.getFullYear();
  return new Date(y, month, day) >= new Date(y, SURVEY.getMonth(), SURVEY.getDate()) ? y : y + 1;
}

const raws = (data as { courses: RawCourse[] }).courses;

// Los webinars no publican el año. Se numeran en orden (W58 → W74): el más nuevo
// cae en su próxima fecha y cada anterior en el último año que no lo pase.
const webinarYear = new Map<number, number>();
{
  const ws = raws
    .filter((r) => r.modality === "WEBINAR" && r.fecha)
    .sort((a, b) => Number(b.code.replace(/\D/g, "")) - Number(a.code.replace(/\D/g, "")));
  let limit: Date | null = null;
  for (const w of ws) {
    const d = sessionDates(w.fecha!, w.hora, 2000);
    if (!d) continue;
    let year: number = limit ? limit.getFullYear() : nextYear(d.month, d.day);
    if (limit && new Date(year, d.month, d.day) > limit) year -= 1;
    webinarYear.set(w.id, year);
    limit = new Date(year, d.month, d.day);
  }
}

function sessionsFor(raw: RawCourse): CourseSession[] {
  if (!raw.fecha) return [];
  const probe = sessionDates(raw.fecha, raw.hora, 2000);
  if (!probe) return [];
  const suffixYear = raw.codeSuffix?.match(/\/(\d{2})$/)?.[1];
  const year = suffixYear
    ? 2000 + Number(suffixYear)
    : webinarYear.get(raw.id) ?? nextYear(probe.month, probe.day);
  const d = sessionDates(raw.fecha, raw.hora, year)!;
  return [
    {
      id: raw.id * 10,
      starts_at: d.starts,
      ends_at: d.ends,
      timezone: "America/Argentina/Buenos_Aires",
      capacity: null,
      seats_available: null,
      status: new Date(d.starts) < SURVEY ? "FINISHED" : "SCHEDULED",
    },
  ];
}

function toCourse(raw: RawCourse): Course {
  const modality = raw.modality as Modality;
  // "CA55 - Autoclaves…" → "Autoclaves…"
  const title = raw.title.replace(new RegExp(`^${raw.code}\\s*-\\s*`), "").trim();
  const [name = "", ...role] = raw.disertante;
  const hours = raw.duracion ? parseInt(raw.duracion, 10) : NaN;
  return {
    id: raw.id,
    code: raw.code,
    title,
    slug: `${slugify(title)}-${raw.code.toLowerCase()}`,
    summary: raw.objetivos,
    description: raw.objetivos,
    category: categoryFor(raw),
    modality,
    price: raw.gratuito || raw.ars == null ? "0.00" : raw.ars.toFixed(2),
    currency: "ARS",
    cover_image: null,
    level: "",
    duration_hours: Number.isNaN(hours) ? null : hours,
    instructor_names: name,
    badge: null,
    is_featured: false,
    sessions: sessionsFor(raw),
    objectives: raw.objetivos,
    syllabus: raw.temario,
    instructor: name ? { name, role: role.join(" · ") } : null,
    price_usd: raw.usd == null ? null : raw.usd.toFixed(2),
    pdf_url: null,
    code_suffix: raw.codeSuffix,
  };
}

const ALL = raws.map(toCourse);

// Destacados: los 4 asincrónicos más nuevos del sitio actual (primeros de su lista)
// y los 2 cursos en vivo y 2 webinars con la fecha más próxima.
const soonest = (m: Modality, n: number) =>
  ALL.filter((c) => c.modality === m && c.sessions[0]?.status === "SCHEDULED")
    .sort((a, b) => a.sessions[0].starts_at.localeCompare(b.sessions[0].starts_at))
    .slice(0, n)
    .map((c) => c.id);
const FEATURED = new Set([
  ...ALL.filter((c) => c.modality === "ASYNC").slice(0, 4).map((c) => c.id),
  ...soonest("LIVE", 2),
  ...soonest("WEBINAR", 2),
]);

export const COURSES: Course[] = ALL.map((c) => ({ ...c, is_featured: FEATURED.has(c.id) }));
