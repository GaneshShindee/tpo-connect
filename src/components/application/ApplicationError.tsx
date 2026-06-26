import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
};

export function ApplicationError({ title = "Something went wrong", message, onRetry, onBack }: Props) {
  const friendly = humanizeError(message);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{friendly}</p>
        <details className="rounded-md border bg-muted/40 p-2 text-xs">
          <summary className="cursor-pointer">Technical details</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{message}</pre>
        </details>
        <div className="flex justify-end gap-2">
          {onBack && <Button variant="outline" onClick={onBack}>Back</Button>}
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 size-4" /> Try again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function humanizeError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("401") || m.includes("unauthor") || m.includes("token")) {
    return "Your TPO session looks expired. Please re-enter your session credentials on the login screen.";
  }
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("502")) {
    return "We couldn't reach the TPO server. Check your connection and try again.";
  }
  if (m.includes("cv") || m.includes("resume")) {
    return "The TPO server rejected the selected resume. Pick a different resume or upload a new one in the TPO portal.";
  }
  return "The TPO server rejected the request. Review the technical details below for the exact error.";
}