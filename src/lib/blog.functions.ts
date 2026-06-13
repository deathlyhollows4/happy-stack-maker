import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isAdmin } from "./codewise.utils";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  author: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return (data as BlogPostRow[]) ?? [];
});

export const getBlogPostBySlug = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { data: post } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return post as BlogPostRow | null;
  });

export const listAllBlogPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId)))
      return { ok: false as const, error: "Forbidden", posts: [] as BlogPostRow[] };
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    return { ok: true as const, posts: (data ?? []) as BlogPostRow[] };
  });

export const createBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(200),
        title: z.string().min(1).max(500),
        excerpt: z.string().default(""),
        body: z.string().default("[]"),
        tags: z.array(z.string()).default([]),
        author: z.string().default("CodeWise"),
        published: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const { error } = await supabaseAdmin.from("blog_posts").insert({
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      tags: data.tags,
      author: data.author,
      published: data.published,
    });
    if (error) {
      console.error("createBlogPost failed:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const updateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        slug: z.string().min(1).max(200),
        title: z.string().min(1).max(500),
        excerpt: z.string().default(""),
        body: z.string().default("[]"),
        tags: z.array(z.string()).default([]),
        author: z.string().default("CodeWise"),
        published: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .update({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        tags: data.tags,
        author: data.author,
        published: data.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) {
      console.error("updateBlogPost failed:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) {
      console.error("deleteBlogPost failed:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });
