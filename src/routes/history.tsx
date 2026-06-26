import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clearHistory, getHistory, type HistoryEntry } from "@/lib/tpo/credentials";
import { Download, Search, Trash2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Application history — TPO Assistant" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "success" | "failure">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => setItems(getHistory()), []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || i.status === filter) &&
        (!s ||
          i.companyName.toLowerCase().includes(s) ||
          i.answers.some((a) => a.answer.toLowerCase().includes(s))),
    );
  }, [items, search, filter]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tpo-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (!confirm("Clear all application history? This cannot be undone.")) return;
    clearHistory();
    setItems([]);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application history</h1>
          <p className="text-sm text-muted-foreground">{items.length} entries stored locally.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportJson} disabled={items.length === 0}>
            <Download className="mr-1.5 size-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={items.length === 0}>
            <Trash2 className="mr-1.5 size-4" /> Clear
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or answer text…"
            className="pl-8"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No entries.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{e.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.timestamp).toLocaleString()} · Offering #{e.companyOfferingId} · CV {e.cvFile ?? "—"}
                    </p>
                  </div>
                  <Badge variant={e.status === "success" ? "secondary" : "destructive"}>{e.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                    {expanded === e.id ? "Hide" : "View"} answers
                  </Button>
                  {e.status === "failure" && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/companies/$offeringId" params={{ offeringId: String(e.companyOfferingId) }} search={{ apply: 1 }}>
                        <RotateCcw className="mr-1 size-3.5" /> Retry
                      </Link>
                    </Button>
                  )}
                </div>
                {expanded === e.id && (
                  <div className="mt-3 space-y-2 rounded-md border p-3 text-sm">
                    {e.answers.map((a) => (
                      <div key={a.id}>
                        <p className="text-xs text-muted-foreground">{a.question}</p>
                        <p className="whitespace-pre-wrap">{a.answer || <span className="text-muted-foreground">(empty)</span>}</p>
                      </div>
                    ))}
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">API response</summary>
                      <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted/40 p-2 text-xs">{JSON.stringify(e.response, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}