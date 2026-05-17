// Blog post type — shared between admin and public explore routes.
// Post content is now stored in the `blog_posts` database table.
// Use server functions from codewise.functions.ts to read/write posts.

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  body: string[];
  tags: string[];
  readTime: number;
}
