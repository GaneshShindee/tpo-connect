import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listApplications } from "@/lib/tpo.functions";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History · TPO Assistant" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const fn = useServerFn(listApplications);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fn().then(setItems).finally(() => setLoading(false)); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Application history</h1>
      {loading && <div className="text-muted-foreground">Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">No applications yet.</div>
      )}
      <div className="space-y-2">
        {items.map((a) => (
          <details key={a.id} className="rounded-lg border bg-card p-4">
            <summary className="cursor-pointer">
              <span className="font-medium">{a.company_name || `Offering ${a.company_offering_id}`}</span>
              <span className={`ml-3 rounded px-2 py-0.5 text-xs ${a.status === "submitted" ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-destructive/15 text-destructive"}`}>{a.status}</span>
              <span className="ml-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
            </summary>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="font-medium">Answers</div>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-background p-2 text-xs">{JSON.stringify(a.answers, null, 2)}</pre>
              </div>
              <div>
                <div className="font-medium">TPO response</div>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-background p-2 text-xs">{JSON.stringify(a.tpo_response, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
