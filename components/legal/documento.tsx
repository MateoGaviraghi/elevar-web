/* Página de un texto legal (KAN-41): privacidad y términos. Encabezado oscuro como Contacto y,
 * debajo, el índice (fijo al costado en escritorio) y las secciones en una columna de lectura.
 * Sin animaciones: el texto está entero al cargar. Las marcas de los textos (`[texto](href)` y
 * `{{CONFIRMAR: …}}`) se explican en `lib/legal.ts`. */

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Container } from "@/components/ui/container";
import type { Bloque, Seccion } from "@/lib/legal";
import { pegar, sinViuda } from "@/lib/texto";

const MARCA = /\[([^\]]+)\]\(([^)]+)\)|\{\{CONFIRMAR(?::\s*([^}]*))?\}\}/g;

/** Convierte las marcas de un texto en links y en avisos de dato pendiente. */
export function Rico({ texto }: { texto: string }) {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(MARCA)) {
    const i = m.index ?? 0;
    if (i > ultimo) partes.push(pegar(texto.slice(ultimo, i)));
    if (m[1] !== undefined) {
      const href = m[2];
      const clase = "font-semibold text-ink-900 underline decoration-brand-500 underline-offset-4 transition-colors hover:text-brand-600";
      partes.push(
        href.startsWith("/") ? (
          <Link key={i} href={href} className={clase}>{pegar(m[1])}</Link>
        ) : (
          <a key={i} href={href} className={clase}>{pegar(m[1])}</a>
        )
      );
    } else {
      partes.push(
        <mark
          key={i}
          className={`${(m[3] ?? "").length > 28 ? "[box-decoration-break:clone]" : "whitespace-nowrap"} bg-brand-50 px-1 py-0.5 text-[0.92em] font-semibold text-brand-700`}
        >
          {pegar(m[3] ? `a confirmar: ${m[3]}` : "a confirmar")}
        </mark>
      );
    }
    ultimo = i + m[0].length;
  }
  if (ultimo < texto.length) partes.push(pegar(texto.slice(ultimo)));
  return <>{partes.map((p, k) => <Fragment key={k}>{p}</Fragment>)}</>;
}

function BloqueTexto({ bloque }: { bloque: Bloque }) {
  if (typeof bloque === "string") {
    return <p><Rico texto={bloque} /></p>;
  }
  if ("lista" in bloque) {
    return (
      <ul className="space-y-3">
        {bloque.lista.map((item) => (
          <li key={item} className="relative pl-6">
            <span className="absolute left-0 top-[0.7em] h-px w-3 bg-brand-500" aria-hidden />
            <Rico texto={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <blockquote className="border-l-2 border-brand-500 bg-neutral-100 px-5 py-4 text-[15px] text-neutral-700">
      {pegar(bloque.cita)}
    </blockquote>
  );
}

export function DocumentoLegal({
  etiqueta,
  titulo,
  bajada,
  vigencia,
  secciones,
}: {
  etiqueta: string;
  titulo: string;
  bajada: string;
  vigencia: string;
  secciones: Seccion[];
}) {
  return (
    <>
      <section className="bg-ink-900 text-neutral-0">
        <Container className="py-16 md:py-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-brand-500" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{etiqueta}</span>
          </div>
          <div className="max-w-3xl">
          <h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            {sinViuda(titulo)}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-300">{pegar(bajada)}</p>
          </div>
          <p className="mt-8 text-sm text-neutral-400">Vigente desde el {vigencia}</p>
        </Container>
      </section>

      <Container className="py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="En esta página" className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-600">En esta página</p>
            <ol className="space-y-2.5 border-l border-neutral-200">
              {secciones.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l border-transparent py-0.5 pl-4 text-sm text-neutral-700 transition-colors hover:border-brand-500 hover:text-ink-900"
                  >
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-[760px] space-y-12 text-base leading-relaxed text-neutral-700 md:text-[17px]">
            {secciones.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="mb-4 flex items-baseline gap-3 font-display text-2xl font-semibold tracking-tight text-ink-900">
                  <span className="text-sm font-semibold tabular-nums text-brand-600">{String(i + 1).padStart(2, "0")}</span>
                  {s.titulo}
                </h2>
                <div className="space-y-4">
                  {s.bloques.map((b, k) => (
                    <BloqueTexto key={k} bloque={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
