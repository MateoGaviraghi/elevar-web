"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";

const LOGOS = Array.from({ length: 20 }, (_, i) => `/assets/clientes/${i + 1}.png`);

export function ClientsSection() {
  return (
    <section className="bg-neutral-0 py-16">
      <Container>
        <Reveal>
          <p className="text-center text-xs uppercase tracking-widest text-neutral-700 mb-8">
            Confían en nosotros
          </p>
        </Reveal>
      </Container>

      {/* hairline top + bottom */}
      <div className="border-y border-neutral-200 py-8 overflow-hidden">
        <style>{`
          @keyframes elevar-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .elevar-marquee-track {
            animation: elevar-marquee 32s linear infinite;
          }
          /* En mobile se ven pocos logos a la vez: a 32s se sentía lentísimo. */
          @media (max-width: 640px) {
            .elevar-marquee-track {
              animation-duration: 8s;
            }
          }
          .elevar-marquee-wrapper:hover .elevar-marquee-track {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            .elevar-marquee-track {
              animation: none;
            }
            .elevar-marquee-scroll {
              overflow-x: auto;
            }
          }
        `}</style>

        {/* Con «menos movimiento» la fila se desplaza a mano: tabIndex para hacerlo con el teclado. */}
        <div
          role="region"
          aria-label="Logos de clientes"
          tabIndex={0}
          className="elevar-marquee-wrapper elevar-marquee-scroll overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        >
          <div className="elevar-marquee-track flex">
            {LOGOS.map((src, i) => (
              <img
                key={`a-${i}`}
                src={src}
                alt=""
                className="h-12 w-auto object-contain opacity-95 transition hover:opacity-100 mx-8 shrink-0"
              />
            ))}
            {LOGOS.map((src, i) => (
              <img
                key={`b-${i}`}
                src={src}
                alt=""
                className="h-12 w-auto object-contain opacity-95 transition hover:opacity-100 mx-8 shrink-0"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
