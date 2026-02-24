import { createSignal, onMount, Show, Match, Switch } from "solid-js";
import { Toaster } from "@/components/sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import LogUsage from "@/pages/LogUsage";
import UsageHistory from "@/pages/UsageHistory";
import SubmitDeclaration from "@/pages/SubmitDeclaration";
import Classifications from "@/pages/Classifications";
import Alerts from "@/pages/Alerts";

type User = { name: string; email: string; role: string };
type Page = "log" | "history" | "declare" | "classifications" | "alerts";

async function loginRequest(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.message || "Login failed");
  }
  const body = await res.json();
  localStorage.setItem("token", body.token);
  return body.user as User;
}

const NAV_STUDENT: { page: Page; label: string }[] = [
  { page: "log", label: "Log Usage" },
  { page: "history", label: "History" },
  { page: "declare", label: "Declaration" },
];

const NAV_ADMIN: { page: Page; label: string }[] = [
  { page: "classifications", label: "Classifications" },
  { page: "alerts", label: "Alerts" },
];

function App() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [page, setPage] = createSignal<Page>("log");

  onMount(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const u = (await res.json()) as User;
        setUser(u);
        setPage(u.role === "admin" ? "classifications" : "log");
        setLoading(false);
        return;
      }
      localStorage.removeItem("token");
    }

    if (import.meta.env.DEV) {
      try {
        const u = await loginRequest("student@ntnu.no", "password123");
        setUser(u);
      } catch {
        // Seed user doesn't exist yet
      }
    }
    setLoading(false);
  });

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setError("");
    try {
      const u = await loginRequest(email(), password());
      setUser(u);
      setPage(u.role === "admin" ? "classifications" : "log");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setPage("log");
  };

  return (
    <Show when={!loading()} fallback={<div class="min-h-screen bg-background" />}>
    <div class="min-h-screen bg-background">
      <Show
        when={user()}
        fallback={
          <div class="flex min-h-screen items-center justify-center">
            <Card class="w-full max-w-sm">
              <CardHeader>
                <CardTitle>AIGuidebook</CardTitle>
                <CardDescription>Log in to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} class="grid gap-4">
                  <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@ntnu.no"
                      value={email()}
                      onInput={(e) => setEmail(e.currentTarget.value)}
                    />
                  </div>
                  <div class="grid gap-2">
                    <Label for="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password()}
                      onInput={(e) => setPassword(e.currentTarget.value)}
                    />
                  </div>
                  {error() && (
                    <p class="text-destructive text-sm">{error()}</p>
                  )}
                  <Button type="submit" class="w-full">
                    Log in
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        }
      >
        {/* Navigation bar */}
        <nav class="border-b bg-card">
          <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div class="flex items-center gap-1">
              <span class="mr-4 font-semibold">AIGuidebook</span>
              {NAV_STUDENT.map((item) => (
                <Button
                  variant={page() === item.page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPage(item.page)}
                >
                  {item.label}
                </Button>
              ))}
              <Show when={user()!.role === "admin"}>
                <span class="mx-2 text-border">|</span>
                {NAV_ADMIN.map((item) => (
                  <Button
                    variant={page() === item.page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPage(item.page)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Show>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-muted-foreground">
                {user()!.name} ({user()!.role})
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <Switch>
          <Match when={page() === "log"}>
            <LogUsage />
          </Match>
          <Match when={page() === "history"}>
            <UsageHistory />
          </Match>
          <Match when={page() === "declare"}>
            <SubmitDeclaration />
          </Match>
          <Match when={page() === "classifications"}>
            <Classifications />
          </Match>
          <Match when={page() === "alerts"}>
            <Alerts />
          </Match>
        </Switch>
      </Show>
      <Toaster richColors closeButton />
    </div>
    </Show>
  );
}

export default App;
