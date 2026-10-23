import Link from "next/link";
import type { Course } from "@/types";
import { getCourses } from "@/lib/api";
import { MODALITIES } from "@/lib/formacion-modalities";
import { formatARS } from "@/lib/formatters";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { ModalityPanels, type PanelItem } from "@/components/home/modality-panels";

/* "Cinco formas de capacitarte" (inicio). Rediseño de Mateo, 2026-10-23 ("banda inicio",
 * referencia CodeFronts · Color Block, "tu elección" + "GO-AHEAD"): reemplaza la grilla
 * de 5 tarjetas iguales por paneles de color, una modalidad abierta a la vez. Textos de
 * lib/formacion-modalities.ts (los mismos de Formación) y cursos reales. */

const TZ = "America/Argentina/Buenos_Aires";
const dated = (c: Course) => c.modality === "LIVE" || c.modality === "WEBINAR";
const startsAt = (c: Course) => (c.sessions[0] ? new Date(c.sessions[0].starts_at).getTime() : 0);
const upcoming = (c: Course) => !!c.sessions[0] && c.sessions[0].status !== "FINISHED";

/** Tres cursos: los próximos por fecha en las modalidades con fecha; si no, los primeros. */
function picksOf(list: Course[]): Course[] {
  if (list.some(dated)) return list.filter(upcoming).sort((a, b) => startsAt(a) - startsAt(b)).slice(0, 3);
  return list.slice(0, 3);
}

function metaOf(c: Course): string {
  if (dated(c) && c.sessions[0]) {
    const d = new Date(c.sessions[0].starts_at);
    const day = d.toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric" });
    const month = d.toLocaleDateString("es-AR", { timeZone: TZ, month: "short" }).replace(".", "").toUpperCase();
    return `${day} ${month}`;
  }
  return parseFloat(c.price) === 0 ? "Gratis" : formatARS(c.price);
}

const EMPTY_NOTE: Record<string, string> = {
  WORKSHOP: "Talleres a medida para tu equipo, en tu laboratorio o por videollamada.",
  EBOOK: "Estamos preparando los primeros e-books.",
};

export async function ModalitiesSection() {
  const data = await getCourses().catch(() => null);
  const courses = data?.results ?? [];
  const items: PanelItem[] = MODALITIES.map((m) => {
    const list = courses.filter((c) => c.modality === m.modality);
    return {
      slug: m.slug,
      modality: m.modality,
      title: m.title,
      short: m.short,
      desc: m.desc,
      img: m.img,
      count: list.length,
      picks: picksOf(list).map((c) => ({ code: c.code, title: c.title, slug: c.slug, meta: metaOf(c) })),
      note: EMPTY_NOTE[m.modality] ?? null,
    };
  });

  return (
    <section className="bg-neutral-50 py-10 sm:py-16 [@media(min-width:1024px)_and_(max-height:800px)]:py-10">
      <Container>
        <Reveal>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-8">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-[2.5rem]">
                Cinco formas de capacitarte
              </h2>
              <p className="mt-2 hidden text-base text-ink-700 sm:block md:text-lg">
                Elegí la modalidad que mejor se adapta a tu equipo y tus tiempos.
              </p>
            </div>
            <Link
              href="/formacion"
              className="group inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-ink-900 transition-colors hover:text-brand-600"
            >
              Ver todos los cursos
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </Reveal>
        <ModalityPanels items={items} />
      </Container>
    </section>
  );
}
