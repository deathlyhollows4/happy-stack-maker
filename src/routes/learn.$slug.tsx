import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ChevronRight, BarChart3, Zap, Target, AlertTriangle, TrendingUp, Lightbulb, Link2, Hash, Clock, Cpu } from "lucide-react";

type StaticTopic = {
  name: string; category: string; description: string; overview: string;
  operations: Array<{ name: string; time: string; space: string }>;
  commonPatterns: Array<{ name: string; slug: string }>;
  whenToUse: string; whenToAvoid: string; maangFrequency: string; prerequisites: string[];
};

const STATIC_TOPICS: Record<string, StaticTopic> = {
  arrays: { name: "Arrays", category: "Data Structures", description: "Contiguous indexed storage for ordered values.", overview: "Arrays give constant-time index access and are the base for two pointers, sliding windows, prefix sums, and many interview patterns.", operations: [{ name: "Access by index", time: "O(1)", space: "O(1)" }, { name: "Search", time: "O(n)", space: "O(1)" }, { name: "Insert or delete middle", time: "O(n)", space: "O(1)" }], commonPatterns: [{ name: "Two Pointers", slug: "two-pointers" }, { name: "Sorting", slug: "sorting" }], whenToUse: "Use arrays when order matters, index lookup is frequent, or the data size is known enough to scan efficiently.", whenToAvoid: "Avoid arrays when you need many middle insertions, deletes, or key-based lookup without scanning.", maangFrequency: "High", prerequisites: [] },
  strings: { name: "Strings", category: "Data Structures", description: "Character sequences with ordering, indexing, and pattern matching behavior.", overview: "String problems often reduce to arrays of characters plus hashing, two pointers, tries, or dynamic programming for matching and subsequences.", operations: [{ name: "Index character", time: "O(1)", space: "O(1)" }, { name: "Substring", time: "O(k)", space: "O(k)" }, { name: "Concatenate repeatedly", time: "O(n^2)", space: "O(n)" }], commonPatterns: [{ name: "Two Pointers", slug: "two-pointers" }, { name: "Hash Tables", slug: "hash-tables" }], whenToUse: "Use strings for ordered text data, tokens, encodings, and sequence matching.", whenToAvoid: "Avoid repeated immutable concatenation in loops when a builder or array join would be cheaper.", maangFrequency: "High", prerequisites: ["arrays"] },
  "hash-tables": { name: "Hash Tables", category: "Data Structures", description: "Key-value storage optimized for fast lookup, insertion, and deletion.", overview: "Hash tables trade extra memory for average constant-time operations and power frequency maps, seen sets, memoization, and grouping.", operations: [{ name: "Lookup", time: "O(1) avg", space: "O(1)" }, { name: "Insert", time: "O(1) avg", space: "O(1)" }, { name: "Iterate keys", time: "O(n)", space: "O(1)" }], commonPatterns: [{ name: "Frequency Map", slug: "hash-tables" }, { name: "Dynamic Programming", slug: "dynamic-programming" }], whenToUse: "Use hash tables when you need fast membership checks, counts, indexes, or memoized subproblem results.", whenToAvoid: "Avoid them when deterministic ordering, tiny memory usage, or range queries are the main requirement.", maangFrequency: "High", prerequisites: ["arrays"] },
  trees: { name: "Trees", category: "Data Structures", description: "Hierarchical nodes connected by parent-child relationships.", overview: "Trees model hierarchy and recursive structure. Traversal order controls whether you solve top-down, bottom-up, level-order, or path-based problems.", operations: [{ name: "Visit all nodes", time: "O(n)", space: "O(h)" }, { name: "Find height", time: "O(n)", space: "O(h)" }, { name: "Level order", time: "O(n)", space: "O(w)" }], commonPatterns: [{ name: "DFS", slug: "depth-first-search" }, { name: "BFS", slug: "breadth-first-search" }], whenToUse: "Use trees for hierarchical data, divide-and-conquer recursion, and ancestor or subtree questions.", whenToAvoid: "Avoid plain trees for unordered lookup when a hash table or balanced search tree is more direct.", maangFrequency: "High", prerequisites: ["recursion"] },
  graphs: { name: "Graphs", category: "Data Structures", description: "Nodes connected by edges that may be directed, undirected, weighted, or unweighted.", overview: "Graphs model relationships. Most graph solutions start by choosing a representation, then applying BFS, DFS, topological ordering, or shortest-path logic.", operations: [{ name: "Traverse adjacency list", time: "O(V+E)", space: "O(V)" }, { name: "Add edge", time: "O(1)", space: "O(1)" }, { name: "Check adjacency list edge", time: "O(deg(v))", space: "O(1)" }], commonPatterns: [{ name: "BFS", slug: "breadth-first-search" }, { name: "DFS", slug: "depth-first-search" }], whenToUse: "Use graphs for networks, dependencies, grids, connectivity, paths, and relationship problems.", whenToAvoid: "Avoid graph modeling when the data is naturally linear or hierarchical and simpler structures solve it.", maangFrequency: "High", prerequisites: ["hash-tables"] },
  "dynamic-programming": { name: "Dynamic Programming", category: "Algorithms", description: "Optimization by reusing overlapping subproblem results.", overview: "Dynamic programming works when a problem has repeated subproblems and optimal substructure. Define state, transition, base cases, and iteration order.", operations: [{ name: "Memoized state", time: "O(states * transition)", space: "O(states)" }, { name: "Tabulation", time: "O(states * transition)", space: "O(states)" }, { name: "Space optimized DP", time: "O(states * transition)", space: "O(window)" }], commonPatterns: [{ name: "Recursion", slug: "recursion" }, { name: "Hash Tables", slug: "hash-tables" }], whenToUse: "Use DP for counting, optimization, subsequences, partitions, and choices with overlapping subproblems.", whenToAvoid: "Avoid DP when greedy, sorting, or a single pass solves the problem without repeated states.", maangFrequency: "High", prerequisites: ["recursion"] },
  sorting: { name: "Sorting", category: "Algorithms", description: "Ordering values according to a comparison or key.", overview: "Sorting often unlocks simpler scans, two-pointer solutions, duplicate grouping, interval merging, and binary search.", operations: [{ name: "Comparison sort", time: "O(n log n)", space: "O(log n) to O(n)" }, { name: "Counting sort", time: "O(n+k)", space: "O(k)" }, { name: "Merge sorted arrays", time: "O(n+m)", space: "O(1) to O(n+m)" }], commonPatterns: [{ name: "Two Pointers", slug: "two-pointers" }, { name: "Arrays", slug: "arrays" }], whenToUse: "Use sorting when order helps remove nested loops, group values, or make greedy choices valid.", whenToAvoid: "Avoid sorting when original order must be preserved or a hash table can solve it in linear time.", maangFrequency: "High", prerequisites: ["arrays"] },
  recursion: { name: "Recursion", category: "Foundations", description: "A technique where a function solves a problem by calling itself on smaller inputs.", overview: "Recursive solutions need a clear base case, progress toward that base case, and a way to combine subresults.", operations: [{ name: "Function call", time: "Problem dependent", space: "O(depth)" }, { name: "Tree recursion", time: "O(branch^depth)", space: "O(depth)" }, { name: "Memoized recursion", time: "O(states)", space: "O(states)" }], commonPatterns: [{ name: "Trees", slug: "trees" }, { name: "Dynamic Programming", slug: "dynamic-programming" }], whenToUse: "Use recursion for trees, divide and conquer, backtracking, and naturally nested problems.", whenToAvoid: "Avoid recursion when stack depth can overflow or an iterative loop is clearer.", maangFrequency: "High", prerequisites: [] },
  "two-pointers": { name: "Two Pointers", category: "Patterns", description: "A pattern that uses two indexes moving through one or more sequences.", overview: "Two pointers reduce many array and string problems from nested loops to linear scans by maintaining a meaningful window or pair.", operations: [{ name: "Opposite ends", time: "O(n)", space: "O(1)" }, { name: "Same direction", time: "O(n)", space: "O(1)" }, { name: "Sliding window", time: "O(n)", space: "O(1) to O(k)" }], commonPatterns: [{ name: "Arrays", slug: "arrays" }, { name: "Strings", slug: "strings" }], whenToUse: "Use two pointers for sorted arrays, pairs, palindromes, partitions, and windows.", whenToAvoid: "Avoid it when data is unordered and needs fast arbitrary lookup instead.", maangFrequency: "High", prerequisites: ["arrays"] },
  "binary-search-trees": { name: "Binary Search Trees", category: "Data Structures", description: "Binary trees where left values are smaller and right values are larger.", overview: "BSTs combine tree traversal with ordering, enabling search, insertion, and sorted traversal when the tree is balanced.", operations: [{ name: "Search", time: "O(h)", space: "O(1)" }, { name: "Insert", time: "O(h)", space: "O(1)" }, { name: "In-order traversal", time: "O(n)", space: "O(h)" }], commonPatterns: [{ name: "DFS", slug: "depth-first-search" }, { name: "Sorting", slug: "sorting" }], whenToUse: "Use BSTs when ordered lookup, predecessor, successor, or sorted traversal is required.", whenToAvoid: "Avoid unbalanced BSTs for worst-case guarantees unless balancing is provided.", maangFrequency: "Medium", prerequisites: ["trees", "recursion"] },
  "breadth-first-search": { name: "Breadth-First Search", category: "Algorithms", description: "Layer-by-layer traversal using a queue.", overview: "BFS explores all nodes at distance k before distance k+1, making it ideal for shortest paths in unweighted graphs and level-order tree traversal.", operations: [{ name: "Graph BFS", time: "O(V+E)", space: "O(V)" }, { name: "Tree level order", time: "O(n)", space: "O(w)" }, { name: "Grid BFS", time: "O(rows*cols)", space: "O(rows*cols)" }], commonPatterns: [{ name: "Graphs", slug: "graphs" }, { name: "Trees", slug: "trees" }], whenToUse: "Use BFS for minimum steps, nearest target, level order, and spreading processes.", whenToAvoid: "Avoid BFS when recursion or path backtracking is easier, or when memory for wide frontiers is too high.", maangFrequency: "High", prerequisites: ["graphs"] },
  "depth-first-search": { name: "Depth-First Search", category: "Algorithms", description: "Traversal that follows one path deeply before backtracking.", overview: "DFS is the workhorse for connected components, cycle checks, tree recursion, path exploration, and exhaustive search with pruning.", operations: [{ name: "Graph DFS", time: "O(V+E)", space: "O(V)" }, { name: "Tree DFS", time: "O(n)", space: "O(h)" }, { name: "Backtracking DFS", time: "O(branch^depth)", space: "O(depth)" }], commonPatterns: [{ name: "Graphs", slug: "graphs" }, { name: "Backtracking", slug: "backtracking" }], whenToUse: "Use DFS for components, recursion, path state, topological reasoning, and exhaustive exploration.", whenToAvoid: "Avoid DFS when the shortest unweighted path or level order is required.", maangFrequency: "High", prerequisites: ["recursion", "graphs"] },
  backtracking: { name: "Backtracking", category: "Algorithms", description: "Controlled exhaustive search that builds candidates and undoes choices.", overview: "Backtracking explores decision trees with DFS, pruning invalid choices early and restoring state after each branch.", operations: [{ name: "Generate subsets", time: "O(2^n)", space: "O(n)" }, { name: "Generate permutations", time: "O(n!)", space: "O(n)" }, { name: "Constraint search", time: "Exponential", space: "O(depth)" }], commonPatterns: [{ name: "DFS", slug: "depth-first-search" }, { name: "Recursion", slug: "recursion" }], whenToUse: "Use backtracking for combinations, permutations, subsets, boards, and constraint satisfaction.", whenToAvoid: "Avoid it when greedy, DP, or graph shortest path gives polynomial guarantees.", maangFrequency: "Medium", prerequisites: ["recursion", "depth-first-search"] },
  "time-complexity": { name: "Time Complexity", category: "Foundations", description: "A way to describe how runtime grows as input size grows.", overview: "Time complexity focuses on growth rates such as O(1), O(log n), O(n), O(n log n), O(n^2), and exponential time so you can compare approaches.", operations: [{ name: "Single loop", time: "O(n)", space: "O(1)" }, { name: "Nested loops", time: "O(n^2)", space: "O(1)" }, { name: "Divide in half", time: "O(log n)", space: "O(1)" }], commonPatterns: [{ name: "Space Complexity", slug: "space-complexity" }, { name: "Sorting", slug: "sorting" }], whenToUse: "Use time complexity to evaluate tradeoffs and predict whether a solution will pass constraints.", whenToAvoid: "Avoid relying only on Big-O when constant factors, I/O, or small inputs dominate.", maangFrequency: "High", prerequisites: [] },
  "space-complexity": { name: "Space Complexity", category: "Foundations", description: "A way to describe how memory usage grows with input size.", overview: "Space complexity includes auxiliary structures, recursion stack depth, copied data, and output buffers when relevant.", operations: [{ name: "Constant variables", time: "O(1)", space: "O(1)" }, { name: "Hash map", time: "O(n)", space: "O(n)" }, { name: "Recursive stack", time: "O(n)", space: "O(h)" }], commonPatterns: [{ name: "Time Complexity", slug: "time-complexity" }, { name: "Recursion", slug: "recursion" }], whenToUse: "Use space analysis when memory limits matter or when trading memory for speed.", whenToAvoid: "Avoid ignoring hidden costs from slicing, copying, and recursion stacks.", maangFrequency: "Medium", prerequisites: ["time-complexity"] },
};

