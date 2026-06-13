import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/learn")({
  component: LearnLayout,
});

function LearnLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="learn" />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
