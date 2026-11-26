import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotaCapsula } from "@/components/blog/nota";
import { datosNota } from "@/components/blog/nota-datos";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Nota no encontrada — Elevar" };
  return { title: `${post.title} — Blog Elevar`, description: post.teaser };
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const datos = datosNota(params.slug);
  if (!datos) notFound();
  return <NotaCapsula {...datos} />;
}
