"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount } from "@/lib/cart";

export function CartIcon() {
  const [count, setCount] = useState(0);

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

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito${count > 0 ? ` — ${count} item${count !== 1 ? "s" : ""}` : ""}`}
      className="relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-ink-800 hover:text-brand-500 transition-colors"
    >
      <svg
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
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-500 text-neutral-0 text-[10px] font-semibold leading-none"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
