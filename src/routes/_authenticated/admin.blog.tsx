import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listAllBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  type BlogPostRow,
} from "@/lib/codewise.functions";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Plus, Pencil, Trash2, Eye, EyeOff, FileText, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({ meta: [{ title: "Blog Management | CodeWise" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      p_user_id: data.session.user.id,
      p_role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminBlogPage,
});

const EMPTY_FORM = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  tags: "",
  author: "CodeWise",
  published: false,
};

function AdminBlogPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllBlogPostsAdmin);
  const createFn = useServerFn(createBlogPost);
  const updateFn = useServerFn(updateBlogPost);
  const deleteFn = useServerFn(deleteBlogPost);

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminBlogPosts"],
    queryFn: () => listFn(),
    staleTime: 30 * 1000,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId("new");
  };

  const openEdit = (post: BlogPostRow) => {
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body ?? "[]",
      tags: (post.tags ?? []).join(", "),
      author: post.author,
      published: post.published,
    });
    setEditingId(post.id);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body.trim() || "[]",
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: form.author.trim() || "CodeWise",
      published: form.published,
    };

    let r;
    if (editingId === "new") {
      r = await createFn({ data: payload });
    } else {
      r = await updateFn({ data: { ...payload, id: editingId! } });
    }

    if (r.ok) {
      toast.success(editingId === "new" ? "Post created." : "Post updated.");
      closeForm();
      qc.invalidateQueries({ queryKey: ["adminBlogPosts"] });
    } else {
      toast.error(r.error || "Failed to save post.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const r = await deleteFn({ data: { id } });
    if (r.ok) {
      toast.success("Post deleted.");
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ["adminBlogPosts"] });
    } else {
      toast.error(r.error || "Failed to delete post.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Access denied</h2>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const posts = data.posts;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <FileText className="size-3" /> Admin
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">
            Manage blog posts shown on the /explore page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Back to admin
          </Link>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="size-4" /> New post
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editingId !== null && (
        <div className="mb-8 rounded-lg border border-accent/30 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl">
              {editingId === "new" ? "New post" : "Edit post"}
            </h3>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  placeholder="my-post-slug"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Author</label>
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">
                Tags (comma-separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="complexity, beginner, interview-prep"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">
                Body (JSON array of paragraph strings)
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="rounded border-border"
                />
                Published (visible on /explore)
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving…" : "Save post"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Post list */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            All posts ({posts.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  Title
                </th>
                <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  Slug
                </th>
                <th className="px-5 py-2 text-center font-mono text-[11px] text-muted-foreground font-normal">
                  Status
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Created
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post: BlogPostRow) => (
                <tr
                  key={post.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-2.5 font-medium">{post.title}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">
                    {post.slug}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded-sm text-[11px] font-mono ${
                        post.published
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.published ? (
                        <span className="flex items-center gap-1 justify-center">
                          <Eye className="size-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 justify-center">
                          <EyeOff className="size-3" /> Draft
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground text-right">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(post)}
                        className="p-1.5 rounded-md hover:bg-accent/15 text-muted-foreground hover:text-accent"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(post.id)}
                        className="p-1.5 rounded-md hover:bg-danger/15 text-muted-foreground hover:text-danger"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No blog posts yet. Click "New post" to create one.
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-card p-6 max-w-sm mx-4">
            <h3 className="font-display text-lg">Delete post?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. The post will be permanently removed.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:bg-danger/90"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