export const Route = createFileRoute("/learn/$slug")({
  component: LearnPage,
});

function topicDisplayName(slug: string): string {
  if (slug.length <= 3 && slug === slug.toLowerCase()) return slug.toUpperCase();
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function frequencyColor(freq: string) {
  if (freq === "Very High") return "text-red-500 bg-red-500/10";
  if (freq === "High") return "text-amber-500 bg-amber-500/10";
  if (freq === "Medium") return "text-blue-500 bg-blue-500/10";
  return "text-muted-foreground bg-muted";
}

function LearnPage() {
  const { slug } = useParams({ from: "/learn/$slug" });
  const topic = STATIC_TOPICS[slug] ?? null;

  if (!topic) {
    return <NotFound slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-8 py-24">
            <Link to="/learn" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">&lt;- All topics</Link>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{topic.category}</p>
            <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">{topic.name}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{topic.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/practice" search={{ topic: slug }} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"><Sparkles className="size-4" /> Practice {topic.name} with CodeWise</Link>
              <Link to="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Already have an account? Sign in</Link>
            </div>
          </div>
        </section>
        {topic.prerequisites.length > 0 && (
          <section className="border-b border-border bg-card/30">
            <div className="max-w-4xl mx-auto px-8 py-10">
              <div className="flex items-center gap-3 mb-4"><Link2 className="size-5 text-accent" /><h2 className="font-display text-2xl">Prerequisites</h2></div>
              <p className="text-sm text-muted-foreground mb-4">These topics are prerequisites for {topic.name}.</p>
              <div className="flex flex-wrap gap-2">
                {topic.prerequisites.map((pre) => (
                  <Link key={pre} to="/learn/$slug" params={{ slug: pre }} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:border-accent/40 hover:text-accent transition-colors"><ChevronRight className="size-3.5" />{topicDisplayName(pre)}</Link>
                ))}
              </div>
            </div>
          </section>
        )}
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-8 py-14">
            <div className="flex items-center gap-3 mb-6"><Lightbulb className="size-5 text-accent" /><h2 className="font-display text-2xl">Concept Overview</h2></div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">{topic.overview}</p>
          </div>
        </section>
        <section className="border-b border-border bg-card/30">
          <div className="max-w-4xl mx-auto px-8 py-14">
            <div className="flex items-center gap-3 mb-6"><BarChart3 className="size-5 text-accent" /><h2 className="font-display text-2xl">Key Operations &amp; Complexity</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pr-6 font-medium">Operation</th>
                  <th className="py-3 pr-6 font-medium"><span className="inline-flex items-center gap-1"><Clock className="size-3" /> Time</span></th>
                  <th className="py-3 font-medium"><span className="inline-flex items-center gap-1"><Cpu className="size-3" /> Space</span></th>
                </tr></thead>
                <tbody>{topic.operations.map((op) => (
                  <tr key={op.name} className="border-b border-border/50">
                    <td className="py-3 pr-6 text-foreground">{op.name}</td>
                    <td className="py-3 pr-6 font-mono text-accent">{op.time}</td>
                    <td className="py-3 font-mono text-muted-foreground">{op.space}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </section>
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-8 py-14 grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3 mb-4"><Zap className="size-5 text-accent" /><h2 className="font-display text-xl">Common Patterns</h2></div>
              <div className="flex flex-wrap gap-2">{topic.commonPatterns.map((p) => (
                <Link key={p.slug} to="/learn/$slug" params={{ slug: p.slug }} className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent hover:bg-accent/20 transition-colors"><Hash className="size-3" />{p.name}</Link>
              ))}</div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4"><TrendingUp className="size-5 text-accent" /><h2 className="font-display text-xl">MAANG Frequency</h2></div>
              <span className={"inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs " + frequencyColor(topic.maangFrequency)}><Target className="size-3" />{topic.maangFrequency}</span>
            </div>
          </div>
        </section>
        <section className="border-b border-border bg-card/30">
          <div className="max-w-4xl mx-auto px-8 py-14 grid gap-10 md:grid-cols-2">
            <div><div className="flex items-center gap-3 mb-4"><Zap className="size-5 text-green-500" /><h2 className="font-display text-xl">When to Use</h2></div><p className="text-sm leading-relaxed text-muted-foreground">{topic.whenToUse}</p></div>
            <div><div className="flex items-center gap-3 mb-4"><AlertTriangle className="size-5 text-amber-500" /><h2 className="font-display text-xl">When to Avoid</h2></div><p className="text-sm leading-relaxed text-muted-foreground">{topic.whenToAvoid}</p></div>
          </div>
        </section>
        <section className="bg-card/40">
          <div className="max-w-3xl mx-auto px-8 py-24 text-center">
            <Sparkles className="mx-auto size-6 text-accent" /><h2 className="mt-4 font-display text-4xl">Practice this topic</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">Get code review feedback focused on the CS concepts you need to strengthen.</p>
            <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">Start free review <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-xl mx-auto px-8 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Topic not found</p>
        <h1 className="mt-4 font-display text-4xl">{topicDisplayName(slug)}</h1>
        <p className="mt-4 text-muted-foreground">We don't have a dedicated page for this topic yet.</p>
        <Link to="/learn" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"><ArrowRight className="size-4" /> Browse topics</Link>
      </main>
    </div>
  );
}
