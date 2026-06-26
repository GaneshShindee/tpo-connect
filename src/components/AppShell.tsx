import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Briefcase, LayoutDashboard, History, Settings as SettingsIcon, LogOut, Moon, Sun, Menu, X } from "lucide-react";
import { clearCredentials, getCredentials, getStudent } from "@/lib/tpo/credentials";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Briefcase },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [authChecked, setAuthChecked] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentName, setStudentName] = useState<string>("Student");

  useEffect(() => {
    if (!getCredentials()) {
      navigate({ to: "/login" });
      return;
    }
    const s = getStudent<Record<string, unknown>>();
    if (s) {
      const name = (s.studentName || s.name || s.fullName || s.firstName) as string | undefined;
      if (name) setStudentName(name);
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("tpo.theme");
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setAuthChecked(true);
  }, [navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tpo.theme", next ? "dark" : "light");
  }

  function logout() {
    clearCredentials();
    toast.success("Logged out");
    navigate({ to: "/login" });
  }

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <button
              className="rounded-md p-1.5 hover:bg-accent md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">T</span>
              <span className="hidden sm:inline">TPO Assistant</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
                  activeOptions={{ exact: false }}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted-foreground sm:inline">{studentName}</span>
            <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle theme">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col px-2 py-2">
              {nav.map((n) => {
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
                  >
                    <Icon className="size-4" />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}