import type { Metadata } from "next";
import { BlogLista } from "@/components/blog/lista";

export const metadata: Metadata = {
  title: "Blog — Elevar",
  description:
    "Cápsulas informativas sobre calidad de laboratorios, ISO/IEC 17025, incertidumbre, auditorías y no conformidades.",
};

export default function BlogPage() {
  return <BlogLista />;
}
