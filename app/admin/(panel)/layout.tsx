import { Space_Grotesk } from "next/font/google";
import { PanelShell } from "@/components/admin/shell";

// Tercera fuente, solo del panel (2026-11-24): subtítulos, etiquetas y cifras. Títulos DM Sans, texto Inter.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={spaceGrotesk.variable}>
      <PanelShell>{children}</PanelShell>
    </div>
  );
}
