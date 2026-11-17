// Exporta el catálogo tal como lo arma el sitio (lib/mock-catalog.ts) para cargarlo en la
// base del backend con `python manage.py importar_cursos` (tanda 2, 2026-11-17).
// Sale del mismo código que usa el sitio para que ids, slugs y fechas queden idénticos:
// las URLs de los cursos y los carritos guardados en los navegadores no cambian.
//
// Uso (desde frontend/):
//   npx tsx scripts/exportar-catalogo.ts ../backend/catalog/data/cursos.json
import { writeFileSync } from "node:fs";
import { CATEGORIES, COURSES } from "../lib/mock-catalog";

const out = process.argv[2];
if (!out) {
  console.error("Falta el archivo de salida: npx tsx scripts/exportar-catalogo.ts <ruta.json>");
  process.exit(1);
}

const data = {
  source: "elevar-web/lib/mock-catalog.ts (lib/data/cursos-elevar.json, relevado el 2026-10-19)",
  categories: CATEGORIES.map((c, i) => ({ ...c, order: i + 1 })),
  courses: COURSES.map((c, i) => ({
    id: c.id,
    code: c.code,
    code_suffix: c.code_suffix ?? "",
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    description: c.description ?? "",
    category_slug: c.category.slug,
    modality: c.modality,
    price: c.price,
    price_usd: c.price_usd ?? null,
    currency: c.currency,
    duration_hours: c.duration_hours,
    instructor_names: c.instructor?.name ?? c.instructor_names,
    instructor_role: c.instructor?.role ?? "",
    objectives: c.objectives ?? "",
    syllabus: c.syllabus ?? [],
    is_featured: c.is_featured,
    position: i + 1,
    sessions: c.sessions.map((s) => ({
      id: s.id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      status: s.status,
    })),
  })),
};

writeFileSync(out, JSON.stringify(data, null, 2) + "\n", "utf-8");
console.log(`${data.courses.length} cursos y ${data.categories.length} categorías → ${out}`);
