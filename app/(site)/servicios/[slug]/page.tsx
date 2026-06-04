import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { MediaHero } from "@/components/media/media-hero";
import { buttonClasses } from "@/components/ui/button";
import { SERVICIOS_DATA, getServicioById } from "@/lib/servicios";

// Foto de hero por servicio (mockup lab/ciencia).
const HERO_IMG: Record<string, string> = {
  "formacion-profesional": "/assets/mockup/m2.jpg",
  "acreditacion-iso-17025": "/assets/mockup/m6.jpg",
  "auditorias-internas": "/assets/mockup/m8.jpg",
  "asistencia-tecnica": "/assets/mockup/m1.jpg",
  "implementacion-normativa": "/assets/mockup/m4.jpg",
  gestion: "/assets/mockup/m5.jpg",
};

// Segunda foto (cuerpo), distinta del hero.
const BODY_IMG: Record<string, string> = {
  "formacion-profesional": "/assets/mockup/m1.jpg",
  "acreditacion-iso-17025": "/assets/mockup/m4.jpg",
  "auditorias-internas": "/assets/mockup/m6.jpg",
  "asistencia-tecnica": "/assets/mockup/m5.jpg",
  "implementacion-normativa": "/assets/mockup/m8.jpg",
  gestion: "/assets/mockup/m3.jpg",
};

const STEPS = [
  { t: "Diagnóstico", d: "Entendemos el punto de partida de tu laboratorio y dónde están las brechas." },
  { t: "Plan a medida", d: "Definimos alcance, tiempos y entregables junto a tu equipo." },
  { t: "Acompañamiento", d: "Trabajamos codo a codo hasta llegar al resultado y sostenerlo." },
];

export function generateStaticParams() {
  return SERVICIOS_DATA.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const s = getServicioById(params.slug);
  if (!s) return { title: "Servicio no encontrado — Elevar" };
  return { title: `${s.title} — Servicios Elevar`, description: s.desc };
}

export default function ServicioDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const servicio = getServicioById(params.slug);
  if (!servicio) notFound();

  const others = SERVICIOS_DATA.filter((s) => s.id !== servicio.id);

  return (
    <>
      {/* Hero con foto + parallax */}
      <MediaHero
        image={HERO_IMG[servicio.id] ?? "/assets/mockup/m4.jpg"}
        eyebrow="Servicio"
        size="md"
        title={servicio.title}
      >
        <nav
          aria-label="Migas de pan"
          className="mb-8 flex items-center gap-2 text-xs text-neutral-300"
        >
          <Link href="/servicios" className="transition-colors hover:text-neutral-0">
            Servicios
          </Link>
          <span aria-hidden>/</span>
          <span className="text-neutral-200">{servicio.title}</span>
        </nav>
      </MediaHero>

      {/* Cuerpo */}
      <section className="bg-neutral-0 py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
            {/* Desarrollo */}
            <Reveal as="div" className="min-w-0">
              <p className="text-balance font-display text-xl font-medium leading-snug tracking-tight text-ink-900 md:text-2xl">
                {servicio.desc}
              </p>
              <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-ink-700">
                {servicio.long.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <figure className="mt-10 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BODY_IMG[servicio.id] ?? "/assets/mockup/m1.jpg"}
                  alt=""
                  aria-hidden
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </figure>
            </Reveal>

            {/* Qué incluye */}
            <Reveal as="div">
              <div className="border border-neutral-200 bg-neutral-50 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Qué incluye
                </h2>
                <ul className="mt-5 space-y-3">
                  {servicio.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-800">
                      <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                        className="mt-0.5 shrink-0 text-brand-500" aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contacto"
                  className={buttonClasses({ variant: "primary", size: "md", className: "mt-6 w-full" })}
                >
                  Solicitar este servicio
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Cómo trabajamos (proceso) */}
      <section className="border-t border-neutral-200 bg-neutral-0 py-16 md:py-24">
        <Container>
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 md:text-3xl">
              Cómo trabajamos
            </h2>
          </Reveal>
          <Reveal as="div" className="mt-12 grid gap-10 md:grid-cols-3" stagger={0.1}>
            {STEPS.map((s, i) => (
              <div key={s.t}>
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg font-bold text-brand-500">0{i + 1}</span>
                  <span className="h-px flex-1 bg-neutral-200" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink-900">
                  {s.t}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{s.d}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Otros servicios */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-16 md:py-20">
        <Container>
          <h2 className="mb-8 font-display text-xl font-semibold tracking-tight text-ink-900">
            Otros servicios
          </h2>
          <div className="grid grid-cols-1 border-l border-t border-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <Link
                key={s.id}
                href={`/servicios/${s.id}`}
                className="group flex items-center gap-4 border-b border-r border-neutral-200 p-5 transition-colors hover:bg-neutral-0"
              >
                <img src={s.pictogram} alt="" aria-hidden className="h-10 w-10 shrink-0 object-contain" />
                <span className="text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-600">
                  {s.title}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
