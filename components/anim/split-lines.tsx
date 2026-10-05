"use client";

import { ElementType, ReactNode, useRef } from "react";
import { gsap, prefersReducedMotion, SplitText, START, useGSAP } from "@/lib/gsap";

/**
 * Título que entra línea por línea desde atrás de una máscara (SplitText),
 * 1,2 s expo.out, escalonado 0,08 s. Se re-parte solo si cambia el ancho.
 * `immediate`: entra al cargar (heroes); si no, con el scroll.
 */
export function SplitLines({
  as: Tag = "h2",
  className,
  children,
  immediate = false,
  delay = 0,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  immediate?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: "inherit" });
        return;
      }
      let split: SplitText | null = null;
      document.fonts.ready.then(contextSafe!(() => {
        if (!ref.current) return;
        split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { visibility: "inherit" });
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.08,
              delay,
              ...(immediate ? {} : { scrollTrigger: { trigger: el, start: START, once: true } }),
            });
          },
        });
      }));
      return () => split?.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref as never} className={className} data-reveal="">
      {children}
    </Tag>
  );
}
