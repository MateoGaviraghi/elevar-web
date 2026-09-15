import type { Course, Lead, Promo, WebinarRegistration } from "@/types";
import type { BlogBlock, BlogPost } from "@/lib/blog";
import { BLOG_POSTS } from "@/lib/blog";
import { BLOG_CONTENT } from "@/lib/blog-content";
import { COURSES } from "@/lib/mock-catalog";
import { PROMOS_SEED } from "@/lib/promos";
import {
  newId,
  nextNumericId,
  readCollection,
  writeCollection,
} from "@/lib/local-db";

/** Nota del blog con su cuerpo, tal como la administra el panel. */
export interface FullPost extends BlogPost {
  body: BlogBlock[];
  published: boolean;
  image?: string | null;
}

const POSTS_SEED: FullPost[] = BLOG_POSTS.map((p) => ({
  ...p,
  body: BLOG_CONTENT[p.slug] ?? [],
  published: true,
  image: `/assets/blog/${p.slug}.jpg`,
}));

const COURSES_SEED: Course[] = COURSES.map((c) => ({ ...c, is_published: true }));

// ── Cursos ────────────────────────────────────────────────────────────────────

export function listCourses(): Course[] {
  return readCollection<Course>("courses", COURSES_SEED);
}

export function getCourseById(id: number): Course | undefined {
  return listCourses().find((c) => c.id === id);
}

export function saveCourse(course: Course): Course {
  const rows = listCourses();
  const idx = rows.findIndex((c) => c.id === course.id);
  if (idx >= 0) {
    rows[idx] = course;
  } else {
    rows.unshift({ ...course, id: course.id || nextNumericId(rows) });
  }
  writeCollection("courses", rows);
  return course;
}

export function deleteCourse(id: number): void {
  writeCollection(
    "courses",
    listCourses().filter((c) => c.id !== id)
  );
}

export function emptyCourse(): Course {
  return {
    id: nextNumericId(listCourses()),
    code: "",
    title: "",
    slug: "",
    summary: "",
    category: { id: 9, name: "Calidad y Metrología", slug: "calidad-metrologia" },
    modality: "ASYNC",
    price: "0.00",
    currency: "ARS",
    cover_image: null,
    level: "Intermedio",
    duration_hours: null,
    instructor_names: "Laura Delissi",
    badge: null,
    is_featured: false,
    sessions: [],
    description: "",
    is_published: true,
  };
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export function listPosts(): FullPost[] {
  return readCollection<FullPost>("posts", POSTS_SEED);
}

export function getPost(slug: string): FullPost | undefined {
  return listPosts().find((p) => p.slug === slug);
}

export function savePost(post: FullPost, originalSlug?: string): void {
  const rows = listPosts();
  const idx = rows.findIndex((p) => p.slug === (originalSlug ?? post.slug));
  if (idx >= 0) rows[idx] = post;
  else rows.unshift(post);
  writeCollection("posts", rows);
}

export function deletePost(slug: string): void {
  writeCollection(
    "posts",
    listPosts().filter((p) => p.slug !== slug)
  );
}

export function emptyPost(): FullPost {
  return {
    slug: "",
    title: "",
    hook: "",
    teaser: "",
    category: "Cápsula informativa",
    date: new Date().toISOString().slice(0, 10),
    body: [],
    published: false,
    image: null,
  };
}

// ── Promociones ───────────────────────────────────────────────────────────────

export function listPromos(): Promo[] {
  return readCollection<Promo>("promos", PROMOS_SEED);
}

export function getPromo(id: string): Promo | undefined {
  return listPromos().find((p) => p.id === id);
}

export function savePromo(promo: Promo): void {
  const rows = listPromos();
  const idx = rows.findIndex((p) => p.id === promo.id);
  if (idx >= 0) rows[idx] = promo;
  else rows.unshift(promo);
  writeCollection("promos", rows);
}

export function deletePromo(id: string): void {
  writeCollection(
    "promos",
    listPromos().filter((p) => p.id !== id)
  );
}

export function emptyPromo(): Promo {
  return {
    id: newId("promo"),
    code: "",
    title: "",
    description: "",
    kind: "PERCENT",
    value: 10,
    trigger: "COUPON",
    scope: "ALL",
    modality: null,
    categorySlug: null,
    courseIds: [],
    minQuantity: null,
    minAmount: null,
    startsAt: null,
    endsAt: null,
    active: true,
    featured: false,
  };
}

// ── Contactos / leads ─────────────────────────────────────────────────────────

export function listLeads(): Lead[] {
  return readCollection<Lead>("leads", []);
}

export function addLead(lead: Omit<Lead, "id" | "created_at">): Lead {
  const row: Lead = { ...lead, id: newId("lead"), created_at: new Date().toISOString() };
  writeCollection("leads", [row, ...listLeads()]);
  return row;
}

export function deleteLead(id: string): void {
  writeCollection(
    "leads",
    listLeads().filter((l) => l.id !== id)
  );
}

// ── Inscripciones a webinars ──────────────────────────────────────────────────

export function listWebinarRegistrations(): WebinarRegistration[] {
  return readCollection<WebinarRegistration>("webinars", []);
}

export function addWebinarRegistration(
  reg: Omit<WebinarRegistration, "id" | "created_at">
): WebinarRegistration {
  const row: WebinarRegistration = {
    ...reg,
    id: newId("web"),
    created_at: new Date().toISOString(),
  };
  writeCollection("webinars", [row, ...listWebinarRegistrations()]);
  return row;
}

export function deleteWebinarRegistration(id: string): void {
  writeCollection(
    "webinars",
    listWebinarRegistrations().filter((r) => r.id !== id)
  );
}
