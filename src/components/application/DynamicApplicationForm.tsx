import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicQuestionField } from "./DynamicQuestion";
import { ResumeSelector } from "./ResumeSelector";
import type { ApplicationAnswers, CompanyOffering } from "@/types/application";

type Props = {
  offering: CompanyOffering;
  answers: ApplicationAnswers;
  cvFileId: string;
  onAnswerChange: (id: number, value: string) => void;
  onCvChange: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  disabled?: boolean;
};

export function DynamicApplicationForm({
  offering,
  answers,
  cvFileId,
  onAnswerChange,
  onCvChange,
  onBack,
  onContinue,
  disabled,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application form</CardTitle>
        <CardDescription>
          {offering.questions.length === 0
            ? "No additional questions for this company."
            : `Answer ${offering.questions.length} question${offering.questions.length === 1 ? "" : "s"} below.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {offering.isCvRequired && (
          <ResumeSelector
            resumes={offering.resumes}
            required
            value={cvFileId}
            onChange={onCvChange}
            disabled={disabled}
          />
        )}

        {offering.questions.map((q) => (
          <DynamicQuestionField
            key={q.id}
            question={q}
            value={answers[q.id] ?? ""}
            onChange={(v) => onAnswerChange(q.id, v)}
            disabled={disabled}
          />
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onBack} disabled={disabled}>
            Back
          </Button>
          <Button onClick={onContinue} disabled={disabled}>
            Review application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}