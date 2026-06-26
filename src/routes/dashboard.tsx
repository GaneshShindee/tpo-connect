import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCompanies } from "@/lib/tpo/api";
import { getStudent, getHistory, getCredentials } from "@/lib/tpo/credentials";
import { extractCompanies, pickStudentSummary } from "@/lib/tpo/normalize";
import { Briefcase, CheckCircle2, Clock, User } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TPO Assistant" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
    staleTime: 60_000,
  });

  const [historyCount, setHistoryCount] = useState(0);
  const [recent, setRecent] = useState<ReturnType<typeof getHistory>>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const student = pickStudentSummary(getStudent());

  useEffect(() => {
    const h = getHistory();
    setHistoryCount(h.length);
    setRecent(h.slice(0, 5));
    setSavedAt(getCredentials()?.savedAt ?? null);
  }, []);

  const list = extractCompanies(companies.data);
  const total = list.length;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back{student.name ? `, ${student.name}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Here's a snapshot of your placement activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Briefcase className="size-5" />} label="Available companies" value={companies.isLoading ? "…" : total} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="Applications submitted" value={historyCount} />
        <Stat icon={<Clock className="size-5" />} label="Session started" value={savedAt ? new Date(savedAt).toLocaleTimeString() : "—"} />
        <Stat icon={<User className="size-5" />} label="Student" value={student.name ?? "—"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Your latest application submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{r.companyName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "success" ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-destructive/15 text-destructive"}`}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(student.fields).slice(0, 8).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{k}</span>
                <span className="truncate text-right font-medium">{String(v)}</span>
              </div>
            ))}
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/companies">Browse companies</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-accent p-2 text-accent-foreground">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}