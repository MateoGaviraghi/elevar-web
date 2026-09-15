"use client";

import { useState } from "react";
import { emptyPost } from "@/lib/content";
import { PostForm } from "@/components/admin/post-form";
import { PageHeader } from "@/components/admin/ui";

export default function NewPostPage() {
  const [draft] = useState(() => emptyPost());

  return (
    <>
      <PageHeader
        title="Nueva nota"
        description="Escribí una cápsula informativa para el blog."
        back={{ href: "/admin/blog", label: "Blog" }}
      />
      <PostForm post={draft} isNew />
    </>
  );
}
