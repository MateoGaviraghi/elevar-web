import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel — ELEVAR",
  robots: { index: false, follow: false },
};

// Las páginas del panel son dinámicas: nunca caché con datos del panel (08-CODIGO).
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
