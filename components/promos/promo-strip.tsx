"use client";

/* Franja de promoción del inicio.
 * Rediseño pedido por Mateo el 2026-10-23 ("franja inicio"): referencia Spotify · Premium
 * ("el 4 me gusta, combinalo con algo o usá directo eso"), con el "−10 %" gigante que rueda
 * de /promociones como imagen; plan respondido con "1 naranja 2 GO-AHEAD".
 * Banda naranja: "10 % menos para tu" + la palabra que cambia (equipo → laboratorio → área
 * de calidad → grupo de analistas): sale hacia arriba en 0,6 s, la nueva sube en 0,9 s, una
 * cada 3,2 s; se frena fuera de pantalla, con el mouse encima y con movimiento reducido.
 * El número rueda de 00 al valor al entrar en pantalla. Si no hay promoción por grupo
 * vigente, la franja no ocupa espacio (igual que antes).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Promo } from "@/types";
import { getPromos } from "@/lib/api";
import { PROMOS_SEED } from "@/lib/promos";
import { onCollectionChange } from "@/lib/local-db";
import { CONTACT } from "@/lib/contact";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { BTN, useMotion } from "@/components/curso/ficha-parts";
import { NumeroRodante } from "@/components/promos/numero-rodante";

const WORDS = ["equipo", "laboratorio", "área de calidad", "grupo de analistas"];
const EVERY = 3200;

const groupPromoOf = (promos: Promo[]) =>
  promos.find((p) => p.trigger === "AUTO" && p.kind === "PERCENT" && p.minQuantity != null && p.minAmount == null) ?? null;

function useGroupPromo(): Promo | null {
  const [promos, setPromos] = useState<Promo[]>(() => PROMOS_SEED.filter((p) => p.active && p.featured));
  useEffect(() => {
    let alive = true;
    const load = () =>
      getPromos({ featured: true })
        .then((p) => alive && setPromos(p))
        .catch(() => alive && setPromos([]));
    load();
    const off = onCollectionChange((name) => name === "promos" && load());
    return () => {
      alive = false;
      off();
    };
  }, []);
  return groupPromoOf(promos);
}

/** La palabra que cambia: sale hacia arriba (0,6 s) y la siguiente sube de su máscara (0,9 s). */
function RotatingWord({ running }: { running: boolean }) {
  const [idx, setIdx] = useState(0);
  const word = useRef<HTMLSpanElement>(null);
  const changed = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      const el = word.current;
      if (!el) return;
      gsap.to(el, {
        yPercent: -110,
        duration: 0.6,
        ease: "power3.in",
        overwrite: true,
        onComplete: () => {
          changed.current = true;
          setIdx((i) => (i + 1) % WORDS.length);
        },
      });
    }, EVERY);
    return () => window.clearTimeout(t);
  }, [running, idx]);

  useEffect(() => {
    if (!changed.current || !word.current) return;
    gsap.fromTo(word.current, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", overwrite: true });
  }, [idx]);

  return (
    <span className="-mt-[0.08em] block overflow-hidden pb-[0.2em] pt-[0.06em]">
      <span className="ps-line block">
        <span ref={word} className="block text-ink-900">
          {WORDS[idx]}
        </span>
      </span>
    </span>
  );
}

export function PromoStrip() {
  const group = useGroupPromo();
  const root = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.intersectionRatio >= 0.35) setSeen(true);
      },
      { threshold: [0, 0.35] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [group]);

  // Entrada: el título sube de su máscara y lo demás lo sigue (start "top 70%").
  const motion = useMotion<HTMLDivElement>((r) => {
    const st = { trigger: r, start: "top 70%", once: true };
    gsap.from(r.querySelectorAll(".ps-line"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: st });
    gsap.from(r.querySelectorAll(".ps-in"), { y: 20, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.3, scrollTrigger: st });
  });

  if (!group) return null;
  const pct = String(group.value);
  const shown = seen || reduced ? pct : "0".repeat(pct.length);

  return (
    <section
      ref={root}
      data-tone="dark"
      className="bg-brand-500 py-16 text-neutral-0 md:py-24"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <Container>
        <div ref={motion} className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          {/* El número: arriba en el celular, a la derecha en escritorio. */}
          <p
            aria-label={`${pct} % de descuento`}
            className="ps-in font-display text-[clamp(5rem,13vw,12rem)] font-semibold leading-[0.85] tracking-[-0.03em] text-ink-900 lg:order-2"
          >
            −<NumeroRodante text={shown} /> %
          </p>
          <div className="min-w-0 lg:order-1">
            <h2 className="font-display text-[clamp(2.25rem,4.6vw,4.5rem)] font-semibold leading-[1] tracking-[-0.02em]">
              <span className="block overflow-hidden pt-[0.06em]">
                <span className="ps-line block sm:whitespace-nowrap">{pct} % menos para tu</span>
              </span>
              <RotatingWord running={inView && !hover && !reduced} />
            </h2>
            <p className="ps-in mt-6 max-w-xl text-lg leading-relaxed text-neutral-0/90">
              Inscribí a {group.minQuantity} o más personas en el mismo curso. Se aplica sola en el carrito.
            </p>
            <div className="ps-in mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/promociones" className={BTN.onBrand}>
                Calcular mi descuento
              </Link>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={BTN.ghostDark}>
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
