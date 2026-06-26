import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { loginValidate } from "@/lib/tpo/api";
import { getCredentials, saveCredentials, saveStudent } from "@/lib/tpo/credentials";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — TPO Assistant" },
      { name: "description", content: "Sign in to your TPO Assistant session." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [uid, setUid] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = getCredentials();
    if (c) {
      setToken(c.token);
      setUid(c.uid);
      setTenant(c.tenant);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim() || !uid.trim() || !tenant.trim()) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    saveCredentials({ token: token.trim(), uid: uid.trim(), tenant: tenant.trim() });
    try {
      const data = await loginValidate();
      saveStudent(data);
      toast.success("Signed in");
      navigate({ to: "/companies" });
    } catch (err) {
      toast.error("Login failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">T</span>
          </div>
          <CardTitle>TPO Assistant</CardTitle>
          <CardDescription>
            Enter your EPS session credentials to access your placement portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token">EPS Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EPS-token value"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uid">EPS UID</Label>
              <Input
                id="uid"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="EPS-uid value"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenant">EPS Tenant</Label>
              <Input
                id="tenant"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="EPS-tenant value"
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign in
            </Button>
            <p className="text-xs text-muted-foreground">
              Credentials are kept only in your browser's local storage for the active session.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}