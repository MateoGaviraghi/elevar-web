import type { Modality } from "@/types";

const GRADIENTS: Record<Modality, string> = {
  ASYNC: "from-ink-600 to-ink-900",
  LIVE: "from-emerald-600 to-emerald-800",
  WEBINAR: "from-brand-500 to-brand-700",
  WORKSHOP: "from-amber-500 to-amber-700",
};

/** Miniatura branded por modalidad con el código del curso (sin imágenes reales). */
export function ModalityThumb({
  modality,
  code,
  className = "",
}: {
  modality: Modality;
  code?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${GRADIENTS[modality]} ${className}`}
    >
      <svg
        className="absolute -right-4 -top-5 h-20 w-20 text-neutral-0/15"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
      >
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {code && (
        <span className="relative font-display text-sm font-bold tracking-tight text-neutral-0">
          {code}
        </span>
      )}
    </div>
  );
}
