"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cartCount, openCartDrawer } from "@/lib/cart";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export function CartIcon() {
  const [count, setCount] = useState(0);
  const badge = useRef<HTMLSpanElement>(null);
  const bag = useRef<SVGSVGElement>(null);
  // -1 = todavía no leímos el carrito guardado.
  const prev = useRef(-1);

  useEffect(() => {
    setCount(cartCount());

    const refresh = () => setCount(cartCount());

    window.addEventListener("elevar-cart-changed", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("elevar-cart-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // El número salta cuando suben las inscripciones.
  useEffect(() => {
    // El valor guardado al cargar la página no cuenta como "subió".
    if (prev.current < 0) {
      if (count === cartCount()) prev.current = count;
      return;
    }
    const grew = count > prev.current;
    prev.current = count;
    if (!grew || prefersReducedMotion()) return;
    // Llega el curso volando (components/cart/fly-to-cart.ts): la bolsa se hunde
    // y rebota, y el número salta con un rebote elástico (0,8 s, como la referencia).
    if (badge.current) {
      gsap.fromTo(badge.current, { scale: 0.2 }, { scale: 1, duration: 0.8, ease: "elastic.out(1.3, 0.9)" });
    }
    if (bag.current) {
      gsap.fromTo(bag.current, { y: 3, scale: 0.88 }, { y: 0, scale: 1, duration: 0.8, ease: "elastic.out(1.2, 0.6)" });
    }
  }, [count]);

  return (
    <Link
      href="/carrito"
      onClick={(e) => {
        e.preventDefault();
        openCartDrawer();
      }}
      aria-label={`Carrito${count > 0 ? ` — ${count} item${count !== 1 ? "s" : ""}` : ""}`}
      aria-haspopup="dialog"
      data-cart-target
      className="relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-ink-800 hover:text-brand-500 transition-colors"
    >
      <svg
        ref={bag}
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span
          ref={badge}
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-500 text-neutral-0 text-[10px] font-semibold leading-none"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
