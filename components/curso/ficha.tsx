"use client";

// Ficha del curso. Elegida por Mateo el 2026-10-19 ("C", versión Mixta de una ronda de
// 3 prototipos sobre Harvard + Coursera + Joy of React + Platzi). Tercera vuelta con sus
// correcciones y las reglas del sitio:
// - Fondos que alternan tinta / blanco: encabezado tinta → Objetivos blanco → Temario
//   tinta → Qué incluye blanco → Cursada tinta → Disertante blanco → Certificado tinta
//   → Costo y pago blanco → cierre naranja. Las pestañas toman ese color.
// - Sin tarjetas ni íconos en cuadrados: filas finas con línea (patrón del sitio).
// - Cada sección entra con su propio movimiento (GSAP).
// - Tarjeta de compra fija y compacta: siempre se ve entera, con el PDF.
import { AddToCartPanel } from "@/components/catalog/add-to-cart-panel";
import { ModalityChip } from "@/components/ui/modality-chip";
import { Container } from "@/components/ui/container";
import { SplitLines } from "@/components/anim/split-lines";
import { gsap } from "@/lib/gsap";
import {
  Breadcrumb,
  BuyBar,
  BuyCard,
  Certificate3D,
  Ctas,
  CursadaPath,
  HeroMeta,
  IncludesList,
  InstructorFeature,
  ObjectivesRows,
  PaymentRows,
  SectionTabs,
  SectionTitle,
  SyllabusRows,
  isFree,
  leadOf,
  priceARS,
  priceUSD,
  sectionsOf,
  syllabusOf,
  useMotion,
  type FichaData,
} from "./ficha-parts";

/** Ancho que deja libre la tarjeta de compra fija (escritorio). */
const COL = "lg:pr-[392px]";
const PAD = "py-16 md:py-20";

