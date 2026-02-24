import { createSignal, onMount, For, Show } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Badge } from "@/components/badge";
import { api } from "@/lib/api";

type Classification = {
  id: number;
  studentId: number;
  assignmentId: number;
  riskLevel: string;
  undeclaredTools: string[] | null;
  declaredNotLogged: string[] | null;
  createdAt: string;
};

const ASSIGNMENTS: Record<number, string> = {
  1: "Essay on AI Ethics",
  2: "Programming Assignment 1",
  3: "Final Project Report",
};

function riskBadgeVariant(level: string) {
  switch (level.toLowerCase()) {
    case "low":
      return "secondary" as const;
    case "medium":
      return "outline" as const;
    case "high":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export default function Classifications() {
  const [classifications, setClassifications] = createSignal<Classification[]>(
    [],
  );
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      const data = await api.getClassifications();
      setClassifications(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load classifications",
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="mx-auto max-w-3xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Risk Classifications</CardTitle>
          <CardDescription>All student risk assessments</CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-4">
          {/* Loading */}
          <Show when={loading()}>
            <p class="text-sm text-muted-foreground">
              Loading classifications...
            </p>
          </Show>

          {/* Error */}
          <Show when={error()}>
            <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error()}
            </div>
          </Show>

          {/* Empty state */}
          <Show when={!loading() && !error() && classifications().length === 0}>
            <p class="text-sm text-muted-foreground">
              No classifications found.
            </p>
          </Show>

          {/* Classification list */}
          <Show when={!loading() && classifications().length > 0}>
            <div class="flex flex-col gap-3">
              <For each={classifications()}>
                {(c) => (
                  <div class="flex flex-col gap-2 rounded-lg border p-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <Badge
                          variant={riskBadgeVariant(c.riskLevel)}
                          class={
                            c.riskLevel.toLowerCase() === "low"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : undefined
                          }
                        >
                          {c.riskLevel.toUpperCase()}
                        </Badge>
                        <span class="text-sm font-medium">
                          Student {c.studentId}
                        </span>
                        <span class="text-sm text-muted-foreground">
                          {ASSIGNMENTS[c.assignmentId] ??
                            `Assignment ${c.assignmentId}`}
                        </span>
                      </div>
                      <span class="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Undeclared tools */}
                    <Show
                      when={
                        c.undeclaredTools && c.undeclaredTools.length > 0
                      }
                    >
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-muted-foreground">
                          Undeclared:
                        </span>
                        <div class="flex flex-wrap gap-1">
                          <For each={c.undeclaredTools!}>
                            {(tool) => (
                              <Badge variant="destructive" class="text-xs">
                                {tool}
                              </Badge>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>

                    {/* Declared but not logged */}
                    <Show
                      when={
                        c.declaredNotLogged &&
                        c.declaredNotLogged.length > 0
                      }
                    >
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-muted-foreground">
                          Declared but not logged:
                        </span>
                        <div class="flex flex-wrap gap-1">
                          <For each={c.declaredNotLogged!}>
                            {(tool) => (
                              <Badge variant="outline" class="text-xs">
                                {tool}
                              </Badge>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
