import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurriculumMappings, upsertCurriculumMapping, getDashboard } from "@/lib/codewise.functions";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, GraduationCap, Check, Pencil, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/curriculum")({
  head: () => ({ meta: [{ title: "Curriculum Mapping | CodeWise" }] }),
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
  component: CurriculumMapping,
});

function CurriculumMapping() {
  const qc = useQueryClient();
  const mappingsFn = useServerFn(getCurriculumMappings);
  const dashboardFn = useServerFn(getDashboard);
  const upsertFn = useServerFn(upsertCurriculumMapping);

  const { data: mappingsData, isLoading: mappingsLoading } = useQuery({
    queryKey: ["curriculumMappings"],
    queryFn: () => mappingsFn(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardFn(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);

  const isLoading = mappingsLoading || dashboardLoading;
  const mappings = mappingsData?.mappings ?? [];
  const topics = dashboardData?.topics ?? [];

  const mappingBySlug = new Map(mappings.map((m: any) => [m.topic_slug, m]));

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Access denied</h2>
          <p className="mt-2 text-muted-foreground">Admin privileges required.</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const startEdit = (slug: string) => {
    const row = mappingBySlug.get(slug) ?? {};
    setEditingSlug(slug);
    setEditValues({
      sppu_course: row.sppu_course ?? "",
      sppu_module: row.sppu_module ?? "",
      nptel_course: row.nptel_course ?? "",
      nptel_module: row.nptel_module ?? "",
      year_semester: row.year_semester ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditValues({});
  };

  const saveEdit = async (slug: string) => {
    setSaving(true);
    await upsertFn({
      data: {
        topic_slug: slug,
        sppu_course: editValues.sppu_course || null,
        sppu_module: editValues.sppu_module || null,
        nptel_course: editValues.nptel_course || null,
        nptel_module: editValues.nptel_module || null,
        year_semester: editValues.year_semester || null,
      },
    });
    setSaving(false);
    setEditingSlug(null);
    qc.invalidateQueries({ queryKey: ["curriculumMappings"] });
  };

  const mappedCount = mappings.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Shield className="size-3" /> Admin
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Curriculum Mapping</h1>
          <p className="text-muted-foreground mt-2">
            Align CodeWise topics with SPPU & NPTEL courses. {mappedCount}/{topics.length} topics
            mapped.
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          Back to admin dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal w-32">
                  Topic
                </th>
                <th className="px-4 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  SPPU Course
                </th>
                <th className="px-4 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  SPPU Module
                </th>
                <th className="px-4 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  NPTEL Course
                </th>
                <th className="px-4 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  NPTEL Module
                </th>
                <th className="px-4 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal w-24">
                  Year / Sem
                </th>
                <th className="px-4 py-2 text-center font-mono text-[11px] text-muted-foreground font-normal w-20">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t: any) => {
                const row = mappingBySlug.get(t.slug);
                const isEditing = editingSlug === t.slug;
                return (
                  <tr
                    key={t.slug}
                    className={`border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors ${isEditing ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{t.slug}</div>
                    </td>

                    {isEditing ? (
                      <>
                        <EditableCell
                          value={editValues.sppu_course ?? ""}
                          onChange={(v) => setEditValues({ ...editValues, sppu_course: v })}
                        />
                        <EditableCell
                          value={editValues.sppu_module ?? ""}
                          onChange={(v) => setEditValues({ ...editValues, sppu_module: v })}
                        />
                        <EditableCell
                          value={editValues.nptel_course ?? ""}
                          onChange={(v) => setEditValues({ ...editValues, nptel_course: v })}
                        />
                        <EditableCell
                          value={editValues.nptel_module ?? ""}
                          onChange={(v) => setEditValues({ ...editValues, nptel_module: v })}
                        />
                        <EditableCell
                          value={editValues.year_semester ?? ""}
                          onChange={(v) => setEditValues({ ...editValues, year_semester: v })}
                        />
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => saveEdit(t.slug)}
                              disabled={saving}
                              className="p-1 rounded text-success hover:bg-success/10 transition"
                            >
                              <Check className="size-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <MappingCell value={row?.sppu_course} />
                        <MappingCell value={row?.sppu_module} />
                        <MappingCell value={row?.nptel_course} />
                        <MappingCell value={row?.nptel_module} />
                        <MappingCell value={row?.year_semester} />
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => startEdit(t.slug)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5 flex items-start gap-3">
        <GraduationCap className="size-5 text-accent mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-sm">About this mapping</h3>
          <p className="text-xs text-muted-foreground mt-1">
            SPPU mapping follows the SE-IT 2019 pattern and TE-IT 2019 pattern. NPTEL mappings
            reference active NPTEL/MOOC courses. Edit any row to align topics with your institution's
            curriculum.
          </p>
        </div>
      </div>
    </div>
  );
}

function MappingCell({ value }: { value: string | null | undefined }) {
  return (
    <td className="px-4 py-2.5 text-xs text-muted-foreground">
      {value || <span className="text-muted-foreground/40">&mdash;</span>}
    </td>
  );
}

function EditableCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <td className="px-2 py-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent"
        placeholder="&mdash;"
      />
    </td>
  );
}
