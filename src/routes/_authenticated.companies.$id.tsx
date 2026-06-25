import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchCompanyDetail, submitApplication } from "@/lib/tpo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  head: () => ({ meta: [{ title: "Company · TPO Assistant" }] }),
  component: CompanyDetail,
});

function findQuestions(obj: any): any[] {
  if (!obj) return [];
  if (Array.isArray(obj)) {
    if (obj.length && (obj[0]?.question || obj[0]?.questionText || obj[0]?.descrQuestion)) return obj;
  }
  if (typeof obj !== "object") return [];
  for (const k of ["questions", "applicationQuestions", "companyQuestions", "questionList"]) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  for (const v of Object.values(obj)) {
    const r = findQuestions(v);
    if (r.length) return r;
  }
  return [];
}
function pickQuestionText(q: any): string {
  return q.question || q.questionText || q.descrQuestion || q.text || q.label || `Question ${q.id ?? ""}`;
}
function pickCompanyName(obj: any): string {
  if (!obj || typeof obj !== "object") return "Company";
  return (
    obj.companyName || obj.name || obj.company ||
    (obj.data && (obj.data.companyName || obj.data.name || obj.data.company)) ||
    "Company"
  );
}

function CompanyDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const fetchDetail = useServerFn(fetchCompanyDetail);
  const apply = useServerFn(submitApplication);
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cvOverride, setCvOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetchDetail({ data: { id } });
        setRaw(res);
        if (!res.ok) setError(`TPO API returned ${res.status}`);
      } catch (err: any) { setError(err.message ?? "Failed"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const questions = useMemo(() => findQuestions(raw?.data), [raw]);
  const companyName = useMemo(() => pickCompanyName(raw?.data), [raw]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        companyOfferingId: id,
        companyName,
        size: questions.length,
        cvFile: cvOverride || undefined,
        answers: questions.map((q) => ({ id: q.id, answer: answers[String(q.id)] ?? "" })),
      };
      const res = await apply({ data: payload });
      if (res.ok) {
        toast.success("Application submitted");
        nav({ to: "/history" });
      } else {
        toast.error(`Submission failed (HTTP ${res.status})`);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{companyName}</h1>
        <p className="text-sm text-muted-foreground">Offering ID: {id}</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-5 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Application form</h2>
        {questions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No application questions parsed for this company.
            <details className="mt-2">
              <summary className="cursor-pointer">Show raw response</summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded bg-background p-2 text-xs">{JSON.stringify(raw?.data, null, 2)}</pre>
            </details>
          </div>
        ) : (
          <>
            {questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label htmlFor={`q-${q.id}`}>{pickQuestionText(q)}</Label>
                <Textarea
                  id={`q-${q.id}`}
                  value={answers[String(q.id)] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [String(q.id)]: e.target.value }))}
                  required
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="cv">Override CV file id (optional)</Label>
              <Input id="cv" value={cvOverride} onChange={(e) => setCvOverride(e.target.value)} placeholder="Uses default from Settings" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
