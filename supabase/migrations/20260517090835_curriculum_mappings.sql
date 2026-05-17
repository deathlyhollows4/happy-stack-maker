-- Curriculum mappings: CodeWise topics → SPPU / NPTEL course alignment
create table public.curriculum_mappings (
  topic_slug text primary key references public.topics(slug) on delete cascade,
  sppu_course text,
  sppu_module text,
  nptel_course text,
  nptel_module text,
  year_semester text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.curriculum_mappings enable row level security;

create policy "Curriculum mappings readable by all"
  on public.curriculum_mappings for select
  using (true);

-- Seed with default SPPU SE-IT 2019 pattern + NPTEL equivalents
insert into public.curriculum_mappings (topic_slug, sppu_course, sppu_module, nptel_course, nptel_module, year_semester)
values
  ('arrays', 'Data Structures & Algorithms', 'Unit 1: Arrays & Linear DS', 'Programming, Data Structures and Algorithms using Python', 'Week 1-2: Arrays', 'SE-Sem 3'),
  ('strings', 'Data Structures & Algorithms', 'Unit 1: String Operations', 'Programming, Data Structures and Algorithms using Python', 'Week 1: Strings', 'SE-Sem 3'),
  ('hashing', 'Data Structures & Algorithms', 'Unit 4: Hashing & Hash Tables', 'Programming, Data Structures and Algorithms using Python', 'Week 5: Dictionaries', 'SE-Sem 3'),
  ('linked-lists', 'Data Structures & Algorithms', 'Unit 2: Linked Lists', 'Programming, Data Structures and Algorithms using Python', 'Week 3: Linked Lists', 'SE-Sem 3'),
  ('stacks', 'Data Structures & Algorithms', 'Unit 3: Stacks & Queues', 'Programming, Data Structures and Algorithms using Python', 'Week 3: Stacks', 'SE-Sem 3'),
  ('queues', 'Data Structures & Algorithms', 'Unit 3: Stacks & Queues', 'Programming, Data Structures and Algorithms using Python', 'Week 4: Queues', 'SE-Sem 3'),
  ('trees', 'Data Structures & Algorithms', 'Unit 5: Trees', 'Programming, Data Structures and Algorithms using Python', 'Week 6: Trees', 'SE-Sem 3'),
  ('bst', 'Data Structures & Algorithms', 'Unit 5: Binary Search Trees', 'Programming, Data Structures and Algorithms using Python', 'Week 6: BST', 'SE-Sem 3'),
  ('heaps', 'Data Structures & Algorithms', 'Unit 6: Heaps', 'Programming, Data Structures and Algorithms using Python', 'Week 7: Heaps', 'SE-Sem 3'),
  ('graphs', 'Data Structures & Algorithms', 'Unit 6: Graphs', 'Data Structures and Algorithms', 'Week 8-10: Graphs', 'TE-Sem 5'),
  ('sorting', 'Data Structures & Algorithms', 'Unit 2: Sorting Algorithms', 'Programming, Data Structures and Algorithms using Python', 'Week 4-5: Sorting', 'SE-Sem 3'),
  ('binary-search', 'Data Structures & Algorithms', 'Unit 2: Searching', 'Programming, Data Structures and Algorithms using Python', 'Week 4: Binary Search', 'SE-Sem 3'),
  ('recursion', 'Data Structures & Algorithms', 'Unit 1: Recursion', 'Programming, Data Structures and Algorithms using Python', 'Week 3: Recursion', 'SE-Sem 3'),
  ('dp', 'Design & Analysis of Algorithms', 'Unit 3: Dynamic Programming', 'Design and Analysis of Algorithms', 'Week 5-6: DP', 'TE-Sem 5'),
  ('greedy', 'Design & Analysis of Algorithms', 'Unit 2: Greedy Algorithms', 'Design and Analysis of Algorithms', 'Week 3-4: Greedy', 'TE-Sem 5'),
  ('backtracking', 'Design & Analysis of Algorithms', 'Unit 4: Backtracking', 'Design and Analysis of Algorithms', 'Week 7: Backtracking', 'TE-Sem 5'),
  ('two-pointers', 'Data Structures & Algorithms', 'Unit 1: Array Techniques', 'Programming, Data Structures and Algorithms using Python', 'Week 2: Two-pointer', 'SE-Sem 3'),
  ('sliding-window', 'Data Structures & Algorithms', 'Unit 1: Array Techniques', 'Programming, Data Structures and Algorithms using Python', 'Week 2: Sliding Window', 'SE-Sem 3'),
  ('bit-manipulation', 'Computer Organization & Architecture', 'Unit 2: Bitwise Operations', 'Digital Circuits', 'Week 2: Boolean Algebra', 'SE-Sem 4'),
  ('complexity', 'Data Structures & Algorithms', 'Unit 1: Algorithm Analysis', 'Design and Analysis of Algorithms', 'Week 1: Asymptotic Analysis', 'SE-Sem 3')
on conflict (topic_slug) do nothing;
