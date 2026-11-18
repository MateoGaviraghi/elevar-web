import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { HojasApiladas } from "@/components/media/hojas-apiladas";
import { pegarTodo, pegar } from "@/lib/texto";

const STATS = pegarTodo([
  { value: "+20", label: "años de trayectoria" },
  { value: "LATAM", label: "alcance regional" },
  { value: "ISO/IEC", label: "17025" },
]);

/** Banda de presentación: cifras a la izquierda y, a la derecha, las hojas que recibe el alumno (KAN-39). */
export function ShowcaseSection() {
  return (
    // overflow-x-clip: lo que entra desde los costados (Reveal, +24 px) y,
    // antes de revelarse, ensanchaba la página en el celular (scroll de costado).
    <section className="overflow-x-clip bg-ink-900 py-14 text-neutral-0 sm:py-20 md:py-28">
      <Container>
        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal as="div" variant="left">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                ELEVAR en acción
              </span>
            </div>
            <h2 className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-[2.5rem]">
              Calidad que se ve en cada resultado
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-300">
              {pegar("Más de 20 años acompañando a laboratorios de toda América Latina en su camino hacia la acreditación ISO/IEC 17025.")}
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-neutral-0/10 pt-6 sm:mt-10 sm:gap-6 sm:pt-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-2xl font-semibold text-neutral-0 md:text-3xl">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-neutral-400">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div>
            <HojasApiladas />
          </div>
        </div>
      </Container>
    </section>
  );
}
