"use client";

const LOGOS = Array.from({ length: 20 }, (_, i) => `/assets/clientes/${i + 1}.png`);

export function ClientsMarquee() {
  return (
    <section className="py-12 bg-neutral-50 overflow-hidden">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
        }
        .marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
          .marquee-overflow {
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="marquee-wrapper marquee-overflow overflow-hidden">
        <div className="marquee-track flex">
          {/* Track 1 */}
          {LOGOS.map((src, i) => (
            <img
              key={`a-${i}`}
              src={src}
              alt=""
              className="h-10 w-auto object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition mx-6 shrink-0"
            />
          ))}
          {/* Track 2 (identical — creates seamless loop) */}
          {LOGOS.map((src, i) => (
            <img
              key={`b-${i}`}
              src={src}
              alt=""
              className="h-10 w-auto object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition mx-6 shrink-0"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
