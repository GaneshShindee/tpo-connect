import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Calendar, Briefcase, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicApplicationForm } from "@/components/application/DynamicApplicationForm";
import { ApplicationReview } from "@/components/application/ApplicationReview";
import { ApplicationSuccess } from "@/components/application/ApplicationSuccess";
import { ApplicationError } from "@/components/application/ApplicationError";
import { useCompanyOffering } from "@/hooks/useCompanyOffering";
import { useApplyCompany } from "@/hooks/useApplyCompany";
import { addHistory } from "@/lib/tpo/credentials";
import type { ApplicationAnswers, CompanyOffering } from "@/types/application";

const searchSchema = z.object({ apply: z.coerce.number().optional() });

export const Route = createFileRoute("/companies/$offeringId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Company details — TPO Assistant" }] }),
  component: CompanyOfferingPage,
});

type Stage = "details" | "form" | "review" | "result";

function CompanyOfferingPage() {
  const { offeringId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const offering = Number(offeringId);

  const offeringQ = useCompanyOffering(offering);
  const applyM = useApplyCompany();

  const data = offeringQ.data;

  const [stage, setStage] = useState<Stage>("details");
  const [answers, setAnswers] = useState<ApplicationAnswers>({});
  const [cvFileId, setCvFileId] = useState("");
  const [result, setResult] = useState<{ response: unknown; timestamp: number } | null>(null);

  // Auto-jump to form if ?apply=1
  useEffect(() => {
    if (search.apply && data && stage === "details") setStage("form");
  }, [search.apply, data, stage]);

  // Auto-pick first resume when offering loads
  useEffect(() => {
    if (data?.resumes.length && !cvFileId) setCvFileId(String(data.resumes[0].id));
  }, [data, cvFileId]);

  function setAnswer(id: number, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function validate(o: CompanyOffering): string | null {
    if (o.isCvRequired && !cvFileId.trim()) return "Please select or enter a resume.";
    for (const q of o.questions) {
      if (!(answers[q.id]?.trim())) return `"${q.question}" is required.`;
    }
    return null;
  }

  async function submit() {
    if (!data) return;
    try {
      const response = await applyM.mutateAsync({
        companyOfferingId: data.id,
        cvFileId: data.isCvRequired ? cvFileId : null,
        questions: data.questions,
        answers,
      });
      const timestamp = Date.now();
      setResult({ response, timestamp });
      addHistory({
        id: `${data.id}-${timestamp}`,
        companyName: data.companyName,
        companyOfferingId: data.id,
        timestamp,
        answers: data.questions.map((q) => ({ id: q.id, question: q.question, answer: answers[q.id] ?? "" })),
        cvFile: Number(cvFileId) || null,
        status: "success",
        response,
      });
      toast.success("Application submitted");
      setStage("result");
    } catch (err) {
      const message = (err as Error).message;
      addHistory({
        id: `${data.id}-${Date.now()}`,
        companyName: data.companyName,
        companyOfferingId: data.id,
        timestamp: Date.now(),
        answers: data.questions.map((q) => ({ id: q.id, question: q.question, answer: answers[q.id] ?? "" })),
        cvFile: Number(cvFileId) || null,
        status: "failure",
        response: { error: message },
      });
      toast.error("Submission failed", { description: message });
    }
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/companies"><ArrowLeft className="mr-1 size-4" />Back to companies</Link>
        </Button>
      </div>

      {offeringQ.isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading company information…
        </div>
      )}

      {offeringQ.isError && (
        <ApplicationError
          title="Couldn't load company details"
          message={(offeringQ.error as Error).message}
          onRetry={() => offeringQ.refetch()}
          onBack={() => navigate({ to: "/companies" })}
        />
      )}

      {data && (
        <div className="space-y-4">
          <CompanySummary offering={data} />

          {data.instructions.length > 0 && stage !== "result" && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">Instructions</CardTitle>
                <CardDescription>Please read carefully before applying.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  {data.instructions.map((i, idx) => <li key={idx}>{i}</li>)}
                </ol>
              </CardContent>
            </Card>
          )}

          {data.criteria.length > 0 && stage === "details" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Eligibility criteria</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Criteria</th>
                      <th className="px-3 py-2 font-medium">Requirement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.criteria.map((c, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{c.label}</td>
                        <td className="px-3 py-2">{c.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {stage === "details" && (
            <div className="flex justify-end">
              <Button onClick={() => setStage("form")}>Apply now</Button>
            </div>
          )}

          {stage === "form" && (
            <DynamicApplicationForm
              offering={data}
              answers={answers}
              cvFileId={cvFileId}
              onAnswerChange={setAnswer}
              onCvChange={setCvFileId}
              onBack={() => setStage("details")}
              onContinue={() => {
                const err = validate(data);
                if (err) toast.error(err);
                else setStage("review");
              }}
              disabled={applyM.isPending}
            />
          )}

          {stage === "review" && (
            <ApplicationReview
              offering={data}
              answers={answers}
              cvFileId={cvFileId}
              onEdit={() => setStage("form")}
              onSubmit={submit}
              submitting={applyM.isPending}
            />
          )}

          {stage === "result" && result && (
            <ApplicationSuccess
              companyName={data.companyName}
              timestamp={result.timestamp}
              response={result.response}
              onBack={() => navigate({ to: "/companies" })}
              onHistory={() => navigate({ to: "/history" })}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}

function CompanySummary({ offering }: { offering: CompanyOffering }) {
  const chips = useMemo(() => {
    const items: { icon: typeof Briefcase; label: string }[] = [];
    if (offering.package) items.push({ icon: Briefcase, label: offering.package });
    if (offering.placementType) items.push({ icon: Briefcase, label: offering.placementType });
    if (offering.locations.length) items.push({ icon: MapPin, label: offering.locations.join(", ") });
    if (offering.registrationDeadline) items.push({ icon: Calendar, label: `Deadline: ${offering.registrationDeadline}` });
    return items;
  }, [offering]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{offering.companyName}</CardTitle>
        {offering.hiringProcess && <CardDescription>{offering.hiringProcess}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                <c.icon className="size-3.5" />
                {c.label}
              </Badge>
            ))}
          </div>
        )}
        {(offering.degrees.length > 0 || offering.programs.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {offering.degrees.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium"><GraduationCap className="size-4" /> Degrees</p>
                <div className="flex flex-wrap gap-1.5">
                  {offering.degrees.map((d) => <Badge key={d} variant="outline">{d}</Badge>)}
                </div>
              </div>
            )}
            {offering.programs.length > 0 && (
              <div>
                <p className="mb-1 font-medium">Programs</p>
                <div className="flex flex-wrap gap-1.5">
                  {offering.programs.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}