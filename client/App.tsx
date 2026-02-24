import { createSignal, onMount } from "solid-js";
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

type User = { name: string; email: string; role: string };

async function login(email: string, password: string) {
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

function App() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);

  // On mount: try to restore session, or auto-login with seed user in dev
  onMount(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUser(await res.json());
        setLoading(false);
        return;
      }
      localStorage.removeItem("token");
    }

    // Dev auto-login with seeded student
    if (import.meta.env.DEV) {
      try {
        const u = await login("student@ntnu.no", "password123");
        setUser(u);
      } catch {
        // Seed user doesn't exist yet, show login form
      }
    }
    setLoading(false);
  });

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setError("");
    try {
      const u = await login(email(), password());
      setUser(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  if (loading()) {
    return null;
  }

  return (
    <div class="min-h-screen flex items-center justify-center">
      {user() ? (
        <Card class="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Welcome, {user()!.name}</CardTitle>
            <CardDescription>Role: {user()!.role}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              class="w-full"
              onClick={() => {
                localStorage.removeItem("token");
                setUser(null);
              }}
            >
              Log out
            </Button>
          </CardContent>
        </Card>
      ) : (
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
      )}
      <Toaster richColors closeButton />
    </div>
  );
}

export default App;
