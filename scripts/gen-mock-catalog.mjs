import { writeFileSync } from "node:fs";

const base = "http://localhost:8000/api/v1";

async function getJSON(path) {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

const cats = await getJSON("/categories/");
const mods = ["ASYNC", "LIVE", "WEBINAR", "WORKSHOP"];
let courses = [];
for (const m of mods) {
  const r = await getJSON(`/courses/?modality=${m}`);
  courses = courses.concat(r.results);
}

const ts = `// Catálogo ESTÁTICO (mockup) capturado de la API. El front no requiere backend.
// Generado por scripts/gen-mock-catalog.mjs. Para regenerar: levantar el backend y correr el script.
import type { Category, Course } from "@/types";

export const CATEGORIES: Category[] = ${JSON.stringify(cats, null, 2)};

export const COURSES: Course[] = ${JSON.stringify(courses, null, 2)};
`;

writeFileSync(new URL("../lib/mock-catalog.ts", import.meta.url), ts, "utf8");
console.log(`OK: ${cats.length} categorías, ${courses.length} cursos`);
console.log("modalidades:", [...new Set(courses.map((c) => c.modality))].join(", "));
