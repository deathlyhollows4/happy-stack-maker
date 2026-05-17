import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Tag } from "lucide-react";
import { getPostBySlug } from "@/lib/blog-posts";

export const Route = createFileRoute("/explore/$slug")({
  head: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) {
      return {
        meta: [
          { title: "Post not found — CodeWise Explore" },
          {
            name: "description",
            content: "The blog post you're looking for doesn't exist.",
          },
        ],
      };
    }
    return {
      meta: [
        { title: `${post.title} — CodeWise Explore` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: `${post.title} — CodeWise Explore` },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: ExplorePostPage,
});

function ExplorePostPage() {
  const { slug } = useParams({ from: "/explore/$slug" });
  const post = getPostBySlug(slug);

  if (!post) {
    return <NotFound slug={slug} />;
  }

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

      <main>
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

              <p className="mt-4 text-sm text-muted-foreground">
                By {post.author}
              </p>

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
            <div className="prose-codewise">
              {post.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-base leading-relaxed text-foreground/90 mb-5"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="font-display text-3xl">
              Want feedback on your code?
            </h2>
            <p className="mt-3 text-muted-foreground">
              CodeWise helps CS students master concepts through pedagogical AI
              code review. Your first review is free.
            </p>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start your first review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10 text-center space-y-3">
        <p className="font-mono text-xs text-muted-foreground">
          CodeWise · Built for CS students who'd rather understand than
          autocomplete.
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

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl">CodeWise</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Post not found
        </p>
        <h1 className="mt-4 font-display text-4xl">
          This post doesn't exist
        </h1>
        <p className="mt-4 text-muted-foreground">
          We couldn't find a blog post for "{slug}". Check out the Explore page
          for all our articles.
        </p>
        <Link
          to="/explore"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowRight className="h-4 w-4" /> Browse Explore
        </Link>
      </main>
    </div>
  );
}
