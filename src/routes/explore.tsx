import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Tag, ArrowRight, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore | CodeWise" },
      {
        name: "description",
        content:
          "Deep dives into CS concepts, DSA patterns, and learning strategies for computer science students preparing for placements.",
      },
      { property: "og:title", content: "Explore | CodeWise" },
      {
        property: "og:description",
        content: "Deep dives into CS concepts, DSA patterns, and learning strategies.",
      },
    ],
  }),
  component: ExploreLayout,
});

function ExploreLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isList = path === "/explore";
  const fn = useServerFn(getAllBlogPosts);
  const { data: rows } = useQuery({
    queryKey: ["blogPosts"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const posts = (rows ?? []).map(toBlogPost);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl">CodeWise</span>
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              beta
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {isList ? (
        <ExploreList posts={posts} />
      ) : (
        <main>
          <Outlet />
        </main>
      )}

      <footer className="border-t border-border py-10 text-center space-y-3">
        <p className="font-mono text-xs text-muted-foreground">
          CodeWise · Built for CS students who'd rather understand than autocomplete.
        </p>
        <div className="flex justify-center gap-4 font-mono text-[11px] text-muted-foreground">
          <Link to="/explore" className="hover:text-foreground">
            Explore
          </Link>
          <Link to="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link to="/refunds" className="hover:text-foreground">
            Refunds
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ExploreList({ posts }: { posts: BlogPost[] }) {
  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Blog</p>
          <h1 className="mt-4 font-display text-6xl tracking-tight md:text-7xl">Explore</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Deep dives into CS concepts, DSA patterns, and learning strategies. Written for students
            who'd rather understand than memorise.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet. Check back soon.</p>
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
          <h2 className="font-display text-4xl">Have a topic you'd like us to cover?</h2>
          <p className="mt-4 text-muted-foreground">
            We're always writing new guides. If there's a CS concept you want explained, let us
            know.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Join CodeWise <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/explore/$slug"
      params={{ slug: post.slug }}
      className="group rounded-lg border border-border bg-card p-5 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
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
      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
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
