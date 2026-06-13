import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Tag, ArrowRight } from "lucide-react";
import { getAllBlogPosts, type BlogPostRow } from "@/lib/codewise.functions";
import type { BlogPost } from "@/lib/blog-posts";

function toBlogPost(row: BlogPostRow): BlogPost {
  let body: string[];
  try {
    body = JSON.parse(row.body);
  } catch {
    body = [row.body];
  }
  return {
    slug: row.slug,
    title: row.title,
    date: row.created_at,
    author: row.author,
    excerpt: row.excerpt,
    body,
    tags: row.tags ?? [],
    readTime: Math.max(1, Math.ceil(body.join(" ").split(" ").length / 200)),
  };
}

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog | CodeWise" },
      {
        name: "description",
        content:
          "Resources for CS students on DSA patterns, code review, and learning strategies.",
      },
      { property: "og:title", content: "Blog | CodeWise" },
      {
        property: "og:description",
        content: "Resources for CS students on DSA patterns, code review, and learning strategies.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/blog" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/blog" }],
  }),
  component: BlogLayout,
});

function BlogLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isList = path === "/blog";
  const fn = useServerFn(getAllBlogPosts);
  const { data: rows } = useQuery({
    queryKey: ["blogPosts"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const posts = (rows ?? []).map(toBlogPost);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="blog" />

      {isList ? (
        <BlogList posts={posts} />
      ) : (
        <main>
          <Outlet />
        </main>
      )}

      <SiteFooter />
    </div>
  );
}

function BlogList({ posts }: { posts: BlogPost[] }) {
  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Resources for CS students
          </p>
          <h1 className="mt-4 font-display text-6xl tracking-tight md:text-7xl">Blog</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Articles on CS concepts, DSA patterns, and learning strategies for students.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No posts published yet. Check back soon.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-card/40">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl">Want to learn the topics first?</h2>
          <p className="mt-4 text-muted-foreground">
            Browse the DSA concepts CodeWise tracks across reviews and practice.
          </p>
          <Link
            to="/learn"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Explore topics <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group rounded-lg border border-border bg-card p-5 hover:border-accent/40 transition-colors"
    >
      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-mono">
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.readTime} min
        </span>
      </div>
      <h2 className="font-display text-xl leading-tight group-hover:text-accent transition-colors">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tag className="h-3 w-3 text-muted-foreground" />
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
