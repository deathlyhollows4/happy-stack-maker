import { Link } from "@tanstack/react-router";

const groups = [
  {
    title: "Product",
    links: [
      { to: "/", label: "Home" },
      { to: "/review", label: "Review Code" },
      { to: "/practice", label: "Practice" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: "/learn", label: "Topics" },
      { to: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/refunds", label: "Refunds" },
      { to: "/privacy", label: "Privacy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="space-y-8 border-t border-border/60 py-10 text-center">
      <div className="mx-auto grid max-w-4xl gap-8 px-6 text-left sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-foreground">
              {group.title}
            </h2>
            <div className="mt-3 flex flex-col gap-2 font-mono text-[11px] text-muted-foreground">
              {group.links.map((link) => (
                <Link key={link.to + link.label} to={link.to as any} className="hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        CodeWise - AI code review for CS students.
      </p>
    </footer>
  );
}
