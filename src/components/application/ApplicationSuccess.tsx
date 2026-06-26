import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type Props = {
  companyName: string;
  timestamp: number;
  response: unknown;
  onBack: () => void;
  onHistory: () => void;
};

export function ApplicationSuccess({ companyName, timestamp, response, onBack, onHistory }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-green-500" />
          <CardTitle>Successfully applied</CardTitle>
        </div>
        <CardDescription>{new Date(timestamp).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border p-3 text-sm">
          <p><span className="text-muted-foreground">Company:</span> <span className="font-medium">{companyName}</span></p>
          <p><span className="text-muted-foreground">Applied at:</span> {new Date(timestamp).toLocaleString()}</p>
        </div>
        <details className="rounded-md border bg-muted/40 p-3 text-xs">
          <summary className="cursor-pointer text-sm font-medium">Server response</summary>
          <pre className="mt-2 max-h-72 overflow-auto">{JSON.stringify(response, null, 2)}</pre>
        </details>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack}>Back to companies</Button>
          <Button onClick={onHistory}>View history</Button>
        </div>
      </CardContent>
    </Card>
  );
}