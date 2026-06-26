import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResumeOption } from "@/types/application";

type Props = {
  resumes: ResumeOption[];
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ResumeSelector({ resumes, required, value, onChange, disabled }: Props) {
  if (resumes.length > 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="resume">
          Select Resume {required && <span className="text-destructive">*</span>}
        </Label>
        <select
          id="resume"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Choose a resume —</option>
          {resumes.map((r) => (
            <option key={String(r.id)} value={String(r.id)}>
              {r.name} (#{r.id})
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor="resume">
        Resume / CV file ID {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id="resume"
        placeholder="Enter your stored CV file ID (e.g. 37925)"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        No resumes were returned by the TPO API; paste your CV file ID to proceed.
      </p>
    </div>
  );
}