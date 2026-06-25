import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn as useFn } from "@tanstack/react-start";
import { getMyCredentials, saveCredentials } from "@/lib/tpo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · TPO Assistant" }] }),
  component: SettingsPage,
});

const DEFAULTS = {
  api_base: "https://tpoapi.vierp.in",
  companies_path: "/company-offering/get-all-active-companies",
  company_detail_path: "/company-offering/get-company-by-id",
  apply_path: "/student-companyoffering/apply-to-company",
};

function SettingsPage() {
  const fetchCreds = useFn(getMyCredentials);
  const save = useFn(saveCredentials);
  const [form, setForm] = useState<any>({
    eps_token: "",
    eps_uid: "",
    eps_tenant: "",
    eps_userid_token: "",
    cv_file_id: "",
    ...DEFAULTS,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCreds().then((c) => { if (c) setForm({ ...form, ...c }); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(k: string, v: string) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("Saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  const fields: Array<[string, string, string?]> = [
    ["eps_token", "EPS-token", "Required. From DevTools → Network → any TPO request → Headers."],
    ["eps_uid", "EPS-uid", "Required."],
    ["eps_tenant", "EPS-tenant", "Required."],
    ["eps_userid_token", "EPS-userid-token", "Optional, but needed by some endpoints."],
    ["cv_file_id", "Default CV file id", "From a prior apply request (e.g. 37925)."],
    ["api_base", "API base URL"],
    ["companies_path", "Companies list path"],
    ["company_detail_path", "Company detail path (id appended)"],
    ["apply_path", "Apply endpoint path"],
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Paste your TPO portal tokens. Open <code>tpo.vierp.in</code>, log in, open DevTools →
          Network → click any request → copy the EPS-* headers.
        </p>
      </div>
      <form onSubmit={onSave} className="space-y-4 rounded-lg border bg-card p-6">
        {fields.map(([key, label, hint]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              value={form[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              required={["eps_token", "eps_uid", "eps_tenant", "api_base", "companies_path", "company_detail_path", "apply_path"].includes(key)}
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        ))}
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
      </form>
    </div>
  );
}
