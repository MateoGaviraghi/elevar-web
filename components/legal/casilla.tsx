"use client";

/* Casilla de consentimiento (KAN-41; Ley 25.326 art. 5: consentimiento expreso). Arranca sin
 * marcar, la zona que se toca mide 44 px y el error se lee junto a la casilla. */

import type { ReactNode } from "react";

export function Casilla({
  checked,
  onChange,
  error,
  tono = "claro",
  children,
  className = "",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  tono?: "claro" | "oscuro";
  children: ReactNode;
  className?: string;
}) {
  const dark = tono === "oscuro";
  return (
    <div className={className}>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-none accent-brand-500 ${error ? "outline outline-2 outline-offset-1 outline-status-error" : ""}`}
        />
        <span className={`text-sm leading-snug ${dark ? "text-neutral-0/80" : "text-neutral-700"}`}>{children}</span>
      </label>
      {error && (
        <p role="alert" className={`mt-1 pl-8 text-xs font-medium ${dark ? "text-red-300" : "text-status-error"}`}>
          {error}
        </p>
      )}
    </div>
  );
}
