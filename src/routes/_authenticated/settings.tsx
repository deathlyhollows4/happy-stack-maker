import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateDisplayName, getProfile, deleteAccount } from "@/lib/account.functions";
import { getUserConsent, setUserConsent } from "@/lib/codewise.functions";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/hooks/use-theme";
import { ArrowLeft, Save, KeyRound, Trash2, Download, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings | CodeWise" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const nav = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const updateNameFn = useServerFn(updateDisplayName);
  const deleteFn = useServerFn(deleteAccount);

  const { data: profileData, refetch } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: () => getProfileFn(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  useEffect(() => {
    if (profileData?.profile?.display_name) setName(profileData.profile.display_name);
  }, [profileData]);

  const [password, setPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [savingConsent, setSavingConsent] = useState(false);
  const getConsentFn = useServerFn(getUserConsent);
  const setConsentFn = useServerFn(setUserConsent);
  const { theme } = useTheme();

  useEffect(() => {
    getConsentFn()
      .then((r: any) => setConsentGiven(r?.consent?.consent_given ?? null))
      .catch(() => setConsentGiven(null));
  }, [getConsentFn]);

  const toggleConsent = async (given: boolean) => {
    setSavingConsent(true);
    try {
      const r = await setConsentFn({ data: { consent_given: given } });
      if (r.ok) {
        setConsentGiven(given);
        toast.success(given ? "Research consent enabled" : "Research consent disabled");
      } else toast.error(r.error);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingConsent(false);
    }
  };

  const saveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const r = await updateNameFn({ data: { displayName: name.trim() } });
      if (r.ok) {
        toast.success("Name updated");
        refetch();
      } else toast.error(r.error);
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) toast.error(error.message);
      else {
        toast.success("Password changed");
        setPassword("");
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const onDelete = async () => {
    if (confirmDelete !== "DELETE") {
      toast.error("Type DELETE to confirm.");
      return;
    }
    setDeleting(true);
    try {
      const r = await deleteFn();
      if (!r.ok) {
        toast.error(r.error);
        setDeleting(false);
        return;
      }
      await supabase.auth.signOut();
      toast.success("Account deleted");
      nav({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </Link>

      <h1 className="font-display text-5xl tracking-tight mb-1">Settings</h1>
      <p className="text-muted-foreground mb-10">Manage your account and preferences.</p>

      <div className="space-y-8">
        {/* Profile */}
        <Section title="Profile" desc="Your name as shown across the app.">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
              placeholder="Your name"
            />
            <button
              onClick={saveName}
              disabled={savingName || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="size-4" />
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" desc="Change your password.">
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
            />
            <button
              onClick={savePassword}
              disabled={savingPwd || !password}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <KeyRound className="size-4" />
              {savingPwd ? "Updating…" : "Update"}
            </button>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" desc="Pick a theme. Persists across reloads.">
          <ThemeToggle />
          {theme === "light" && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
              Light mode is in beta. Some elements may need polish.
            </p>
          )}
        </Section>

        {/* Data + Billing links */}
        <Section title="Data & Billing">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/settings/export"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/10"
            >
              <Download className="size-4" /> Export my data
            </Link>
            <Link
              to="/billing"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/10"
            >
              <CreditCard className="size-4" /> Billing
            </Link>
          </div>
        </Section>

        {/* Research consent */}
        <Section
          title="Research"
          desc="CodeWise is part of an academic study. Allow anonymous usage data collection to support research in AI-assisted CS education."
        >
          {consentGiven === null ? (
            <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleConsent(true)}
                disabled={savingConsent}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  consentGiven
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent/10"
                } disabled:opacity-50`}
              >
                {consentGiven ? "Enabled" : "Disabled"}
              </button>
              {consentGiven ? (
                <button
                  onClick={() => toggleConsent(false)}
                  disabled={savingConsent}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
                >
                  Opt out
                </button>
              ) : (
                <button
                  onClick={() => toggleConsent(true)}
                  disabled={savingConsent}
                  className="text-sm text-accent hover:underline underline-offset-4 disabled:opacity-50"
                >
                  Opt in
                </button>
              )}
            </div>
          )}
        </Section>

        {/* Danger */}
        <Section
          title="Danger zone"
          desc="Permanently delete your account, submissions, progress, and subscription record. This cannot be undone."
          tone="danger"
        >
          <div className="space-y-3">
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full rounded-md border border-destructive/40 bg-input px-3 py-2 text-sm"
            />
            <button
              onClick={onDelete}
              disabled={deleting || confirmDelete !== "DELETE"}
              className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
  tone,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <section
      className={`rounded-lg border p-6 ${
        tone === "danger" ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <h2 className="font-display text-2xl">{title}</h2>
      {desc && <p className="text-sm text-muted-foreground mt-1 mb-4">{desc}</p>}
      <div className={desc ? "" : "mt-4"}>{children}</div>
    </section>
  );
}
