import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchCompanies } from "@/lib/tpo.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Companies · TPO Assistant" }] }),
  component: Dashboard,
});

function findArray(obj: any): any[] {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== "object") return [];
  for (const k of ["data", "result", "rows", "companies", "list", "records"]) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) return v as any[];
    if (v && typeof v === "object") {
      const inner = findArray(v);
      if (inner.length) return inner;
    }
  }
  return [];
}

function pickName(c: any): string {
  return c.companyName || c.name || c.company || c.title || c.company_name || `Company ${c.id ?? ""}`;
}
function pickId(c: any): string | number | undefined {
  return c.id ?? c.companyOfferingId ?? c.company_offering_id ?? c.offeringId ?? c._id;
}

function Dashboard() {
  const fetchFn = useServerFn(fetchCompanies);
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetchFn({ data: {} });
      setRaw(res);
      if (!res.ok) setError(`TPO API returned ${res.status}`);
    } catch (err: any) {
      setError(err.message ?? "Failed");
      if (err.message?.includes("NO_CREDENTIALS")) toast.error("Set your TPO tokens in Settings first.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const items = useMemo(() => findArray(raw?.data), [raw]);
  const filtered = useMemo(
    () => items.filter((c) => pickName(c).toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">{items.length} found · pulled from your TPO account</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}. Check your tokens and the companies-list path in <Link to="/settings" className="underline">Settings</Link>.
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          No companies parsed from the response. The endpoint path or response shape may differ. Raw response:
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-background p-2 text-xs">{JSON.stringify(raw?.data, null, 2)}</pre>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => {
          const id = pickId(c);
          return (
            <Link
              key={id ?? i}
              to="/companies/$id"
              params={{ id: String(id ?? i) }}
              className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="font-medium">{pickName(c)}</div>
              <div className="mt-1 text-xs text-muted-foreground">ID: {String(id ?? "?")}</div>
              {c.profile && <div className="mt-2 text-sm">{c.profile}</div>}
              {c.ctc && <div className="mt-1 text-xs">CTC: {c.ctc}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
