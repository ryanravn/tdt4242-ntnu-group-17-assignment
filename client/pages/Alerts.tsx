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

type Alert = {
  id: number;
  classificationId: number;
  studentId: number;
  assignmentId: number;
  riskLevel: string;
  createdAt: string;
};

const ASSIGNMENTS: Record<number, string> = {
  1: "Essay on AI Ethics",
  2: "Programming Assignment 1",
  3: "Final Project Report",
};

export default function Alerts() {
  const [alerts, setAlerts] = createSignal<Alert[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load alerts",
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="mx-auto max-w-3xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>High Risk Alerts</CardTitle>
          <CardDescription>
            Students flagged for follow-up
          </CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-4">
          {/* Loading */}
          <Show when={loading()}>
            <p class="text-sm text-muted-foreground">Loading alerts...</p>
          </Show>

          {/* Error */}
          <Show when={error()}>
            <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error()}
            </div>
          </Show>

          {/* Empty state */}
          <Show when={!loading() && !error() && alerts().length === 0}>
            <p class="text-sm text-muted-foreground">No alerts found.</p>
          </Show>

          {/* Alert list */}
          <Show when={!loading() && alerts().length > 0}>
            <div class="flex flex-col gap-3">
              <For each={alerts()}>
                {(a) => (
                  <div class="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/30">
                    <div class="flex items-center gap-3">
                      <Badge variant="destructive">
                        {a.riskLevel.toUpperCase()}
                      </Badge>
                      <span class="text-sm font-medium">
                        Student {a.studentId}
                      </span>
                      <span class="text-sm text-muted-foreground">
                        {ASSIGNMENTS[a.assignmentId] ??
                          `Assignment ${a.assignmentId}`}
                      </span>
                    </div>
                    <span class="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
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
