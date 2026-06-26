import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { ApplicationAnswers, CompanyOffering, ResumeOption } from "@/types/application";

type Props = {
  offering: CompanyOffering;
  answers: ApplicationAnswers;
  cvFileId: string;
  onEdit: () => void;
  onSubmit: () => void;
  submitting: boolean;
};

function resumeLabel(resumes: ResumeOption[], id: string) {
  if (!id) return "—";
  const match = resumes.find((r) => String(r.id) === id);
  return match ? `${match.name} (#${match.id})` : `#${id}`;
}

export function ApplicationReview({ offering, answers, cvFileId, onEdit, onSubmit, submitting }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review your application</CardTitle>
        <CardDescription>Verify everything before submitting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 text-sm space-y-1">
          <p><span className="text-muted-foreground">Company:</span> <span className="font-medium">{offering.companyName}</span></p>
          <p><span className="text-muted-foreground">Offering ID:</span> {offering.id}</p>
          {offering.isCvRequired && (
            <p><span className="text-muted-foreground">Selected resume:</span> {resumeLabel(offering.resumes, cvFileId)}</p>
          )}
        </div>

        {offering.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No additional questions to confirm.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {offering.questions.map((q) => (
              <li key={q.id} className="p-3 text-sm">
                <p className="text-muted-foreground">{q.question}</p>
                <p className="mt-0.5 font-medium whitespace-pre-wrap">
                  {answers[q.id]?.trim() ? answers[q.id] : <span className="text-muted-foreground">(empty)</span>}
                </p>
              </li>
            ))}
          </ul>
        )}

        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(c === true)} />
          <span>I confirm the information above is accurate and want to submit this application.</span>
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onEdit} disabled={submitting}>Edit</Button>
          <Button onClick={onSubmit} disabled={submitting || !confirmed}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Submit application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}