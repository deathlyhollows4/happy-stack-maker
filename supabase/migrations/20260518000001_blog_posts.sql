-- Blog posts CMS table
-- Admin CRUD via supabaseAdmin in server functions (RLS bypass), gated by isAdmin().
-- Public reads are via getAllBlogPosts/getBlogPostBySlug server fns which use supabaseAdmin.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '[]',
  tags text[] not null default '{}',
  author text not null default 'CodeWise',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the 5 existing blog posts from the old hardcoded blog-posts.ts

insert into public.blog_posts (slug, title, excerpt, body, tags, author, published, created_at) values
(
  'why-big-o-matters',
  'Why Big-O Matters More Than You Think',
  'Most students memorise Big-O like a fact sheet. They miss the point. Complexity analysis is not about passing interviews; it is about developing the instinct to predict how your code scales before you even run it.',
  '["Every CS student grinds through Big-O notation before placements. They memorise that binary search is O(log n), merge sort is O(n log n), and nested loops mean O(n^2). Then they walk into an interview, get asked to analyse a piece of code they have never seen, and freeze.","The problem is not memorisation. It is that most courses teach complexity as a trivia fact rather than a reasoning tool. You are told what the answer is, but never how to derive it yourself.","Complexity analysis is fundamentally about counting operations that grow with input size. Every loop that iterates over n elements adds a factor of n. Every halving of the search space gives you a log factor. Nested independent loops multiply. Adjacent loops add. Recursion with branching multiplies exponentially. Once you internalise these four rules, you can analyse almost anything.","Consider two_sum with a hash map. The single pass over the array is O(n). Each hash map lookup is O(1) amortised. Total: O(n). Now contrast with the brute-force nested loop: O(n^2). For an array of 100,000 elements, that is the difference between 100,000 operations and 10 billion. Your code did not just become faster; it became fundamentally feasible.","This is why we at CodeWise flag complexity issues even when the code produces correct output. Passing test cases with O(n^2) when O(n) exists is not a win; it is a gap in your CS intuition. And that intuition is what separates engineers who write code from engineers who design systems.","Next time you solve a DSA problem, do not stop when the tests pass. Ask yourself: what input size would break this? What is the dominant operation? Could I do it in one pass instead of two? That is the muscle Big-O is meant to build."]',
  ARRAY['complexity', 'beginner', 'interview-prep'],
  'CodeWise',
  true,
  '2026-04-20'
),
(
  'deliberate-dsa-practice',
  'How to Practice DSA Effectively',
  'Grinding 500 LeetCode problems without a system is like reading a dictionary to learn a language. Deliberate practice (targeted, feedback-driven, spaced over time) builds mastery that sticks. Here is how to apply it to DSA.',
  '["The most common advice for placement preparation is ''just grind LeetCode.'' But grinding without structure leads to the illusion of progress. You solve problems by pattern-matching against recently seen solutions, not by building durable understanding. Two weeks later, the same problem feels unfamiliar.","Deliberate practice (a concept from cognitive psychology) requires four things: a specific skill target, immediate feedback, progressive difficulty, and spaced repetition. Applied to DSA, this means you do not just solve random problems. You pick a topic (say, sliding window), solve problems that isolate that technique, get detailed feedback on why your approach works or does not, and revisit the topic days later when the memory has started to fade.","This is why CodeWise organises its knowledge tracing around 20 discrete CS topics. When you submit code for review, the AI does not just give you a pass/fail; it maps your errors to specific concepts, updates your mastery score using a Bayesian model, and generates practice problems at your exact skill level. You can see exactly where you are weak and exactly what to work on next.","A concrete routine: pick your weakest topic from the dashboard. Do 3-5 problems in that topic across a week. Submit each for review. Read every explanation, not just the fix. At the end of the week, revisit the first problem. If it feels easy now, you have built durable mastery. If not, you need more focused practice on the underlying concept, not more problems.","The students who improve fastest are not the ones who solve the most problems. They are the ones who extract the most learning from each problem. Quality over quantity, every time."]',
  ARRAY['practice', 'learning', 'methodology'],
  'CodeWise',
  true,
  '2026-04-25'
),
(
  'recursion-mistakes-beginners-make',
  'Common Beginner Mistakes in Recursion',
  'Recursion is elegant, powerful, and absolutely brutal when you get it wrong. The three mistakes almost every beginner makes: missing base cases, confusing pre-order vs post-order, and ignoring stack depth limits.',
  '["Recursion is the CS concept that separates ''I can code'' from ''I understand computation.'' It is the gateway to trees, graphs, backtracking, and dynamic programming. And almost every student makes the same three mistakes when they first encounter it.","Mistake one: the missing or incomplete base case. Every recursive function needs a condition that stops the recursion. Without it, you get infinite recursion and a stack overflow. But ''incomplete'' base cases are sneakier; they handle the happy path (empty array, zero, null) but miss edge cases (single element, negative numbers, already-visited nodes). Always ask: what is the smallest possible input, and does my base case handle it?","Mistake two: confusing when work happens. In pre-order recursion, you process the current node before recursing into children (think: print node, then recurse left, then right). In post-order, you recurse first and process after (think: recurse left, recurse right, then compute node value from children). In-order does work between left and right recursion. Mixing these up is the root cause of so many tree and graph bugs.","Mistake three: ignoring the call stack. Every recursive call consumes stack memory. Python''s default recursion limit is 1000. JavaScript engines vary. Deep recursion on unbalanced trees, long linked lists, or naive Fibonacci will overflow. The fix is either tail recursion (where the language supports it) or converting to iteration with an explicit stack. Knowing when recursion is elegant versus when it is dangerous is a core engineering skill.","CodeWise''s review engine specifically flags these patterns: we check if your base case handles edge inputs, if your traversal order matches what the problem demands, and if your recursive depth could exceed safe limits for the input constraints. These are not just style notes; they are correctness issues that fail in production.","Recursion is not hard because the concept is hard. It is hard because the failure modes are invisible until the stack blows up. Get the base case right, the order right, and the depth right, and the rest follows."]',
  ARRAY['recursion', 'debugging', 'beginner'],
  'CodeWise',
  true,
  '2026-05-02'
),
(
  'two-pointer-pattern',
  'The Two-Pointer Pattern You are Missing',
  'Two-pointers is one of the most versatile DSA patterns, yet students consistently miss it. If you are writing nested loops to search a sorted array, you are doing it wrong. Here is when and how to use two-pointers.',
  '["You have seen the problem: find if a sorted array contains two numbers that sum to a target. The brute force is nested loops; O(n^2). The optimal solution uses two pointers, one at each end, moving inward based on whether the current sum is too high or too low. O(n) time, O(1) space. But two-pointers is not just for two_sum.","The pattern generalises to any problem where you are searching for a pair (or triplet, or subarray) in a sequence and can eliminate possibilities in a single pass. The key insight: if the array is sorted, moving a pointer in one direction monotonically changes the value in a predictable way. You can make decisions with certainty, never needing to backtrack.","Variations you should know: opposite-direction pointers (start and end, for two-sum and palindrome checking), same-direction fast/slow pointers (for cycle detection, middle element, removing duplicates in-place), and sliding window (fixed or variable size, for substring and subarray problems). Each variation uses the same core idea: two indices that move through the array, never needing to reset.","The most common mistake: students apply two-pointers to unsorted arrays, where the monotonic property does not hold. If the array is not sorted, sort it first; but remember that sorting costs O(n log n). Sometimes that is still better than O(n^2). Sometimes a hash map gives you O(n) without sorting. Knowing which tool to reach for is the skill.","Practice sequence: start with two_sum on a sorted array to internalise the opposite-direction pattern. Then move to container_with_most_water, which uses the same pointer movement but a different objective. Then try three_sum, which pairs two-pointers with a fixed outer element. By the third problem, you will start seeing the pattern everywhere.","At CodeWise, we track whether your solution uses the optimal pattern for the problem constraints. If you are writing nested loops where two-pointers would work, we will flag it, not as a syntax error, but as a concept gap. The pattern itself is not the goal; the thinking it represents is."]',
  ARRAY['two-pointers', 'patterns', 'optimisation', 'intermediate'],
  'CodeWise',
  true,
  '2026-05-08'
),
(
  'brute-force-to-optimal',
  'From Brute Force to Optimal: A Thinking Framework',
  'Every optimal solution starts as a brute force idea, refined through a systematic process. Here is a framework for getting from ''it works but it is slow'' to ''it works and it scales'', without relying on memorised solutions.',
  '["Interviewers love asking candidates to optimise. But ''just think of the optimal solution'' is terrible advice. Optimal solutions do not appear from nowhere; they emerge from systematically questioning a working brute force approach.","Step one: state the brute force out loud. For every problem, there is a naive solution: try all combinations, check all subarrays, explore all paths. Write the time and space complexity. This gives you a baseline. If brute force is already O(n) with O(1) space, you are done. (Rare, but it happens.)","Step two: identify the wasted work. Run through a small example by hand. Where is the algorithm recomputing the same thing? Where is it checking possibilities that cannot possibly be correct? These are your optimisation targets.","Step three: pick your weapon. Wasted work falls into predictable categories. Repeated subproblems -> dynamic programming or memoisation. Unnecessary comparisons -> sorting plus binary search or two-pointers. Re-traversing the entire input -> sliding window or prefix sums. Exploring dead-end paths -> pruning in backtracking. Checking every pair -> hash maps for O(1) lookup.","Step four: verify the constraints. An O(n^2) solution is fine for n <= 1000. O(n log n) handles n <= 10^5 comfortably. O(n) handles n <= 10^7. Do not over-optimise for small inputs, and do not under-optimise for large ones. Read the constraints first; they tell you what complexity class you need.","Step five: implement, then review. Get the optimal approach working with a small test case. Then submit it to CodeWise for a pedagogical review. The AI will confirm whether your complexity analysis is correct, identify any remaining inefficiencies, and explain which CS concepts your solution demonstrates, or which ones you are still missing.","This framework works because it treats optimisation as a skill, not as magic. Every step builds on the previous one. With practice, steps one through four become automatic, and step five (the review) becomes the part where you actually learn something new."]',
  ARRAY['optimisation', 'interview-prep', 'methodology', 'intermediate'],
  'CodeWise',
  true,
  '2026-05-12'
);
