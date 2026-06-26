import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearCredentials, getCredentials, saveCredentials } from "@/lib/tpo/credentials";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — TPO Assistant" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [uid, setUid] = useState("");
  const [tenant, setTenant] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const c = getCredentials();
    if (c) {
      setToken(c.token);
      setUid(c.uid);
      setTenant(c.tenant);
      setSavedAt(c.savedAt);
    }
  }, []);

  function save() {
    if (!token.trim() || !uid.trim() || !tenant.trim()) {
      toast.error("All fields are required");
      return;
    }
    saveCredentials({ token: token.trim(), uid: uid.trim(), tenant: tenant.trim() });
    setSavedAt(Date.now());
    toast.success("Credentials updated");
  }

  function logout() {
    clearCredentials();
    toast.success("Logged out");
    navigate({ to: "/login" });
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session credentials</CardTitle>
            <CardDescription>
              Update your EPS session values. Saved locally in your browser only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>EPS Token</Label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>EPS UID</Label>
              <Input value={uid} onChange={(e) => setUid(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>EPS Tenant</Label>
              <Input value={tenant} onChange={(e) => setTenant(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save}>Save</Button>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Session status</CardTitle>
            <CardDescription>Information about your active TPO session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Status:</span> <span className="font-medium text-green-500">Active</span></p>
            <p><span className="text-muted-foreground">Started:</span> {savedAt ? new Date(savedAt).toLocaleString() : "—"}</p>
            <p className="text-xs text-muted-foreground">
              The TPO server controls token expiry. If requests start failing, refresh your token from the portal and update it here.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}