export function CourseFicha({ data }: { data: FichaData }) {
  const { course, tpl } = data;
  const sections = sectionsOf(data);
  const items = syllabusOf(course);
  const unit = items.some((i) => i.isModule) ? "módulos" : "temas";
  const tier = tpl.certificate ? tpl.certificate.tiers[tpl.certificate.tiers.length - 1].name : "De aprobación";

  // Encabezado: el título entra por líneas (SplitLines); resumen, datos y botones lo siguen.
  const hero = useMotion<HTMLDivElement>((root) => {
    gsap.from(root.querySelectorAll(".hero-in"), { y: 22, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, delay: 0.35 });
    gsap.from(root.querySelectorAll(".hero-meta"), { y: 12, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.6 });
  });
  // La tarjeta de compra sube desde abajo al cargar.
  const card = useMotion<HTMLDivElement>((root) => {
    gsap.from(root, { y: 40, opacity: 0, duration: 1.2, ease: "expo.out", delay: 0.5 });
  });
  // Cierre naranja: el texto sube y los botones lo siguen.
  const closing = useMotion<HTMLDivElement>((root) => {
    gsap.from(root.querySelectorAll(".cl-in"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: root, start: "top 80%", once: true } });
  });

  return (
    <article className="bg-neutral-0 pb-20 lg:pb-0">
      <div className="relative">
        {/* Tarjeta de compra fija (escritorio): nace sobre el encabezado y acompaña hasta el pago. */}
        <div className="pointer-events-none absolute inset-0 z-[35] hidden lg:block">
          <div className="mx-auto h-full max-w-screen-xl px-8">
            <div className="ml-auto h-full w-[360px] pt-12">
              <div ref={card} className="pointer-events-auto sticky top-[132px] shadow-[0_8px_8px_-6px_rgba(11,30,51,0.18)]">
                <BuyCard data={data} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Encabezado (tinta) ── */}
        <header data-tone="dark" className="relative overflow-hidden bg-ink-900 pb-14 pt-10 text-neutral-0 md:pb-20 md:pt-14 lg:min-h-[520px]">
          <span aria-hidden className="pointer-events-none absolute -left-40 bottom-[-220px] h-[520px] w-[520px] rounded-full bg-brand-500/15 blur-3xl" />
          <Container>
            <div ref={hero} className={`relative ${COL}`}>
              <div className="hero-in">
                <Breadcrumb data={data} />
              </div>
              <div className="hero-in mt-8 flex flex-wrap items-center gap-3">
                <ModalityChip modality={course.modality} />
                <span className="font-mono text-xs font-semibold tracking-wider text-brand-400">
                  {course.code}
                  {course.code_suffix ? ` · ${course.code_suffix}` : ""}
                </span>
                <span className="text-xs text-neutral-300">{course.category?.name}</span>
              </div>
              <SplitLines as="h1" immediate delay={0.15} className="mt-5 max-w-3xl text-balance font-display text-3xl font-semibold leading-[1.1] tracking-tight md:text-[2.75rem]">
                {course.title}
              </SplitLines>
              <p className="hero-in mt-6 max-w-2xl text-base leading-relaxed text-neutral-200 md:text-lg">{leadOf(data)}</p>
              <div className="mt-7">
                <HeroMeta data={data} />
              </div>
              <div className="hero-in mt-9">
                <Ctas course={course} />
              </div>
            </div>
          </Container>
        </header>

        <SectionTabs sections={sections} />

        {/* ── Objetivos (blanco) ── */}
        {course.objectives && (
          <section id="objetivos" data-tone="light" className={PAD}>
            <Container>
              <div className={COL}>
                <SectionTitle title="Objetivos" meta="Lo que vas a poder hacer" />
                <ObjectivesRows course={course} />
              </div>
            </Container>
          </section>
        )}

        {/* ── Temario (tinta) + llamado ── */}
        {items.length > 0 && (
          <section id="temario" data-tone="dark" className={`bg-ink-900 ${PAD}`}>
            <Container>
              <div className={COL}>
                <SectionTitle title="Temario" meta={`${items.length} ${unit}`} tone="dark" />
                <SyllabusRows course={course} />
                <div className="mt-10 flex flex-col gap-5 border-t border-neutral-0/15 pt-8 md:flex-row md:items-center md:justify-between">
                  <p className="font-display text-xl font-semibold text-neutral-0">
                    {isFree(course) ? "La inscripción es gratuita." : `¿Te sirve este temario? Inscribite por ${priceARS(course)}.`}
                  </p>
                  <Ctas course={course} className="shrink-0" />
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* ── Qué incluye (blanco) ── */}
        {tpl.includes.length > 0 && (
          <section id="incluye" data-tone="light" className={PAD}>
            <Container>
              <div className={COL}>
                <SectionTitle title="Qué incluye" meta="Con tu inscripción" />
                <IncludesList tpl={tpl} />
              </div>
            </Container>
          </section>
        )}

        {/* ── Cursada (tinta) ── */}
        {tpl.howItWorks.length > 0 && (
          <section id="cursada" data-tone="dark" className={`bg-ink-900 ${PAD}`}>
            <Container>
              <div className={COL}>
                <SectionTitle title="Cómo es la cursada" meta="Del pago al certificado" tone="dark" />
                <CursadaPath tpl={tpl} />
              </div>
            </Container>
          </section>
        )}

        {/* ── Disertante (blanco) ── */}
        {course.instructor && (
          <section id="disertante" data-tone="light" className={PAD}>
            <Container>
              <div className={COL}>
                <SectionTitle title="Quién enseña" />
                <InstructorFeature course={course} />
              </div>
            </Container>
          </section>
        )}

        {/* ── Certificado (tinta, 3D) ── */}
        {tpl.certificate && (
          <section id="certificado" data-tone="dark" className={`overflow-hidden bg-ink-900 ${PAD}`}>
            <Container>
              <div className={COL}>
                <SectionTitle title="Certificado ELEVAR" meta="Movelo con el mouse" tone="dark" />
                <div className="grid items-center gap-10 md:grid-cols-[1fr_1.3fr]">
                  <ul className="border-t border-neutral-0/15">
                    {tpl.certificate.tiers.map((t) => (
                      <li key={t.name} className="border-b border-neutral-0/15 py-5">
                        <p className="font-display text-xl font-semibold text-neutral-0">{t.name}</p>
                        <p className="mt-1 text-[15px] text-neutral-300">{t.rule.charAt(0).toUpperCase() + t.rule.slice(1)}.</p>
                      </li>
                    ))}
                    {course.duration_hours ? (
                      <li className="py-5 text-[15px] text-neutral-300">
                        Duración certificada: <span className="font-semibold text-neutral-0">{course.duration_hours} horas</span>
                      </li>
                    ) : null}
                  </ul>
                  <Certificate3D course={course} tier={tier} />
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* ── Costo y pago (blanco) ── */}
        <section id="inscripcion" data-tone="light" className={PAD}>
          <Container>
            <div className={COL}>
              <SectionTitle
                title={isFree(course) ? "Inscripción" : "Costo y pago"}
                meta={isFree(course) ? "Gratuita" : `${priceARS(course)}${priceUSD(course) ? ` · ${priceUSD(course)}` : ""}`}
              />
              <div className="grid gap-10 xl:grid-cols-[minmax(0,360px)_1fr]">
                <AddToCartPanel course={course} />
                <PaymentRows tpl={tpl} />
              </div>
            </div>
          </Container>
        </section>
      </div>

      {/* ── Cierre (naranja) ── */}
      <section data-tone="dark" className="bg-brand-500 py-14 text-neutral-0 md:py-16">
        <Container>
          <div ref={closing} className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="cl-in font-mono text-xs font-semibold tracking-wider text-neutral-0/85">{course.code}</p>
              <p className="cl-in mt-2 text-balance font-display text-2xl font-semibold leading-tight tracking-tight md:text-4xl">
                {isFree(course) ? "Reservá tu lugar en " : "Inscribite a "}
                {course.title}
              </p>
              <p className="cl-in mt-3 text-sm text-neutral-0/90">
                {priceARS(course)}
                {priceUSD(course) ? ` · ${priceUSD(course)} desde otros países` : ""}
              </p>
            </div>
            <div className="cl-in">
              <Ctas course={course} tone="brand" />
            </div>
          </div>
        </Container>
      </section>

      <BuyBar course={course} />
    </article>
  );
}
