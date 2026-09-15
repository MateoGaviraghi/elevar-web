"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPost, type FullPost } from "@/lib/content";
import { PostForm } from "@/components/admin/post-form";
import { AdminButton, EmptyState, PageHeader } from "@/components/admin/ui";

export default function EditPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<FullPost | null | undefined>(undefined);

  useEffect(() => {
    setPost(getPost(params.slug) ?? null);
  }, [params.slug]);

  if (post === undefined) {
    return <p className="text-sm text-neutral-500">Cargando nota…</p>;
  }

  if (post === null) {
    return (
      <>
        <PageHeader title="Nota no encontrada" back={{ href: "/admin/blog", label: "Blog" }} />
        <EmptyState
          title="No encontramos esta nota"
          action={<AdminButton href="/admin/blog">Volver al listado</AdminButton>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={post.title}
        back={{ href: "/admin/blog", label: "Blog" }}
        actions={
          post.published ? (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="text-xs font-semibold text-neutral-500 transition-colors hover:text-ink-900"
            >
              Ver en el sitio ↗
            </Link>
          ) : undefined
        }
      />
      <PostForm post={post} isNew={false} />
    </>
  );
}
