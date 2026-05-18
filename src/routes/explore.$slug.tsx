import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Clock, Tag, Loader2 } from "lucide-react";
import { getBlogPostBySlug, type BlogPostRow } from "@/lib/codewise.functions";
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

export const Route = createFileRoute("/explore/$slug")({
  head: () => ({
    meta: [
      { title: "Post | CodeWise Explore" },
      {
        name: "description",
        content: "Read this post on CodeWise Explore.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: ExplorePostPage,
});

function ExplorePostPage() {
  const { slug } = useParams({ from: "/explore/$slug" });
  const fn = useServerFn(getBlogPostBySlug);
  const { data: row, isLoading } = useQuery({
    queryKey: ["blogPost", slug],
    queryFn: () => fn({ data: { slug } }),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!row) {
    return <NotFound slug={slug} />;
  }

  const post = toBlogPost(row);

  return (
    <article>
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Explore
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="font-mono">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTime} min read
            </span>
          </div>

          <h1 className="font-display text-4xl tracking-tight md:text-5xl leading-[1.1]">
            {post.title}
          </h1>

          <p className="mt-4 text-sm text-muted-foreground">By {post.author}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
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
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {post.body.map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground/90 mb-5">
            {paragraph}
          </p>
        ))}
      </div>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Want feedback on your code?</h2>
          <p className="mt-3 text-muted-foreground">
            CodeWise helps CS students master concepts through pedagogical AI code review. Your
            first review is free.
          </p>
          <Link
            to="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start your first review <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <article className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Post not found
      </p>
      <h1 className="mt-4 font-display text-4xl">This post doesn't exist</h1>
      <p className="mt-4 text-muted-foreground">
        We couldn't find a blog post for "{slug}". Check out the Explore page for all our articles.
      </p>
      <Link
        to="/explore"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <ArrowRight className="h-4 w-4" /> Browse Explore
      </Link>
    </article>
  );
}
