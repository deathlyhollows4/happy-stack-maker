import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type Topic = {
  category: string;
  name: string;
  slug: string;
  description: string;
};

const TOPICS: Topic[] = [
  { category: "Arrays", name: "Arrays", slug: "arrays", description: "Index-based storage, traversal, two pointers, and common array tradeoffs." },
  { category: "Arrays", name: "Two Pointers", slug: "two-pointers", description: "Use paired indices to scan, shrink windows, and avoid nested loops." },
  { category: "Strings", name: "Strings", slug: "strings", description: "Work with character sequences, parsing, matching, and frequency patterns." },
  { category: "Hash Tables", name: "Hash Tables", slug: "hash-tables", description: "Trade memory for fast lookup, counting, grouping, and duplicate detection." },
  { category: "Trees", name: "Trees", slug: "trees", description: "Model hierarchical data with traversal, recursion, and search patterns." },
  { category: "Trees", name: "Binary Search Trees", slug: "binary-search-trees", description: "Use ordered tree structure for search, insertion, and range queries." },
  { category: "Graphs", name: "Graphs", slug: "graphs", description: "Represent connections and solve reachability, paths, and component problems." },
  { category: "Graphs", name: "Breadth First Search", slug: "breadth-first-search", description: "Explore level by level for shortest paths and distance in unweighted graphs." },
  { category: "Graphs", name: "Depth First Search", slug: "depth-first-search", description: "Explore deeply with recursion or stacks for traversal and backtracking." },
  { category: "Dynamic Programming", name: "Dynamic Programming", slug: "dynamic-programming", description: "Break problems into overlapping subproblems and reuse computed results." },
  { category: "Sorting", name: "Sorting", slug: "sorting", description: "Order data to simplify search, grouping, greedy choices, and comparisons." },
  { category: "Complexity", name: "Time Complexity", slug: "time-complexity", description: "Estimate runtime growth and compare algorithms with Big O analysis." },
  { category: "Complexity", name: "Space Complexity", slug: "space-complexity", description: "Reason about memory use, auxiliary storage, and input-size tradeoffs." },
  { category: "Recursion", name: "Recursion", slug: "recursion", description: "Solve problems with base cases, recursive steps, and call stack reasoning." },
];

const CATEGORY_ORDER = ["Arrays", "Strings", "Hash Tables", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Complexity", "Recursion"];

export const Route = createFileRoute("/learn/")({
  component: LearnIndexPage,
});

function LearnIndexPage() {
  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Topic hub</p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">Learn CS topics</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Browse the DSA concepts CodeWise tracks in your reviews and practice.</p>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="space-y-14">
            {CATEGORY_ORDER.map((category) => {
              const topics = TOPICS.filter((t) => t.category === category);
              if (topics.length === 0) return null;
              return (
                <section key={category}>
                  <h2 className="font-display text-3xl">{category}</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map((topic) => (
                      <TopicCard key={topic.slug} topic={topic} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link to="/learn/$slug" params={{ slug: topic.slug }} className="group rounded-lg border border-border bg-card p-5 hover:border-accent/40 transition-colors">
      <h3 className="font-display text-xl group-hover:text-accent transition-colors">{topic.name}</h3>
      <p className="mt-2 min-h-16 text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">Learn <ArrowRight className="h-4 w-4" /></span>
    </Link>
  );
}
