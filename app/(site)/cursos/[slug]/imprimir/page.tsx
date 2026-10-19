import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LOGO_GRAY } from "@/components/brand/logo-geometry";
import { PrintButton } from "@/components/curso/ficha-parts";
import { MODALITY_TEMPLATES } from "@/lib/formacion-templates";
import { CONTACT } from "@/lib/contact";
import { formatARS } from "@/lib/formatters";
import { ApiError, getCourse } from "@/lib/api";
import type { Course } from "@/types";

// "Descargar información en PDF" (Mateo, 2026-10-19: los PDF van sí o sí). La ficha
// completa en una hoja para imprimir o guardar como PDF. Cuando el admin permita
// subir un PDF propio (`pdf_url`), el botón de la ficha lleva a ese archivo.

const MODALITY_LABEL: Record<Course["modality"], string> = {
  ASYNC: "Curso asincrónico",
  LIVE: "Curso online en vivo",
  WEBINAR: "Webinar gratuito",
  WORKSHOP: "Taller",
};

// Al imprimir solo queda la hoja: el header, el pie y los botones flotantes del sitio no salen.
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  body * { visibility: hidden !important; }
  #ficha-pdf, #ficha-pdf * { visibility: visible !important; }
  #ficha-pdf { position: absolute; inset: 0 auto auto 0; width: 100%; box-shadow: none !important; border: 0 !important; padding: 0 !important; }
}`;

async function fetchCourse(slug: string): Promise<Course | null> {
  try {
    return await getCourse(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await fetchCourse(params.slug);
  return { title: course ? `${course.code} · ${course.title} — PDF` : "Curso no encontrado — Elevar", robots: { index: false } };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="mb-2 border-b border-neutral-200 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">{title}</h2>
      <div className="text-[13px] leading-relaxed text-ink-800">{children}</div>
    </section>
  );
}

export default async function PrintCoursePage({ params }: { params: { slug: string } }) {
  const course = await fetchCourse(params.slug);
  if (!course) notFound();
  const tpl = MODALITY_TEMPLATES[course.modality];
  const free = parseFloat(course.price) === 0;
  const s = course.sessions[0];
  const tz = { timeZone: "America/Argentina/Buenos_Aires" } as const;
  const when = s
    ? `${new Date(s.starts_at).toLocaleDateString("es-AR", { ...tz, day: "numeric", month: "long", year: "numeric" })}, ${new Date(s.starts_at).toLocaleTimeString("es-AR", { ...tz, hour: "2-digit", minute: "2-digit", hour12: false })} a ${new Date(s.ends_at).toLocaleTimeString("es-AR", { ...tz, hour: "2-digit", minute: "2-digit", hour12: false })} h (GMT-3)`
    : null;

  const facts: [string, string][] = [
    ["Código", course.code_suffix ? `${course.code} · ${course.code_suffix}` : course.code],
    ["Modalidad", MODALITY_LABEL[course.modality]],
  ];
  if (when) facts.push(["Fecha y hora", when]);
  if (course.duration_hours) facts.push(["Duración certificada", `${course.duration_hours} ${course.duration_hours === 1 ? "hora" : "horas"}`]);
  if (course.instructor) facts.push(["Disertante", course.instructor.name]);
  facts.push(["Costo", free ? "Gratuito" : `Argentina: ${formatARS(course.price)}${course.price_usd ? ` · Otros países: USD ${parseFloat(course.price_usd)}` : ""}`]);

  return (
    <div className="bg-neutral-50 py-10 print:bg-transparent print:py-0">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-neutral-500">Vista para imprimir o guardar como PDF.</p>
        <PrintButton />
      </div>

      <article id="ficha-pdf" className="mx-auto max-w-[820px] border border-neutral-200 bg-neutral-0 px-10 py-12 shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b-2 border-ink-900 pb-5">
          <Logo wordColor={LOGO_GRAY} className="h-8 w-auto" />
          <div className="text-right text-[11px] leading-relaxed text-neutral-500">
            <p>{CONTACT.email}</p>
            <p>{CONTACT.phoneDisplay}</p>
            <p>elevar.com.ar</p>
          </div>
        </header>

        <p className="mt-7 font-mono text-xs font-semibold text-brand-600">{course.code}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink-900">{course.title}</h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3">
          {facts.map(([k, v]) => (
            <div key={k} className="border-t border-neutral-200 pt-2">
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{k}</dt>
              <dd className="text-[13px] font-medium text-ink-900">{v}</dd>
            </div>
          ))}
        </dl>

        {course.objectives && (
          <Block title="Objetivos">
            {course.objectives.split("\n").length > 1 ? (
              <ul className="list-disc space-y-1 pl-5">
                {course.objectives.split("\n").map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            ) : (
              <p>{course.objectives}</p>
            )}
          </Block>
        )}
        {course.syllabus?.length ? (
          <Block title="Temario">
            <ol className="list-decimal space-y-1 pl-5">
              {course.syllabus.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </Block>
        ) : null}
        {tpl.includes.length > 0 && (
          <Block title="¿Qué incluye el curso?">
            <ul className="list-disc space-y-1 pl-5">
              {tpl.includes.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Block>
        )}
        {tpl.howItWorks.length > 0 && (
          <Block title="Modalidad de la cursada">
            <div className="space-y-2">
              {tpl.howItWorks.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </Block>
        )}
        {tpl.certificate && (
          <Block title="Certificado">
            <p>{tpl.certificate.intro}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {tpl.certificate.tiers.map((t) => (
                <li key={t.name}>
                  <strong>{t.name}:</strong> {t.rule}.
                </li>
              ))}
            </ul>
          </Block>
        )}
        {course.instructor && (
          <Block title="Disertante">
            <p className="font-semibold text-ink-900">{course.instructor.name}</p>
            {course.instructor.role && <p>{course.instructor.role}</p>}
          </Block>
        )}
        {tpl.payment.length > 0 && (
          <Block title="Formas de pago">
            <div className="grid grid-cols-2 gap-6">
              {tpl.payment.map((g) => (
                <div key={g.region}>
                  <p className="font-semibold text-ink-900">{g.region}</p>
                  <p>{g.methods.join(" · ")}</p>
                </div>
              ))}
            </div>
          </Block>
        )}
        {tpl.promos.length > 0 && (
          <Block title="Promociones y descuentos">
            <ul className="list-disc space-y-1 pl-5">
              {tpl.promos.map((p) => (
                <li key={p.title}>
                  <strong>{p.title}:</strong> {p.detail}
                </li>
              ))}
            </ul>
          </Block>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-[11px] text-neutral-500">
          Inscripción en elevar.com.ar · {CONTACT.email} · WhatsApp {CONTACT.phoneDisplay}
        </footer>
      </article>
    </div>
  );
}
