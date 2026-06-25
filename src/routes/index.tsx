import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TPO Assistant" },
      { name: "description", content: "Browse companies and submit TPO applications faster." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 px-6 py-32 text-center">
        <h1 className="text-5xl font-bold tracking-tight">TPO Assistant</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Browse companies, fill dynamic application forms, and submit through the TPO portal —
          all from one clean dashboard.
        </p>
        <div className="flex gap-3">
          <Link
            to={hasSession ? "/dashboard" : "/auth"}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {hasSession ? "Open dashboard" : "Get started"}
          </Link>
          <a
            href="https://tpo.vierp.in"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-input px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Visit TPO portal
          </a>
        </div>
      </div>
    </div>
  );
}
