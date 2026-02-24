import { createSignal, createEffect, onMount, For, Show } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { api } from "@/lib/api";

type LogEntry = {
  id: number;
  tool: string;
  taskTypes: string[];
  assignmentId: number;
  createdAt: string;
};

const ASSIGNMENTS: Record<number, string> = {
  1: "Essay on AI Ethics",
  2: "Programming Assignment 1",
  3: "Final Project Report",
};

const TOOL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  copilot: "Copilot",
  claude: "Claude",
  other: "Other",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function UsageHistory() {
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [filter, setFilter] = createSignal<number | null>(null);
  const [loading, setLoading] = createSignal(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = filter() !== null ? { assignment_id: filter()! } : undefined;
      setLogs(await api.getLogs(params));
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  onMount(fetchLogs);

  createEffect(() => {
    // Track the filter signal so the effect re-runs when it changes
    filter();
    fetchLogs();
  });

  return (
    <div class="w-full max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Your AI usage log entries</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          {/* Filter bar */}
          <div class="flex flex-wrap gap-2">
            <Button
              variant={filter() === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(null)}
            >
              All
            </Button>
            <For each={Object.entries(ASSIGNMENTS)}>
              {([id, name]) => (
                <Button
                  variant={filter() === Number(id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(Number(id))}
                >
                  {name}
                </Button>
              )}
            </For>
          </div>

          {/* Loading state */}
          <Show when={loading()}>
            <div class="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Loading...
            </div>
          </Show>

          {/* Content */}
          <Show when={!loading()}>
            <Show
              when={logs().length > 0}
              fallback={
                <div class="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  No entries yet
                </div>
              }
            >
              <div class="flex flex-col gap-2">
                <For each={logs()}>
                  {(entry) => (
                    <div class="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        {/* Tool badge */}
                        <Badge>{TOOL_LABELS[entry.tool] ?? entry.tool}</Badge>

                        {/* Task type badges */}
                        <div class="flex flex-wrap gap-1">
                          <For each={entry.taskTypes}>
                            {(taskType) => (
                              <Badge variant="secondary">{taskType}</Badge>
                            )}
                          </For>
                        </div>
                      </div>

                      <div class="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{ASSIGNMENTS[entry.assignmentId] ?? `Assignment ${entry.assignmentId}`}</span>
                        <span class="whitespace-nowrap">{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
