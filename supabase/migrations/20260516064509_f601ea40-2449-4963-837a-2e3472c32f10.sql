
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- topics
CREATE TABLE public.topics (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics readable" ON public.topics FOR SELECT USING (true);

INSERT INTO public.topics (slug, name, category, description) VALUES
  ('arrays','Arrays','Data Structures','Contiguous memory, indexing, traversal'),
  ('strings','Strings','Data Structures','Immutability, char arrays, parsing'),
  ('hashing','Hash Maps & Sets','Data Structures','O(1) lookup, collisions, hash functions'),
  ('linked-lists','Linked Lists','Data Structures','Pointers, traversal, in-place reversal'),
  ('stacks','Stacks','Data Structures','LIFO, matching, expression evaluation'),
  ('queues','Queues','Data Structures','FIFO, BFS, sliding windows'),
  ('recursion','Recursion','Paradigms','Base case, recursive case, call stack'),
  ('two-pointers','Two Pointers','Techniques','Opposite ends, fast/slow pointers'),
  ('sliding-window','Sliding Window','Techniques','Fixed/variable windows on arrays/strings'),
  ('binary-search','Binary Search','Algorithms','Sorted invariants, search space reduction'),
  ('sorting','Sorting','Algorithms','Comparisons, stability, complexity'),
  ('trees','Trees','Data Structures','Binary trees, traversal, recursion'),
  ('bst','Binary Search Trees','Data Structures','In-order property, search/insert'),
  ('heaps','Heaps & Priority Queues','Data Structures','Top-K, scheduling'),
  ('graphs','Graphs','Data Structures','Adjacency lists, BFS, DFS'),
  ('dp','Dynamic Programming','Paradigms','Overlapping subproblems, memoization'),
  ('greedy','Greedy','Paradigms','Local optimum, exchange argument'),
  ('backtracking','Backtracking','Paradigms','Choose / explore / un-choose'),
  ('bit-manipulation','Bit Manipulation','Techniques','Bitwise ops, masks'),
  ('complexity','Time & Space Complexity','Concepts','Big-O analysis, tradeoffs');

-- submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  summary TEXT,
  concepts TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own submissions" ON public.submissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX submissions_user_idx ON public.submissions (user_id, created_at DESC);

-- review_issues
CREATE TABLE public.review_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line INTEGER,
  severity TEXT NOT NULL DEFAULT 'info',
  concept_slug TEXT,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  fix_hint TEXT
);
ALTER TABLE public.review_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own review issues" ON public.review_issues FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- progress
CREATE TABLE public.progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL REFERENCES public.topics(slug) ON DELETE CASCADE,
  mastery REAL NOT NULL DEFAULT 0.3,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_slug)
);
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- practice_problems
CREATE TABLE public.practice_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT REFERENCES public.topics(slug) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  starter_code TEXT,
  language TEXT NOT NULL DEFAULT 'python',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.practice_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own practice" ON public.practice_problems FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX practice_user_idx ON public.practice_problems (user_id, created_at DESC);
