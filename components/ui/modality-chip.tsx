import type { Modality } from "@/types";
import { Badge, BadgeTone } from "./badge";

export interface ModalityChipProps {
  modality: Modality;
  className?: string;
}

const MODALITY_MAP: Record<Modality, { label: string; tone: BadgeTone }> = {
  ASYNC: { label: "Asincrónico", tone: "info" },
  LIVE: { label: "En vivo", tone: "success" },
  WEBINAR: { label: "Webinar", tone: "info" },
  WORKSHOP: { label: "Taller", tone: "warning" },
};

export function ModalityChip({ modality, className }: ModalityChipProps) {
  const { label, tone } = MODALITY_MAP[modality];
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
