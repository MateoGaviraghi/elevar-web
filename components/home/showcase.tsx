import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { VideoSlot } from "@/components/media/video-slot";

const STATS = [
  { value: "+20", label: "años de trayectoria" },
  { value: "LATAM", label: "alcance regional" },
  { value: "ISO/IEC", label: "17025" },
];

/** Banda de presentación con espacio para video (mockup) — refuerza lo visual del home. */
export function ShowcaseSection() {
  return (
    <section className="bg-ink-900 py-20 text-neutral-0 md:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal as="div" variant="left">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                ELEVAR en acción
              </span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-[2.5rem]">
              Calidad que se ve en cada resultado
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-300">
              Más de 20 años acompañando a laboratorios de toda América Latina en su
              camino hacia la acreditación ISO/IEC 17025.
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-neutral-0/10 pt-8">
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

          <Reveal as="div" variant="right">
            <VideoSlot
              poster="/assets/mockup/m7.jpg"
              label="Presentación · próximamente"
              aspect="4/3"
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
