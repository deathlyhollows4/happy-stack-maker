import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/explore/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/blog/$slug", params: { slug: params.slug } });
  },
});
