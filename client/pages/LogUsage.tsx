import { createSignal, For, Show } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { Label } from "@/components/label";
import { api } from "@/lib/api";

const TOOLS = ["chatgpt", "copilot", "claude", "other"] as const;
const TOOL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  copilot: "Copilot",
  claude: "Claude",
  other: "Other",
};

const TASK_TYPES = [
  "grammar",
  "summarizing",
  "drafting",
  "coding",
  "direct_answers",
] as const;
const TASK_LABELS: Record<string, string> = {
  grammar: "Grammar",
  summarizing: "Summarizing",
  drafting: "Drafting",
  coding: "Coding",
  direct_answers: "Direct Answers",
};

const ASSIGNMENTS = [
  { id: 1, title: "Essay on AI Ethics" },
  { id: 2, title: "Programming Assignment 1" },
  { id: 3, title: "Final Project Report" },
];

export default function LogUsage() {
  const [tool, setTool] = createSignal<string>("");
  const [taskTypes, setTaskTypes] = createSignal<string[]>([]);
  const [assignmentId, setAssignmentId] = createSignal<number>(0);
  const [message, setMessage] = createSignal("");
  const [error, setError] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);

  const toggleTaskType = (t: string) => {
    setTaskTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!tool() || taskTypes().length === 0 || !assignmentId()) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.createLog({
        tool: tool(),
        taskTypes: taskTypes(),
        assignmentId: assignmentId(),
      });
      setMessage("Log entry created!");
      setTool("");
      setTaskTypes([]);
      setAssignmentId(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create log");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Log AI Usage</CardTitle>
          <CardDescription>
            Record which AI tool you used and what for
          </CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-6">
          {/* Tool selector */}
          <div class="flex flex-col gap-2">
            <Label>AI Tool</Label>
            <div class="flex flex-row gap-2">
              <For each={[...TOOLS]}>
                {(t) => (
                  <Button
                    variant={tool() === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTool(t)}
                  >
                    {TOOL_LABELS[t]}
                  </Button>
                )}
              </For>
            </div>
          </div>

          {/* Task types */}
          <div class="flex flex-col gap-2">
            <Label>Task Types</Label>
            <div class="flex flex-row flex-wrap gap-2">
              <For each={[...TASK_TYPES]}>
                {(t) => (
                  <Badge
                    variant={taskTypes().includes(t) ? "default" : "outline"}
                    class="cursor-pointer select-none px-3 py-1 text-sm"
                    onClick={() => toggleTaskType(t)}
                  >
                    {TASK_LABELS[t]}
                  </Badge>
                )}
              </For>
            </div>
          </div>

          {/* Assignment selector */}
          <div class="flex flex-col gap-2">
            <Label>Assignment</Label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <For each={ASSIGNMENTS}>
                {(a) => (
                  <Button
                    variant={assignmentId() === a.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssignmentId(a.id)}
                    class="justify-start"
                  >
                    {a.title}
                  </Button>
                )}
              </For>
            </div>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={submitting()} size="lg">
            {submitting() ? "Submitting..." : "Submit"}
          </Button>

          {/* Success message */}
          <Show when={message()}>
            <div class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              {message()}
            </div>
          </Show>

          {/* Error message */}
          <Show when={error()}>
            <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error()}
            </div>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
