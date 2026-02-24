import { createSignal, onMount, For, Show } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { api } from "@/lib/api";

const TOOLS = ["chatgpt", "copilot", "claude", "other"] as const;
const TOOL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  copilot: "Copilot",
  claude: "Claude",
  other: "Other",
};

const ASSIGNMENTS = [
  { id: 1, title: "Essay on AI Ethics" },
  { id: 2, title: "Programming Assignment 1" },
  { id: 3, title: "Final Project Report" },
];
const ASSIGNMENT_MAP: Record<number, string> = Object.fromEntries(
  ASSIGNMENTS.map((a) => [a.id, a.title]),
);

type Declaration = { id: number; assignmentId: number; declaredTools: string[]; createdAt: string };

export default function SubmitDeclaration() {
  const [assignmentId, setAssignmentId] = createSignal<number>(0);
  const [declaredTools, setDeclaredTools] = createSignal<string[]>([]);
  const [message, setMessage] = createSignal("");
  const [error, setError] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const [existing, setExisting] = createSignal<Declaration[]>([]);

  const loadDeclarations = async () => {
    try {
      setExisting(await api.getDeclarations());
    } catch {
      // ignore
    }
  };

  onMount(loadDeclarations);

  const toggleTool = (t: string) => {
    setDeclaredTools((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!assignmentId() || declaredTools().length === 0) {
      setError("Please select an assignment and at least one tool");
      return;
    }

    setSubmitting(true);
    try {
      await api.createDeclaration({
        assignmentId: assignmentId(),
        declaredTools: declaredTools(),
      });
      setMessage("Declaration submitted successfully!");
      setAssignmentId(0);
      setDeclaredTools([]);
      await loadDeclarations();
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        setError("Declaration already exists for this assignment");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to submit declaration",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="mx-auto max-w-2xl py-8 px-4 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Declaration</CardTitle>
          <CardDescription>
            Declare which AI tools you used for an assignment
          </CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-6">
          {/* Assignment selector */}
          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Assignment</span>
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

          {/* Tool multi-selector */}
          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">AI Tools Used</span>
            <div class="flex flex-row flex-wrap gap-2">
              <For each={[...TOOLS]}>
                {(t) => (
                  <Badge
                    variant={
                      declaredTools().includes(t) ? "default" : "outline"
                    }
                    class="cursor-pointer select-none px-3 py-1 text-sm"
                    onClick={() => toggleTool(t)}
                  >
                    {TOOL_LABELS[t]}
                  </Badge>
                )}
              </For>
            </div>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={submitting()} size="lg">
            {submitting() ? "Submitting..." : "Submit Declaration"}
          </Button>

          <Show when={message()}>
            <div class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              {message()}
            </div>
          </Show>

          <Show when={error()}>
            <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error()}
            </div>
          </Show>
        </CardContent>
      </Card>

      {/* Existing declarations */}
      <Show when={existing().length > 0}>
        <Card>
          <CardHeader>
            <CardTitle>Your Declarations</CardTitle>
            <CardDescription>Previously submitted declarations</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-3">
            <For each={existing()}>
              {(d) => (
                <div class="flex items-center justify-between rounded-md border px-4 py-3">
                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium">
                      {ASSIGNMENT_MAP[d.assignmentId] ?? `Assignment ${d.assignmentId}`}
                    </span>
                    <div class="flex flex-wrap gap-1">
                      <For each={d.declaredTools}>
                        {(t) => (
                          <Badge variant="secondary" class="text-xs">
                            {TOOL_LABELS[t] ?? t}
                          </Badge>
                        )}
                      </For>
                    </div>
                  </div>
                  <span class="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </For>
          </CardContent>
        </Card>
      </Show>
    </div>
  );
}
