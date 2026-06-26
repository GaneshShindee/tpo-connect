import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { DynamicQuestion as DQ } from "@/types/application";

type Props = {
  question: DQ;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function DynamicQuestionField({ question, value, onChange, disabled }: Props) {
  const useTextarea = (question.question?.length ?? 0) > 60 || /address|describe|explain|why|link|url/i.test(question.question);
  const id = `q-${question.id}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{question.question}</Label>
      {useTextarea ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}