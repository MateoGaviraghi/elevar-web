import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets:["latin"], weight:["400","500","600","700"], variable:"--font-dm-sans", display:"swap" });
const inter = Inter({ subsets:["latin"], weight:["400","500","600"], variable:"--font-inter", display:"swap" });

export const metadata: Metadata = {
  title: "Elevar — Consultoría de Calidad para Laboratorios ISO/IEC 17025",
  description: "Formación y asistencia técnica para laboratorios de ensayo y calibración bajo ISO/IEC 17025 en Argentina y LATAM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${dmSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca "js" antes del primer pintado: lo que entra con GSAP arranca oculto
            y no parpadea (sin JS, todo queda visible). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
