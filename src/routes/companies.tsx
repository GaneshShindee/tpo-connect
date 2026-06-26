import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchCompanies } from "@/lib/tpo/api";
import { extractCompanies, type CompanyRow } from "@/lib/tpo/normalize";
import { Search, LayoutGrid, Table as TableIcon, ArrowRight, Loader2, RefreshCw, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/companies")({
  head: () => ({ meta: [{ title: "Companies — TPO Assistant" }] }),
  component: CompaniesPage,
});

type SortKey = "name" | "deadline" | "package";

function CompaniesPage() {
  const q = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies, staleTime: 60_000 });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const pageSize = view === "cards" ? 12 : 20;

  const all = useMemo(() => extractCompanies(q.data), [q.data]);
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = all.filter((c) =>
      !s
        ? true
        : c.name.toLowerCase().includes(s) ||
          (c.package?.toLowerCase().includes(s) ?? false) ||
          (c.eligibility?.toLowerCase().includes(s) ?? false),
    );
    list = [...list].sort((a, b) => {
      const av = (a[sort] ?? "") as string;
      const bv = (b[sort] ?? "") as string;
      return String(av).localeCompare(String(bv));
    });
    return list;
  }, [all, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            {q.isLoading ? "Loading…" : `${filtered.length} of ${all.length} visible`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={`mr-1.5 size-4 ${q.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex rounded-md border p-0.5">
            <Button
              size="sm"
              variant={view === "cards" ? "secondary" : "ghost"}
              onClick={() => setView("cards")}
              className="h-7 px-2"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "secondary" : "ghost"}
              onClick={() => setView("table")}
              className="h-7 px-2"
            >
              <TableIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by company, package, eligibility…"
            className="pl-8"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="name">Sort: Name</option>
          <option value="deadline">Sort: Deadline</option>
          <option value="package">Sort: Package</option>
        </select>
      </div>

      {q.isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading companies…
        </div>
      )}
      {q.isError && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="font-medium">Couldn't load companies</p>
              <p className="text-muted-foreground">{(q.error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!q.isLoading && !q.isError && pageItems.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">No companies match your filters.</p>
      )}

      {view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((c) => <CompanyCard key={c.id} c={c} />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Package</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.package ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.deadline ?? "—"}</td>
                  <td className="px-3 py-2">{c.status ? <Badge variant="secondary">{c.status}</Badge> : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/companies/$offeringId" params={{ offeringId: String(c.id) }}>
                        Details <ArrowRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </AppShell>
  );
}

function CompanyCard({ c }: { c: CompanyRow }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{c.name}</h3>
          {c.status && <Badge variant="secondary" className="shrink-0">{c.status}</Badge>}
        </div>
        <dl className="space-y-1 text-xs text-muted-foreground">
          {c.package && <Row k="Package" v={c.package} />}
          {c.deadline && <Row k="Deadline" v={c.deadline} />}
          {c.eligibility && <Row k="Eligibility" v={c.eligibility} />}
        </dl>
        <div className="mt-auto flex gap-2 pt-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to="/companies/$offeringId" params={{ offeringId: String(c.id) }}>View details</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link to="/companies/$offeringId" params={{ offeringId: String(c.id) }} search={{ apply: 1 }}>Apply</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="shrink-0">{k}</dt>
      <dd className="truncate text-right text-foreground">{v}</dd>
    </div>
  );
}